import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { api, cleanDb, connectTestDb } from './helpers';
import { User } from '../src/models/User';
import { generateToken } from '../src/utils/token';
import { UserRole } from '@maasuraksha/shared';
import { seedEducationResources } from '../src/services/educationContent';
import { EducationalContent } from '../src/models/EducationalContent';
import { EducationProgress } from '../src/models/EducationProgress';
import { PregnancyProfile } from '../src/models/PregnancyProfile';
import { GDMAssessment } from '../src/models/GDMAssessment';

describe('Education content and patient resources',()=>{
 let patient:{id:string;token:string};let other:{id:string;token:string};let adminToken:string;
 async function account(email:string,role:UserRole) {
  const user=await User.create({name:'Education QA',email,password:'StrongPass1',role});
  return {id:user._id.toString(),token:generateToken({userId:user._id.toString(),role})};
 }
 const get=(url:string,token=patient.token)=>api().get('/api/v1/education'+url).set('Authorization','Bearer '+token);
 const patch=(url:string,body:unknown,token=patient.token)=>api().patch('/api/v1/education'+url).set('Authorization','Bearer '+token).send(body);
 beforeAll(async()=>{await connectTestDb();await EducationalContent.init();await EducationProgress.init();});
 beforeEach(async()=>{await cleanDb();patient=await account('education@patient.com',UserRole.PATIENT);other=await account('other@education.com',UserRole.PATIENT);adminToken=(await account('admin@education.com',UserRole.ADMIN)).token;await seedEducationResources();});
 it('seeds all nine topics idempotently, serves translations and paginates search/category results',async()=>{
  await seedEducationResources();expect(await EducationalContent.countDocuments()).toBe(9);
  const page=await get('?page=2&limit=2&lang=hi');expect(page.status).toBe(200);expect(page.body.data).toHaveLength(2);expect(page.body.meta.total).toBe(9);
  expect(page.body.data[0].title).toBe(page.body.data[0].titleLocalized.hi);
  const topic=await get('?category=nutrition&lang=kn');expect(topic.body.data).toHaveLength(1);expect(topic.body.data[0].sources[0].url).toMatch(/^https:/);
  const search=await get('?search=antenatal');expect(search.body.data).toHaveLength(1);
  expect((await get('?search=%5B')).status).toBe(200);
  const detail=await get('/'+topic.body.data[0].id+'?lang=hi');expect(detail.body.data.body).toBe(detail.body.data.bodyLocalized.hi);
 });
 it('admin creates, edits and unpublishes content without losing translations or reactivating it on seed',async()=>{
  const body={title:{en:'Custom resource',hi:'जानकारी',kn:'ಮಾಹಿತಿ'},body:{en:'Custom body',hi:'विवरण',kn:'ವಿವರ'},category:'pregnancy',isActive:false,sources:[{title:'NHS',url:'https://www.nhs.uk/pregnancy/'}]};
  const created=await api().post('/api/v1/education').set('Authorization','Bearer '+adminToken).send(body);expect(created.status).toBe(201);expect(created.body.data.isActive).toBe(false);
  const managed=await get('/manage',adminToken);expect(managed.body.meta.total).toBe(10);expect(managed.body.data.find((d:{id:string})=>d.id===created.body.data.id).titleLocalized).toEqual(body.title);
  expect((await get('/'+created.body.data.id)).status).toBe(404);
  expect((await patch('/'+created.body.data.id,{isActive:true},adminToken)).status).toBe(200);
  expect((await get('/'+created.body.data.id)).status).toBe(200);
  const builtin=await EducationalContent.findOne({slug:'nutrition-v1'});
  expect((await patch('/'+builtin!._id,{isActive:false},adminToken)).status).toBe(200);await seedEducationResources();
  expect((await get('?category=nutrition')).body.data).toHaveLength(0);
 });
 it('persists saved and read independently, with per-user isolation and safe concurrent updates',async()=>{
  const content=await EducationalContent.findOne({category:'nutrition'});const id=content!._id.toString();
  const saved=await patch('/'+id+'/progress',{isSaved:true});expect(saved.status).toBe(200);expect(saved.body.data.readAt).toBeUndefined();
  await Promise.all(Array.from({length:5},()=>patch('/'+id+'/progress',{isSaved:true})));
  expect(await EducationProgress.countDocuments({user:patient.id,content:id})).toBe(1);
  expect((await patch('/'+id+'/progress',{isRead:true})).body.data.readAt).toBeTruthy();
  expect((await get('?view=saved')).body.data[0].isSaved).toBe(true);
  expect((await get('?view=saved',other.token)).body.data).toHaveLength(0);
  expect((await patch('/'+id+'/progress',{isSaved:false})).body.data.readAt).toBeTruthy();
  expect((await patch('/'+id+'/progress',{isRead:false})).body.data.readAt).toBeUndefined();
 });
 it('personalizes from real current stage and completed risk, never pending screenings',async()=>{
  const nutrition=await EducationalContent.findOne({category:'nutrition'});nutrition!.tags=['risk_followup'];await nutrition!.save();
  await GDMAssessment.create({user:patient.id,assessedBy:patient.id,status:'pending',riskLevel:'high',inputFeatures:{}});
  expect((await get('?view=for_you')).body.data.some((d:{category:string})=>d.category==='nutrition')).toBe(false);
  await PregnancyProfile.create({user:patient.id,lmp:new Date(Date.now()-30*7*86400000),expectedDueDate:new Date(Date.now()+70*86400000),gestationalWeek:1,trimester:1,isHighRisk:false});
  const stage=await get('?view=for_you');expect(stage.body.data.find((d:{category:string})=>d.category==='labor_delivery').relevance).toBe('stage');
  await GDMAssessment.updateMany({user:patient.id},{$set:{status:'completed',riskLevel:'high'}});
  expect((await get('?view=for_you')).body.data.find((d:{category:string})=>d.category==='nutrition').relevance).toBe('risk');
 });
 it('rejects unauthorized edits and invalid inputs instead of server errors',async()=>{
  const id=(await EducationalContent.findOne())!._id.toString();
  expect((await api().get('/api/v1/education')).status).toBe(401);
  expect((await get('/manage')).status).toBe(403);
  expect((await patch('/'+id,{isActive:false})).status).toBe(403);
  for(const query of ['?category=invalid','?lang=invalid','?view=invalid','?search[x]=foo']) expect((await get(query)).status).toBe(400);
  expect((await patch('/'+id,{category:'invalid'},adminToken)).status).toBe(400);
  expect((await patch('/'+id,{title:{en:'One language only'}},adminToken)).status).toBe(400);
  expect((await patch('/'+id,{sources:[{title:'Bad link',url:'javascript:alert(1)'}]},adminToken)).status).toBe(400);
  expect((await patch('/'+id+'/progress',{isSaved:'true'})).status).toBe(400);
  expect((await patch('/'+id+'/progress',{user:other.id,isSaved:true})).status).toBe(400);
 });
});
