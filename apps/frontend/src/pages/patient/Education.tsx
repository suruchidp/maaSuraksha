import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EDUCATIONAL_CATEGORIES, Language } from '@maasuraksha/shared';
import { BookOpen, Bookmark, Check } from 'lucide-react';
import { useEducation, useEducationProgress } from '@/hooks/queries';
import { useCurrentLanguage } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { EducationalContentDTO } from '@/lib/types';

export function pickLocalized(value:Record<Language,string>|string|undefined,lang:Language):string {
 if(typeof value==='string') return value;
 return value?.[lang] || value?.en || '';
}
export default function EducationPage() {
 const {t}=useTranslation();const lang=useCurrentLanguage();
 const [category,setCategory]=useState('all');const [view,setView]=useState('all');const [page,setPage]=useState(1);
 const [search,setSearch]=useState('');const [query,setQuery]=useState('');
 const [selected,setSelected]=useState<EducationalContentDTO|null>(null);
 const progress=useEducationProgress();
 useEffect(()=>{if(search.trim()===query) return;const timer=setTimeout(()=>{setQuery(search.trim());setPage(1);},300);return()=>clearTimeout(timer);},[search,query]);
 const education=useEducation({lang,page,limit:12,category:category==='all'?undefined:category,search:query || undefined,view});
 const items=education.data?.items ?? [];
 const title=(item:EducationalContentDTO)=>pickLocalized(item.titleLocalized ?? item.title,lang);
 const body=(item:EducationalContentDTO)=>pickLocalized(item.bodyLocalized ?? item.body,lang);
 const change=(item:EducationalContentDTO,patch:{isSaved?:boolean;isRead?:boolean})=>{
  if(progress.isPending) return;
  progress.mutate({id:item.id,...patch},{onSuccess:(result)=>{
   setSelected(current=>current?.id===item.id?{...current,isSaved:result.isSaved,readAt:result.readAt}:current);
   if(view==='saved' && patch.isSaved===false && items.length===1 && page>1) setPage(page-1);
  }});
 };
 const actions=(item:EducationalContentDTO)=><div className="flex flex-wrap gap-2 mt-3">
  <Button size="sm" variant={item.isSaved?'secondary':'outline'} disabled={progress.isPending} aria-pressed={!!item.isSaved} onClick={()=>change(item,{isSaved:!item.isSaved})}>
   <Bookmark className="w-4 h-4" aria-hidden />{t(item.isSaved?'education.unsave':'education.save')}
  </Button>
  <Button size="sm" variant="ghost" disabled={progress.isPending} aria-pressed={!!item.readAt} onClick={()=>change(item,{isRead:!item.readAt})}>
   <Check className="w-4 h-4" aria-hidden />{t(item.readAt?'education.markUnread':'education.markRead')}
  </Button>
 </div>;
 return <div className="space-y-6">
  <PageHeader title={t('education.title')} subtitle={t('education.subtitle')} actions={<Button variant="outline" loading={education.isFetching} onClick={()=>education.refetch()}>{t('education.refresh')}</Button>} />
  <Card>
   <div className="space-y-4">
    <div role="group" aria-label={t('education.libraryViews')} className="flex flex-wrap gap-2">
     {['all','for_you','saved'].map(value=><Button key={value} variant={view===value?'primary':'outline'} aria-pressed={view===value} onClick={()=>{setView(value);setPage(1);progress.reset();}}>{t('education.views.'+value)}</Button>)}
    </div>
    <Input type="search" aria-label={t('education.search')} placeholder={t('education.search')} maxLength={100} value={search} onChange={event=>setSearch(event.target.value)} />
    <div role="group" aria-label={t('education.allCategories')} className="flex flex-wrap gap-2">
     {['all',...EDUCATIONAL_CATEGORIES].map(value=><Button key={value} size="sm" variant={category===value?'secondary':'ghost'} aria-pressed={category===value} onClick={()=>{setCategory(value);setPage(1);}}>{value==='all'?t('education.allCategories'):t('education.category.'+value)}</Button>)}
    </div>
   </div>
  </Card>
  {view==='for_you' && <p className="text-sm text-gray-500">{t('education.personalization')}</p>}
  {progress.isError && !selected && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{getApiErrorMessage(progress.error)}</p>}
  {education.isLoading?<Spinner />:education.isError?<ErrorState message={getApiErrorMessage(education.error)} onRetry={()=>education.refetch()} />:items.length===0?<Card><EmptyState icon={<BookOpen className="w-6 h-6 text-primary-400" aria-hidden />} title={t('education.noResults')} description={t(view==='saved'?'education.noSaved':'education.noResultsDescription')} /></Card>:<>
   <p className="text-sm text-gray-500" role="status">{t('education.count',{count:education.data?.total ?? 0})}</p>
   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {items.map(item=><Card key={item.id}>
     <span className="text-xs font-medium text-primary-700">{t('education.category.'+item.category)}</span>
     {item.readAt && <span className="text-xs text-green-700 ml-2">{t('education.read')}</span>}
     <button onClick={()=>{setSelected(item);progress.reset();}} className="block w-full text-left mt-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
      <h3 className="font-semibold text-gray-900">{title(item)}</h3>
      <p className="text-sm text-gray-500 mt-2 line-clamp-3">{body(item)}</p>
      <span className="inline-block mt-3 text-sm font-medium text-primary-700">{t('education.readResource')}</span>
     </button>
     {item.relevance && <p className="text-xs text-gray-500 mt-2">{t('education.relevance.'+item.relevance)}</p>}
     {actions(item)}
    </Card>)}
   </div>
  </>}
  {!education.isError && !education.isLoading && (page>1 || (education.data?.totalPages ?? 0)>1) && <nav className="flex justify-between items-center gap-3" aria-label={t('education.pagination')}>
   <Button variant="outline" disabled={page===1 || education.isFetching} onClick={()=>setPage(page-1)}>{t('education.previous')}</Button>
   <span className="text-sm text-gray-500">{t('education.page',{page,total:Math.max(page,education.data?.totalPages ?? 1)})}</span>
   <Button variant="outline" disabled={page>=(education.data?.totalPages ?? 1) || education.isFetching} onClick={()=>setPage(page+1)}>{t('education.next')}</Button>
  </nav>}
  <Modal open={!!selected} onClose={()=>setSelected(null)} title={selected?title(selected):''} size="lg">
   {selected && <div className="space-y-4">
    <p className="text-sm text-gray-700 whitespace-pre-wrap">{body(selected)}</p>
    {actions(selected)}
    {progress.isError && <p role="alert" className="text-sm text-red-700">{getApiErrorMessage(progress.error)}</p>}
    {!!selected.sources?.length && <div className="border-t border-rose-100 pt-3"><h3 className="font-medium text-sm">{t('education.sources')}</h3>{selected.sources.filter(source=>source.url.startsWith('https://')).map(source=><a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" className="block mt-2 text-sm text-primary-700 underline">{source.title}</a>)}</div>}
    <p className="text-xs text-gray-500">{t('education.disclaimer')}</p>
   </div>}
  </Modal>
 </div>;
}
