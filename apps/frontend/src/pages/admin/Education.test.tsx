import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminEducationPage from './Education';
const mocks=vi.hoisted(()=>({list:vi.fn(),create:vi.fn(),update:vi.fn()}));
vi.mock('@/hooks/queries',()=>({useEducation:mocks.list,useCreateEducation:()=>({mutate:mocks.create}),useUpdateEducation:()=>({mutate:mocks.update}),useEducationProgress:()=>({})}));
const maps={en:'Visit preparation',hi:'तैयारी',kn:'ಸಿದ್ಧತೆ'};
beforeEach(()=>{vi.clearAllMocks();mocks.list.mockReturnValue({data:{items:[{id:'e1',title:maps.en,body:'Details',titleLocalized:maps,bodyLocalized:{en:'Details',hi:'विवरण',kn:'ವಿವರ'},category:'pregnancy',tags:[],isActive:false,sources:[]}],totalPages:1}});});
describe('Admin education editor',()=>{
 it('shows inactive resources and preserves all translations when editing',async()=>{
  render(<AdminEducationPage />);expect(screen.getByRole('heading',{name:'Educational Content'})).toBeInTheDocument();expect(screen.getByText('Inactive')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button',{name:'Edit content'}));expect(screen.getByLabelText(/Title \(English\)/)).toHaveValue(maps.en);
  await userEvent.click(screen.getByRole('button',{name:'Save'}));expect(mocks.update).toHaveBeenCalledWith({id:'e1',patch:expect.objectContaining({title:maps,isActive:false})},expect.any(Object));
 });
 it('validates the three languages before sending a new resource',async()=>{
  render(<AdminEducationPage />);await userEvent.click(screen.getByRole('button',{name:'Create content'}));await userEvent.click(screen.getByRole('button',{name:'Save'}));expect(screen.getByRole('alert')).toHaveTextContent('all three languages');expect(mocks.create).not.toHaveBeenCalled();
 });
});
