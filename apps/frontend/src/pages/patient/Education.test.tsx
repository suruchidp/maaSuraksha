import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EducationPage from './Education';
const mocks=vi.hoisted(()=>({list:vi.fn(),mutate:vi.fn(),reset:vi.fn(),progress:vi.fn()}));
vi.mock('@/hooks/queries',()=>({useEducation:mocks.list,useEducationProgress:mocks.progress}));
vi.mock('@/hooks/useAuth',()=>({useCurrentLanguage:()=> 'en'}));
const resource={id:'e1',category:'pregnancy',title:'Visit preparation',body:'Bring your records and questions.',tags:[],isSaved:false,sources:[{title:'NHS',url:'https://www.nhs.uk/pregnancy/'}]};
beforeEach(()=>{vi.clearAllMocks();mocks.progress.mockReturnValue({mutate:mocks.mutate,reset:mocks.reset});mocks.list.mockReturnValue({data:{items:[resource],total:25,totalPages:3},refetch:vi.fn()});});
describe('Patient resource library',()=>{
 it('opens a resource with full text and official source link',async()=>{
  render(<EducationPage />);await userEvent.click(screen.getByRole('button',{name:/Visit preparation/}));
  const modal=within(screen.getByRole('dialog'));expect(modal.getByText(resource.body)).toBeInTheDocument();expect(modal.getByRole('link',{name:'NHS'})).toHaveAttribute('href',resource.sources[0]!.url);
 });
 it('sends category, personalized view, search and pagination to the API',async()=>{
  render(<EducationPage />);await userEvent.click(screen.getByRole('button',{name:'Next'}));expect(mocks.list).toHaveBeenLastCalledWith(expect.objectContaining({page:2}));
  await userEvent.click(screen.getByRole('button',{name:'Nutrition'}));expect(mocks.list).toHaveBeenLastCalledWith(expect.objectContaining({category:'nutrition',page:1}));
  await userEvent.click(screen.getByRole('button',{name:'For you'}));expect(mocks.list).toHaveBeenLastCalledWith(expect.objectContaining({view:'for_you'}));
  await userEvent.type(screen.getByRole('searchbox'),'visit');await waitFor(()=>expect(mocks.list).toHaveBeenLastCalledWith(expect.objectContaining({search:'visit'})));
 });
 it('saves resources independently of reading progress',async()=>{
  render(<EducationPage />);await userEvent.click(screen.getByRole('button',{name:'Save'}));expect(mocks.mutate).toHaveBeenCalledWith({id:'e1',isSaved:true},expect.any(Object));
  await userEvent.click(screen.getByRole('button',{name:'Mark as read'}));expect(mocks.mutate).toHaveBeenLastCalledWith({id:'e1',isRead:true},expect.any(Object));
 });
 it('shows a failed save and keeps the resource action available for retry',()=>{
  mocks.progress.mockReturnValue({mutate:mocks.mutate,reset:mocks.reset,isError:true,error:new Error('Save failed')});render(<EducationPage />);expect(screen.getByRole('alert')).toHaveTextContent('Save failed');expect(screen.getByRole('button',{name:'Save'})).toBeEnabled();
 });
 it('shows a recoverable error instead of an empty library when the API fails',async()=>{
  const refetch=vi.fn();mocks.list.mockReturnValue({isError:true,error:new Error('Connection failed'),refetch});render(<EducationPage />);expect(screen.getByText('Connection failed')).toBeInTheDocument();await userEvent.click(screen.getByRole('button',{name:'Try again'}));expect(refetch).toHaveBeenCalled();
 });
});
