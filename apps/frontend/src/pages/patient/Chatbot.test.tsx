import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import ChatbotPage from './Chatbot';
const mocks=vi.hoisted(()=>({create:vi.fn(),list:vi.fn(),messages:vi.fn(),send:vi.fn(),user:{id:'patient-1'},history:[] as any[],capabilities:vi.fn(),conversations:[] as any[]}));
vi.mock('@/services/chat',()=>({createConversation:mocks.create,listConversations:mocks.list,listMessages:mocks.messages,sendMessage:mocks.send,getChatCapabilities:mocks.capabilities}));
vi.mock('@/stores/authStore',()=>({useAuthStore:(selector:Function)=>selector({user:mocks.user})}));
const conversation={id:'conversation-new',title:'Diet question'};
const pair=[{id:'u1',role:'user',content:'Diet question'},{id:'a1',role:'assistant',content:'Resource answer, not a diagnosis',metadata:{sources:[{title:'NHS diet',url:'https://www.nhs.uk/pregnancy/keeping-well/have-a-healthy-diet/'}]}}];
const page=(items:any[],total=items.length)=>({items,total,totalPages:Math.max(1,Math.ceil(total/100)),page:1,limit:100});
function setup(){return render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}})}><MemoryRouter><ChatbotPage/></MemoryRouter></QueryClientProvider>);}
beforeEach(()=>{
 vi.clearAllMocks();mocks.capabilities.mockResolvedValue({externalAiAvailable:false});mocks.history=[];mocks.conversations=[];
 mocks.list.mockImplementation(async()=>page(mocks.conversations));mocks.messages.mockImplementation(async()=>page(mocks.history));
 mocks.create.mockImplementation(async()=>{mocks.conversations=[conversation];return conversation;});
 mocks.send.mockImplementation(async()=>{mocks.history=pair;return {userMessage:pair[0],assistantMessage:pair[1],requiresHumanReview:false};});
});
describe('Chatbot experience',()=>{
 it('sends the first question to the newly created conversation and renders the persisted assistant reply and source',async()=>{
  const user=userEvent.setup();setup();await user.type(screen.getByRole('textbox',{name:'Type your question here...'}),'Diet question');await user.click(screen.getByRole('button',{name:'Send'}));
  await screen.findByText('Resource answer, not a diagnosis');expect(mocks.create).toHaveBeenCalledTimes(1);expect(mocks.send).toHaveBeenCalledWith('conversation-new','Diet question',expect.objectContaining({useHealthContext:false,language:'en',requestId:expect.any(String)}));expect(screen.getByRole('link',{name:'NHS diet'})).toHaveAttribute('rel','noopener noreferrer');expect(screen.getByRole('textbox')).toHaveValue('');
 });
 it('preserves a failed draft and reuses its request ID on retry without creating a second conversation',async()=>{
  mocks.send.mockRejectedValueOnce(new Error('Connection lost'));
  const user=userEvent.setup();setup();const input=screen.getByRole('textbox');await user.type(input,'Diet question');await user.click(screen.getByRole('button',{name:'Send'}));await screen.findByText(/Connection lost/);expect(input).toHaveValue('Diet question');
  await user.click(screen.getByRole('button',{name:'Send'}));await screen.findByText('Resource answer, not a diagnosis');expect(mocks.create).toHaveBeenCalledTimes(1);expect(mocks.send.mock.calls[0][2].requestId).toBe(mocks.send.mock.calls[1][2].requestId);
 });
 it('uses health context only after an explicit choice and explains safety sharing',async()=>{
  const user=userEvent.setup();setup();expect(screen.getByRole('checkbox')).not.toBeChecked();expect(screen.getByText(/By default, no chat data is sent to an external AI service/)).toBeVisible();await user.click(screen.getByRole('checkbox'));await user.type(screen.getByRole('textbox'),'Diet question');await user.click(screen.getByRole('button',{name:'Send'}));await screen.findByText('Resource answer, not a diagnosis');expect(mocks.send.mock.calls[0][2].useHealthContext).toBe(true);
 });
 it('shows persisted urgent escalation after reopening history, with direct alerts/referrals links and no claim of clinician review',async()=>{
  mocks.conversations=[conversation];mocks.history=[{...pair[1],content:'Seek care immediately',metadata:{requiresHumanReview:true,escalation:'created'}}];setup();await screen.findByText('Seek care immediately');expect(screen.getByText(/This does not mean a clinician has seen/)).toBeVisible();expect(screen.getByRole('link',{name:'View alerts'})).toHaveAttribute('href','/patient/alerts');expect(screen.getByRole('link',{name:'View referrals'})).toHaveAttribute('href','/patient/referrals');
 });
 it('shows failed escalation honestly while preserving urgent care advice',async()=>{
  mocks.conversations=[conversation];mocks.history=[{...pair[1],metadata:{requiresHumanReview:true,escalation:'failed'}}];setup();await screen.findByText(/Automated escalation is not confirmed/);expect(screen.getByText(/Seek medical assessment now/)).toBeVisible();
 });
 it('keeps history available on small screens, paginates older messages and starts a separate conversation',async()=>{
  mocks.conversations=[conversation];mocks.messages.mockResolvedValue(page(pair,102));const user=userEvent.setup();setup();await screen.findByText('Resource answer, not a diagnosis');await user.click(screen.getByRole('button',{name:'Older messages'}));await waitFor(()=>expect(mocks.messages).toHaveBeenLastCalledWith('conversation-new',{page:2,limit:100}));await user.click(screen.getByRole('button',{name:'New conversation'}));await waitFor(()=>expect(mocks.create).toHaveBeenCalledTimes(1));expect(screen.getByRole('combobox',{name:'Conversation history'})).toBeVisible();
 });
 it('offers retry on history failure and safely renders message text without executable HTML or unsafe links',async()=>{
  mocks.conversations=[conversation];mocks.messages.mockRejectedValueOnce(new Error('History unavailable'));mocks.history=[{...pair[1],content:'<script>alert(1)</script>',metadata:{sources:[{title:'Unsafe',url:'javascript:alert(1)'}]}}];const user=userEvent.setup();setup();await screen.findByText('History unavailable');await user.click(screen.getByRole('button',{name:'Try again'}));await screen.findByText('<script>alert(1)</script>');expect(screen.queryByRole('link',{name:'Unsafe'})).not.toBeInTheDocument();
 });
 it('disables duplicate sends and conversation switching while a request is pending',async()=>{
  let resolve!:Function;mocks.send.mockImplementation(()=>new Promise(r=>{resolve=r;}));const user=userEvent.setup();setup();await user.type(screen.getByRole('textbox'),'Diet question');await user.click(screen.getByRole('button',{name:'Send'}));await waitFor(()=>expect(mocks.send).toHaveBeenCalledTimes(1));expect(screen.getByRole('button',{name:'Send'})).toBeDisabled();expect(screen.getByRole('button',{name:'New conversation'})).toBeDisabled();expect(screen.getByRole('combobox')).toBeDisabled();resolve({requiresHumanReview:false});await waitFor(()=>expect(screen.getByRole('button',{name:'New conversation'})).toBeEnabled());
 });
 it('requires a separate external-AI choice even when a provider is configured',async()=>{
  mocks.capabilities.mockResolvedValue({externalAiAvailable:true});const user=userEvent.setup();setup();const consent=await screen.findByRole('checkbox',{name:/Allow this question/});expect(consent).not.toBeChecked();
  await user.type(screen.getByRole('textbox'),'Diet question');await user.click(screen.getByRole('button',{name:'Send'}));await screen.findByText('Resource answer, not a diagnosis');expect(mocks.send.mock.calls[0][2].allowExternalAi).toBe(false);
  await user.click(consent);await user.type(screen.getByRole('textbox'),'Another diet question');await user.click(screen.getByRole('button',{name:'Send'}));await waitFor(()=>expect(mocks.send).toHaveBeenCalledTimes(2));expect(mocks.send.mock.calls[1][2].allowExternalAi).toBe(true);
 });

});
