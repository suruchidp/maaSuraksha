import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Bot, Send, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useCurrentLanguage } from '@/hooks/useAuth';
import { createConversation, listConversations, listMessages, sendMessage, getChatCapabilities } from '@/services/chat';
import { getApiErrorMessage } from '@/lib/api';
import type { ChatMessageDTO } from '@/lib/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';

type Payload = {message:string;requestId:string;language:'en'|'hi'|'kn';useHealthContext:boolean;allowExternalAi:boolean};
export default function ChatbotPage() {
 const {t}=useTranslation();
 const lang=useCurrentLanguage();
 const actor=useAuthStore(s=>s.user?.id);
 const qc=useQueryClient();
 const [active,setActive]=useState<string|null>(null);
 const [conversationPage,setConversationPage]=useState(1);
 const [messagePage,setMessagePage]=useState(1);
 const [draft,setDraft]=useState('');
 const [context,setContext]=useState(false);
 const [external,setExternal]=useState(false);
 const capabilities=useQuery({queryKey:['chat-capabilities',actor],queryFn:getChatCapabilities,enabled:!!actor});
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 const sending=useRef(false);
 const retry=useRef<{conversation:string;payload:Payload}|null>(null);
 const bottomRef=useRef<HTMLDivElement>(null);
 const conversations=useQuery({queryKey:['chat-conversations',actor,conversationPage],queryFn:()=>listConversations({page:conversationPage,limit:20}),enabled:!!actor});
 const messages=useQuery({queryKey:['chat-messages',actor,active,messagePage],queryFn:()=>listMessages(active!,{page:messagePage,limit:100}),enabled:!!actor&&!!active});
 const send=useMutation({mutationFn:({conversation,payload}:{conversation:string;payload:Payload})=>sendMessage(conversation,payload.message,payload)});
 useEffect(()=>{if(messagePage===1) bottomRef.current?.scrollIntoView?.({block:'nearest'});},[messages.data,messagePage]);
 useEffect(()=>{if(!active && conversations.data?.items.length) setActive(conversations.data.items[0].id);},[active,conversations.data]);
 useEffect(()=>{setActive(null);setDraft('');setError('');setContext(false);setExternal(false);retry.current=null;setConversationPage(1);setMessagePage(1);},[actor]);
 async function newChat() {
  if(sending.current)return;
  sending.current=true;setBusy(true);setError('');
  try {const c=await createConversation();setActive(c.id);setConversationPage(1);setMessagePage(1);setDraft('');retry.current=null;await qc.invalidateQueries({queryKey:['chat-conversations',actor]});}
  catch(e){setError(getApiErrorMessage(e));}finally{sending.current=false;setBusy(false);}
 }
 async function submit(e:React.FormEvent) {
  e.preventDefault();const text=draft.trim();if(!text||sending.current)return;
  sending.current=true;setBusy(true);setError('');
  try {
   // Capture destination and the exact request before awaiting creation. A new
   // conversation's first message must never use the old render's empty ID.
   const destination=active??(await createConversation()).id;
   setActive(destination);
   const previous=retry.current;
   const payload:Payload=previous?.conversation===destination && previous.payload.message===text && previous.payload.language===lang && previous.payload.useHealthContext===context && previous.payload.allowExternalAi===(external&&!!capabilities.data?.externalAiAvailable)
    ? previous.payload : {message:text,requestId:crypto.randomUUID(),language:lang,useHealthContext:context,allowExternalAi:external&&!!capabilities.data?.externalAiAvailable};
   retry.current={conversation:destination,payload};
   await send.mutateAsync({conversation:destination,payload});
   setDraft('');retry.current=null;setMessagePage(1);
   await Promise.all([qc.invalidateQueries({queryKey:['chat-conversations',actor]}),qc.invalidateQueries({queryKey:['chat-messages',actor,destination]}),qc.invalidateQueries({queryKey:['alerts']}),qc.invalidateQueries({queryKey:['referrals']}),qc.invalidateQueries({queryKey:['pregnancy-tracking']})]);
  }catch(e){setError(getApiErrorMessage(e));}finally{sending.current=false;setBusy(false);}
 }
 const items=messages.data?.items??[];
 const safety=items.filter(m=>m.role==='assistant' && m.metadata?.requiresHumanReview===true).at(-1);
 const select=(id:string)=>{if(!busy){setActive(id);setMessagePage(1);setError('');retry.current=null;}};
 return <div className="space-y-5">
  <PageHeader title={t('chatbot.title')} subtitle={t('chatbot.subtitle')} />
  <div className="rounded-2xl bg-lavender-50 border border-lavender-200 p-4 text-sm space-y-2"><p className="font-medium"><Bot className="inline w-4 h-4 mr-2"/>{t('chatbot.localMode')}</p><p>{t('chatbot.disclaimer')}</p><p>{t('chatbot.privacy')}</p><p className="text-primary-800">{t('chatbot.emergency')}</p></div>
  <Card className="p-4"><div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-4">
   <aside className="space-y-3 sm:border-r sm:pr-4"><Button onClick={()=>void newChat()} disabled={busy}>{t('chatbot.newChat')}</Button>
    {conversations.isLoading?<Spinner/>:conversations.isError?<ErrorState message={getApiErrorMessage(conversations.error)} onRetry={()=>void conversations.refetch()}/>:<><label className="block text-sm" htmlFor="chat-history">{t('chatbot.history')}</label><select id="chat-history" className="input-field w-full" aria-label={t('chatbot.history')} value={active??''} onChange={e=>select(e.target.value)} disabled={busy}><option value="">{t('chatbot.chooseConversation')}</option>{conversations.data?.items.map(c=><option key={c.id} value={c.id}>{c.title||t('chatbot.untitled')}</option>)}</select><div className="flex gap-2"><Button disabled={busy||conversationPage===1} onClick={()=>setConversationPage(p=>p-1)}>{t('chatbot.newer')}</Button><Button disabled={busy||conversationPage>=(conversations.data?.totalPages??1)} onClick={()=>setConversationPage(p=>p+1)}>{t('chatbot.older')}</Button></div></>}
   </aside>
   <section className="min-w-0 space-y-3">
    <div role="log" aria-label={t('chatbot.messages')} aria-live="polite" className="h-[50vh] min-h-[250px] overflow-y-auto space-y-4 p-3 bg-cream-50 rounded-xl">
     {messages.isLoading&&active?<Spinner/>:messages.isError?<ErrorState message={getApiErrorMessage(messages.error)} onRetry={()=>void messages.refetch()}/>:items.length?items.map(m=><MessageBubble key={m.id} message={m}/>):<p className="text-gray-500">{t('chatbot.startDescription')}</p>}
     <div ref={bottomRef}/>
    </div>
    {active&&<div className="flex gap-2"><Button disabled={busy||messagePage===1} onClick={()=>setMessagePage(p=>p-1)}>{t('chatbot.newerMessages')}</Button><Button disabled={busy||messagePage>=(messages.data?.totalPages??1)} onClick={()=>setMessagePage(p=>p+1)}>{t('chatbot.olderMessages')}</Button><span className="text-xs text-gray-500 self-center">{items.length} / {messages.data?.total??0}</span></div>}
    {safety&&<div role="alert" className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-900"><AlertTriangle className="inline w-4 h-4 mr-2"/>{t('chatbot.humanReview')}<p className="mt-2">{t(safety.metadata?.escalation==='created'?'chatbot.referralCreated':'chatbot.escalationFailed')}</p><div className="flex gap-4 mt-2"><Link to="/patient/alerts">{t('chatbot.viewAlerts')}</Link><Link to="/patient/referrals">{t('chatbot.viewReferrals')}</Link></div></div>}
    {error&&<div role="alert" className="text-red-700 text-sm">{error} {t('chatbot.draftKept')}</div>}
    <form onSubmit={e=>void submit(e)} className="space-y-3"><label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={context} onChange={e=>setContext(e.target.checked)} disabled={busy}/>{t('chatbot.useContext')}</label>{capabilities.data?.externalAiAvailable&&<label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={external} onChange={e=>setExternal(e.target.checked)} disabled={busy}/>{t('chatbot.externalConsent')}</label>}<label htmlFor="chat-draft" className="sr-only">{t('chatbot.placeholder')}</label><textarea id="chat-draft" className="input-field w-full resize-none" value={draft} onChange={e=>setDraft(e.target.value)} placeholder={t('chatbot.placeholder')} rows={3} maxLength={2000} disabled={busy}/><div className="flex items-center justify-between"><span className="text-xs text-gray-500">{draft.length}/2000</span><Button type="submit" loading={busy} disabled={busy||!draft.trim()}><Send className="w-4 h-4"/>{t('chatbot.send')}</Button></div></form>
   </section>
  </div></Card>
 </div>;
}
function MessageBubble({message:m}:{message:ChatMessageDTO}) {
 const {t}=useTranslation();
 const sources=Array.isArray(m.metadata?.sources)?m.metadata.sources as {title:string;url:string}[]:[];
 return <article className={`rounded-2xl p-4 text-sm ${m.role==='user'?'bg-primary-50 ml-6':'bg-white border border-rose-100 mr-6'}`}><p className="font-medium mb-2">{t(m.role==='user'?'chatbot.you':'chatbot.assistant')}</p><p className="whitespace-pre-wrap">{m.content}</p>{m.role==='assistant'&&<p className="mt-2 text-xs text-gray-500">{t(m.metadata?.mode==='openai'?'chatbot.generatedMode':'chatbot.resourceMode')}{m.metadata?.providerFallback===true?` · ${t('chatbot.providerFallback')}`:''}</p>}{m.role==='assistant'&&sources.length>0&&<ul className="mt-3 space-y-1">{sources.filter(s=>typeof s.url==='string'&&/^https:\/\//u.test(s.url)).map(s=><li key={s.url}><a className="text-primary-700 underline" href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a></li>)}</ul>}</article>;
}
