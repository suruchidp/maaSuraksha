import { Appointment } from "../src/models/Appointment";
import { PregnancyProfile } from "../src/models/PregnancyProfile";
import { GDMAssessment } from "../src/models/GDMAssessment";
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { api, connectTestDb, cleanDb } from './helpers';
import { Alert } from '../src/models/Alert';
import { User } from '../src/models/User';
import { evaluateAlerts, refreshPatientAlerts } from '../src/services/alertEngine';
import { HealthMetric } from '../src/models/HealthMetric';
import { MaternalRiskAssessment } from '../src/models/MaternalRiskAssessment';
import { PPDAssessment } from '../src/models/PPDAssessment';
import { MoodEntry } from '../src/models/MoodEntry';
import * as mlClient from '../src/services/mlClient';
import { UserRole } from '@maasuraksha/shared';
const now = new Date('2030-06-01T06:00:00Z');
describe('alert rules', () => {
 it('uses either BP measurement at boundaries and excludes old readings', () => {
  for(const [systolicBP,diastolicBP,severity] of [[139,89,undefined],[140,89,'warning'],[139,90,'warning'],[160,80,'urgent'],[110,110,'urgent']] as const) {
   const result=evaluateAlerts({user:'u',metric:{_id:'m',date:now,systolicBP,diastolicBP}},now);
   expect(result[0]?.severity).toBe(severity);
  }
  expect(evaluateAlerts({user:'u',metric:{_id:'m',date:new Date('2029-01-01'),systolicBP:180}},now)).toHaveLength(0);
 });
 it('never invents alerts from pending or low-risk model results', () => {
  expect(evaluateAlerts({user:'u',maternal:{_id:'m',status:'pending',riskLevel:'high'},gdm:{_id:'g',status:'completed',riskLevel:'low'}},now)).toHaveLength(0);
  expect(evaluateAlerts({user:'u',maternal:{_id:'m',status:'completed',riskLevel:'critical'}},now)[0]?.severity).toBe('critical');
 });
 it('generates pregnancy and upcoming appointment reminders only in their windows', () => {
  const context={user:'u',pregnancy:{_id:'p',isHighRisk:true,expectedDueDate:new Date('2030-06-06')},appointments:[{_id:'a',date:new Date('2030-06-02'),time:'10:00',status:'scheduled'}]};
  expect(evaluateAlerts(context,now).map(x=>x.rule)).toEqual(['pregnancy-risk','due-date','appointment-reminder']);
  expect(evaluateAlerts({...context,appointments:[{...context.appointments[0]!,status:'cancelled'}]},now).some(x=>x.type==='appointment')).toBe(false);
 });
 it('raises PPD assessment alerts from completed moderate or severe screening only', () => {
  expect(evaluateAlerts({user:'u',ppd:{_id:'p',status:'pending',severity:'severe'}},now)).toHaveLength(0);
  expect(evaluateAlerts({user:'u',ppd:{_id:'p',status:'completed',severity:'mild'}},now)).toHaveLength(0);
  expect(evaluateAlerts({user:'u',ppd:{_id:'p',status:'completed',severity:'severe'}},now)[0]).toMatchObject({rule:'ppd-risk',type:'assessment',severity:'urgent'});
  expect(evaluateAlerts({user:'u',ppd:{_id:'p',status:'completed',severity:'moderate'}},now)[0]).toMatchObject({rule:'ppd-risk',type:'assessment',severity:'warning'});
 });
 it('raises a mood safety alert for a recent flagged entry without quoting journal text', () => {
  const recent={user:'u',mood:{_id:'m',createdAt:new Date('2030-06-01T05:00:00Z'),safetyFlag:true}};
  const signal=evaluateAlerts(recent,now)[0];
  expect(signal).toMatchObject({rule:'mood-safety',type:'mood_safety',severity:'urgent'});
  expect(signal.message).not.toBe('');
  expect(evaluateAlerts({user:'u',mood:{_id:'m',createdAt:new Date('2030-05-30T05:00:00Z'),safetyFlag:true}},now)).toHaveLength(0);
  expect(evaluateAlerts({user:'u',mood:{_id:'m',createdAt:recent.mood.createdAt,safetyFlag:false}},now)).toHaveLength(0);
 });
});
describe('alerts API end-to-end with persistence', () => {
 let patient:{id:string;token:string};let other:{id:string;token:string};let doctor:{id:string;token:string};
 async function register(email:string,role='PATIENT') {
  const res=await api().post('/api/v1/auth/register').send({name:'Test',email,password:'StrongPass1',role});
  expect(res.status).toBe(201);return {id:res.body.data.user.id as string,token:res.body.data.token as string};
 }
 afterEach(() => vi.restoreAllMocks());
 beforeAll(async()=>{await connectTestDb();await Alert.init();});
 beforeEach(async()=>{await cleanDb();patient=await register('alerts@patient.com');other=await register('other@patient.com');doctor=await register('alerts@doctor.com','DOCTOR');await User.findByIdAndUpdate(patient.id,{assignedDoctor:doctor.id});});
 it('creates a metric alert, deduplicates refresh, tracks unread, acknowledges and lets the doctor resolve',async()=>{
  const metric=await api().post('/api/v1/health-metrics').set('Authorization',`Bearer ${patient.token}`).send({systolicBP:160,diastolicBP:95});
  expect(metric.status).toBe(201);
  await Promise.all(Array.from({length:5},()=>refreshPatientAlerts(patient.id)));
  const list=await api().get('/api/v1/alerts?unread=true').set('Authorization',`Bearer ${patient.token}`);
  expect(list.status).toBe(200);expect(list.body.data).toHaveLength(1);expect(list.body.data[0].severity).toBe('urgent');
  const id=list.body.data[0].id;
  expect((await api().get('/api/v1/alerts/summary').set('Authorization',`Bearer ${patient.token}`)).body.data.unread).toBe(1);
  expect((await api().patch(`/api/v1/alerts/${id}/read`).set('Authorization',`Bearer ${other.token}`)).status).toBe(403);
  expect((await api().patch(`/api/v1/alerts/${id}/read`).set('Authorization',`Bearer ${patient.token}`)).status).toBe(200);
  const unread=await api().get('/api/v1/alerts?unread=true').set('Authorization',`Bearer ${patient.token}`);expect(unread.body.data).toHaveLength(0);
  const ack=await api().patch(`/api/v1/alerts/${id}/status`).set('Authorization',`Bearer ${patient.token}`).send({status:'acknowledged'});expect(ack.status).toBe(200);expect(ack.body.data.acknowledgedAt).toBeTruthy();
  expect((await api().patch(`/api/v1/alerts/${id}/status`).set('Authorization',`Bearer ${patient.token}`).send({status:'resolved'})).status).toBe(403);
  expect((await api().patch(`/api/v1/alerts/${id}/status`).set('Authorization',`Bearer ${doctor.token}`).send({status:'resolved'})).status).toBe(200);
  expect((await api().get('/api/v1/alerts/summary').set('Authorization',`Bearer ${patient.token}`)).body.data).toEqual({unread:0,pending:0});
  expect(await Alert.countDocuments({user:patient.id})).toBe(1);
 });
 it('preserves acknowledgment on replay and emits a separate escalation',async()=>{
  await HealthMetric.create({user:patient.id,date:new Date(),systolicBP:145});await refreshPatientAlerts(patient.id);
  await Alert.updateMany({user:patient.id},{$set:{status:'acknowledged'}});
  await HealthMetric.create({user:patient.id,date:new Date(),systolicBP:170});await refreshPatientAlerts(patient.id);
  expect(await Alert.countDocuments({user:patient.id})).toBe(2);
  expect(await Alert.countDocuments({user:patient.id,status:'acknowledged'})).toBe(1);
 });
 it('generates completed model alerts and skips unavailable assessments',async()=>{
  await MaternalRiskAssessment.create({user:patient.id,assessedBy:patient.id,status:'pending',inputFeatures:{age:28}});await refreshPatientAlerts(patient.id);expect(await Alert.countDocuments({user:patient.id})).toBe(0);
  await MaternalRiskAssessment.updateMany({user:patient.id},{$set:{status:'completed',riskLevel:'high'}});await refreshPatientAlerts(patient.id);await refreshPatientAlerts(patient.id);expect(await Alert.countDocuments({user:patient.id,type:'assessment'})).toBe(1);
 });
 it('persists a PPD assessment alert for a completed severe screening',async()=>{
  vi.spyOn(mlClient,'predictPPD').mockResolvedValue({available:true,modelVersion:'v-test',prediction:'positive_screen',probability:0.9,riskLevel:'high'});
  const res=await api().post('/api/v1/assessments/ppd').set('Authorization',`Bearer ${patient.token}`).send({user:patient.id,edinburghAnswers:[3,3,3,3,3,3,3,3,3,3],screeningText:'I cannot cope with anything anymore.'});
  expect(res.status).toBe(201);
  expect(res.body.data.status).toBe('completed');
  expect(res.body.data.severity).toBe('severe');
  expect(res.body.data.edinburghScore).toBe(30);
  expect(res.body.data.edinburghAnswers).toHaveLength(10);
  const alert=await Alert.findOne({user:patient.id,type:'assessment'});
  expect(alert).toBeTruthy();
  expect(alert?.severity).toBe('urgent');
  expect(alert?.dedupeKey).toContain('ppd:');
 });
 it('raises a mood_safety alert on a flagged journal entry without exposing journal text',async()=>{
  const journalText='PRIVATE_JOURNAL_MARKER_48913';
  vi.spyOn(mlClient,'analyzeMood').mockResolvedValue({available:true,modelStatus:'MODEL_AVAILABLE',modelVersion:'v-test',sentiment:'distressed',sentimentScore:-0.9,safetyFlag:true,safetyMessage:'Flagged for review'});
  const res=await api().post('/api/v1/mood').set('Authorization',`Bearer ${patient.token}`).send({journalText});
  expect(res.status).toBe(201);
  expect(res.body.data.safetyFlag).toBe(true);
  const alert=await Alert.findOne({user:patient.id,type:'mood_safety'});
  expect(alert).toBeTruthy();
  expect(alert?.severity).toBe('urgent');
  expect(JSON.stringify({message:alert?.message,title:alert?.title})).not.toContain(journalText);
 });
 it('persists pregnancy, GDM and appointment reminders and resolves cancelled booking reminders',async()=>{
  await PregnancyProfile.create({user:patient.id,lmp:new Date(),expectedDueDate:new Date(Date.now()+3*86400000),gestationalWeek:39,trimester:3,isHighRisk:true});
  await GDMAssessment.create({user:patient.id,assessedBy:patient.id,status:'completed',riskLevel:'high',inputFeatures:{}});
  await refreshPatientAlerts(patient.id);
  expect(await Alert.countDocuments({user:patient.id})).toBe(3);
  const appt=await Appointment.create({patient:patient.id,date:new Date('2030-06-02'),time:'10:00',type:'antenatal'});
  await refreshPatientAlerts(patient.id,now);
  expect(await Alert.countDocuments({user:patient.id,type:'appointment'})).toBe(1);
  const cancelled=await api().patch('/api/v1/appointments/'+appt._id+'/status').set('Authorization', 'Bearer '+patient.token).send({status:'cancelled'});
  expect(cancelled.status).toBe(200);
  expect((await Alert.findOne({user:patient.id,type:'appointment'}))?.status).toBe('resolved');
 });
 it('keeps source writes successful when notification generation fails and recovers on retry',async()=>{
  vi.spyOn(Alert,'updateOne').mockRejectedValueOnce(new Error('Transient notification failure'));
  vi.spyOn(console,'error').mockImplementation(()=>{});
  const response=await api().post('/api/v1/health-metrics').set('Authorization', 'Bearer '+patient.token).send({systolicBP:160});
  expect(response.status).toBe(201);
  expect(await HealthMetric.countDocuments({user:patient.id})).toBe(1);
  expect(await Alert.countDocuments({user:patient.id})).toBe(0);
  await refreshPatientAlerts(patient.id);
  expect(await Alert.countDocuments({user:patient.id})).toBe(1);
 });
 it('validates filters, requires auth and lets admin list all patients',async()=>{
  expect((await api().get('/api/v1/alerts')).status).toBe(401);
  expect((await api().get('/api/v1/alerts?status=bogus').set('Authorization',`Bearer ${patient.token}`)).status).toBe(400);
  await Alert.create({user:patient.id,type:'follow_up',title:'Review',message:'Contact care team',severity:'info'});
  const admin=await User.create({name:'Admin',email:'admin@alerts.com',password:'StrongPass1',role:UserRole.ADMIN});
  const {generateToken}=await import('../src/utils/token');
  const result=await api().get('/api/v1/alerts').set('Authorization',`Bearer ${generateToken({userId:admin._id.toString(),role:UserRole.ADMIN})}`);expect(result.body.data).toHaveLength(1);
 });
});
