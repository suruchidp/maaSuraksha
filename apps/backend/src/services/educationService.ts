import { pregnancyAge } from "@maasuraksha/shared";
import { isValidObjectId } from 'mongoose';
import { EducationalContent } from '../models/EducationalContent';
import { EducationProgress } from '../models/EducationProgress';
import { PregnancyProfile } from '../models/PregnancyProfile';
import { MaternalRiskAssessment } from '../models/MaternalRiskAssessment';
import { GDMAssessment } from '../models/GDMAssessment';
import { ApiError } from '../utils/ApiError';
import { EDUCATIONAL_CATEGORIES, Language, educationalContentSchema } from '@maasuraksha/shared';
import { AuthUser } from '../middleware/auth';
export type EducationalContentInput = import('@maasuraksha/shared').EducationalContentInput;
const validateId = (id:string) => { if(!isValidObjectId(id)) throw ApiError.badRequest('Invalid id format'); };
function normalizeLang(lang?:Language) {
 if(lang && !Object.values(Language).includes(lang)) throw ApiError.badRequest('Invalid language');
 return lang ?? Language.EN;
}
function toDto(content:InstanceType<typeof EducationalContent>, lang:Language) {
 return {id:content._id,title:content.title[lang] || content.title.en,body:content.body[lang] || content.body.en,
 titleLocalized:Object.fromEntries(Object.values(Language).map(lang=>[lang,content.title[lang]])),bodyLocalized:Object.fromEntries(Object.values(Language).map(lang=>[lang,content.body[lang]])),availableLanguages:Object.values(Language).filter(lang=>content.title[lang] && content.body[lang]),category:content.category,tags:content.tags,
 sources:content.sources ?? [],isActive:content.isActive,createdAt:content.createdAt,updatedAt:content.updatedAt};
}
export async function createContent(createdBy:string,input:EducationalContentInput) {
 const parsed=educationalContentSchema.safeParse(input);
 if(!parsed.success) throw ApiError.badRequest('Invalid education content',parsed.error.flatten());
 return toDto(await EducationalContent.create({...parsed.data,createdBy}),Language.EN);
}
export async function listContent(page:number,limit:number,category?:string,lang?:Language,options:{search?:string;view?:string;actor?:AuthUser}={}) {
 const language=normalizeLang(lang);
 if(category && !EDUCATIONAL_CATEGORIES.includes(category as never)) throw ApiError.badRequest('Invalid education category');
 if(options.view && !['all','saved','for_you'].includes(options.view)) throw ApiError.badRequest('Invalid resource view');
 if((options.search?.length ?? 0)>100) throw ApiError.badRequest('Search must be under 100 characters');
 const filter:Record<string,unknown>={isActive:true};
 if(category) filter.category=category;
 if(options.search?.trim()) {
  const escaped=options.search.trim().replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  filter.$or=[{['title.'+language]:{$regex:escaped,$options:'i'}},{['body.'+language]:{$regex:escaped,$options:'i'}},{tags:{$regex:escaped,$options:'i'}}];
 }
 let stageTag:string|undefined; let risk=false;
 if(options.view==='saved' || options.view==='for_you') {
  if(options.actor?.role!=='PATIENT') throw ApiError.forbidden('Personal resources are available to patients');
  const user=options.actor.userId;
  if(options.view==='saved') filter._id={$in:(await EducationProgress.find({user,isSaved:true}).select('content')).map(p=>p.content)};
  else {
   const [profile,maternal,gdm]=await Promise.all([PregnancyProfile.findOne({user}),MaternalRiskAssessment.findOne({user}).sort({createdAt:-1}),GDMAssessment.findOne({user}).sort({createdAt:-1})]);
   if(profile && profile.status !== 'completed') {
    const age=pregnancyAge(profile.lmp);
    if(!age.datingNeedsReview) stageTag='trimester_'+age.trimester;
   }
   risk=!!profile?.isHighRisk || [maternal,gdm].some(a=>a?.status==='completed' && ['high','critical','medium','moderate'].includes(a.riskLevel ?? ''));
   filter.tags={$in:['general',...(stageTag?[stageTag]:[]),...(risk?['risk_followup']:[])]};
  }
 }
 const [total,docs]=await Promise.all([EducationalContent.countDocuments(filter),EducationalContent.find(filter).sort({createdAt:-1,_id:-1}).skip((page-1)*limit).limit(limit)]);
 const progress=options.actor?.role==='PATIENT' ? await EducationProgress.find({user:options.actor.userId,content:{$in:docs.map(d=>d._id)}}) : [];
 return {total,items:docs.map(doc=>{
  const p=progress.find(p=>p.content.toString()===doc._id.toString());
  const relevance=options.view==='for_you' ? (risk && doc.tags.includes('risk_followup')?'risk':stageTag && doc.tags.includes(stageTag)?'stage':'general') : undefined;
  return {...toDto(doc,language),isSaved:p?.isSaved ?? false,readAt:p?.readAt,relevance};
 })};
}
export async function getContent(id:string,lang?:Language) {
 validateId(id);const doc=await EducationalContent.findOne({_id:id,isActive:true});
 if(!doc) throw ApiError.notFound('Educational content not found');return toDto(doc,normalizeLang(lang));
}
export async function adminListContent(role:string,page:number,limit:number) {
 if(role!=='ADMIN') throw ApiError.forbidden();
 const [total,docs]=await Promise.all([EducationalContent.countDocuments(),EducationalContent.find().sort({createdAt:-1,_id:-1}).skip((page-1)*limit).limit(limit)]);
 return {total,items:docs.map(d=>toDto(d,Language.EN))};
}
export async function updateContent(role:string,id:string,input:Partial<EducationalContentInput>) {
 if(role!=='ADMIN') throw ApiError.forbidden();validateId(id);
 const parsed=educationalContentSchema.partial().strict().safeParse(input);
 if(!parsed.success || Object.keys(parsed.data).length===0) throw ApiError.badRequest('Invalid education update',!parsed.success?parsed.error.flatten():undefined);
 const doc=await EducationalContent.findById(id);if(!doc) throw ApiError.notFound('Educational content not found');
 doc.set(parsed.data);await doc.save();return toDto(doc,Language.EN);
}
export async function updateProgress(actor:AuthUser,id:string,input:{isSaved?:boolean;isRead?:boolean}) {
 if(actor.role!=='PATIENT') throw ApiError.forbidden('Only patients can update reading progress');
 await getContent(id);
 const update:Record<string,unknown>={};
 if(input.isSaved!==undefined) update.isSaved=input.isSaved;
 if(input.isRead===true) update.readAt=new Date();
 const query={user:actor.userId,content:id};
 const changes:Record<string,unknown>={$set:update};
 if(input.isRead===false) changes.$unset={readAt:1};
 try { return await EducationProgress.findOneAndUpdate(query,changes,{upsert:true,new:true}); }
 catch(error) { if((error as {code?:number}).code!==11000) throw error;return EducationProgress.findOneAndUpdate(query,changes,{new:true}); }
}
