import { isValidObjectId, Types } from 'mongoose';
import { appointmentToday, chatMessageSchema, type ChatMessageInput, UserRole } from '@maasuraksha/shared';
import { ChatConversation } from '../models/ChatConversation';
import { ChatMessage } from '../models/ChatMessage';
import { ChatTurn } from '../models/ChatTurn';
import { Alert } from '../models/Alert';
import { Referral } from '../models/Referral';
import { ApiError } from '../utils/ApiError';
import { AuthUser } from '../middleware/auth';
import { buildChatAnswer } from './chatAnswer';

export async function createConversation(actor: AuthUser, title?: string) {
  if (actor.role !== UserRole.PATIENT) throw ApiError.forbidden('Patient chat only');
  return toDto(await ChatConversation.create({ user: actor.userId, title, lastMessageAt: new Date() }));
}
export async function listConversations(actor: AuthUser, page: number, limit: number) {
  const filter = {user: actor.userId};
  const [total, items] = await Promise.all([ChatConversation.countDocuments(filter), ChatConversation.find(filter).sort({lastMessageAt:-1,_id:-1}).skip((page-1)*limit).limit(limit)]);
  return {total, items:items.map(toDto)};
}
async function owned(actor: AuthUser, id: string) {
  if (!isValidObjectId(id)) throw ApiError.badRequest('Invalid id format');
  // Even admins do not get implicit access to private patient conversations.
  const conversation = await ChatConversation.findOne({_id:id,user:actor.userId});
  if (!conversation) throw ApiError.notFound('Conversation not found');
  return conversation;
}
export async function getConversation(actor: AuthUser, id: string) {return toDto(await owned(actor,id));}

async function escalate(turn: InstanceType<typeof ChatTurn>) {
  const metadata = {...turn.metadata};
  if (!metadata.requiresHumanReview) return turn;
  try {
    const alertIds: string[] = [], referralIds: string[] = [];
    for (const flag of metadata.flags as string[]) {
      // Same warning on the same India day has one alert/referral, even across
      // conversations and network retries. No question or full chat is shared.
      const key = `chat:${turn.createdAt ? appointmentToday(turn.createdAt) : appointmentToday()}:${flag}`;
      const alert = await Alert.findOneAndUpdate({user:turn.user,dedupeKey:key}, {$setOnInsert:{user:turn.user,dedupeKey:key,type:flag==='self_harm'?'mood_safety':'symptom',severity:'urgent',title:'Urgent concern reported in chat',message:`A message may describe ${flag.replace(/_/g,' ')}. Immediate medical assessment is advised. This is text screening, not a diagnosis. Do not wait for an app response.`,source:'chat-safety-v1'}}, {upsert:true,new:true});
      const referral = await Referral.findOneAndUpdate({patient:turn.user,sourceKey:key}, {$setOnInsert:{patient:turn.user,referredBy:turn.user,sourceKey:key,reason:`Chat safety screen: possible ${flag.replace(/_/g,' ')}; urgent clinical assessment advised.`,notes:'Automatically created pending referral. No clinician has accepted or reviewed it. Contact emergency/maternity services directly; do not wait for the app.',status:'pending',history:[{status:'pending',changedBy:turn.user,changedAt:new Date(),note:'Automated safety screen; not a diagnosis.'}]}}, {upsert:true,new:true});
      alertIds.push(String(alert!._id)); referralIds.push(String(referral!._id));
    }
    metadata.escalation = 'created'; metadata.alertIds = alertIds; metadata.referralIds = referralIds;
  } catch {
    // Keep the urgent response visible even when escalation is unavailable.
    metadata.escalation = 'failed';
  }
  turn.metadata = metadata;
  await turn.save();
  return turn;
}
function result(turn: InstanceType<typeof ChatTurn>) {
 const common = {conversation:turn.conversation,createdAt:turn.createdAt,updatedAt:turn.updatedAt};
 return {
  userMessage:{...common,id:turn.userMessageId,role:'user',content:turn.question},
  assistantMessage:{...common,id:turn.assistantMessageId,role:'assistant',content:turn.reply,metadata:turn.metadata},
  requiresHumanReview:!!turn.metadata.requiresHumanReview,
 };
}
export async function retryChatEscalations() {
 const turns = await ChatTurn.find({'metadata.escalation':{$in:['failed','pending']}}).sort({createdAt:1}).limit(50);
 for (const turn of turns) {
  try { await escalate(turn); } catch { /* Retry next tick without blocking other patient alerts. */ }
 }
}
export async function sendMessage(actor: AuthUser, conversationId: string, raw: ChatMessageInput) {
 const input = chatMessageSchema.safeParse(raw);
 if (!input.success) throw ApiError.badRequest(input.error.issues[0].message);
 const data = input.data;
 await owned(actor,conversationId);
 if (actor.role !== UserRole.PATIENT) throw ApiError.forbidden('Patient chat only');
 if (data.conversationId && data.conversationId !== conversationId) throw ApiError.badRequest('Conversation ID mismatch');
 const replay = await ChatTurn.findOne({conversation:conversationId,requestId:data.requestId});
 if (replay) {
  if(replay.question!==data.message || replay.language!==data.language || replay.useHealthContext!==data.useHealthContext || !!replay.allowExternalAi!==data.allowExternalAi) throw ApiError.conflict('Request ID already used for a different message');
  return result(replay.metadata.escalation==='failed' || replay.metadata.escalation==='pending' ? await escalate(replay) : replay);
 }
 const now = new Date();
 const locked = await ChatConversation.findOneAndUpdate({_id:conversationId,user:actor.userId,$or:[{busyUntil:{$exists:false}},{busyUntil:{$lte:now}}]},{$set:{busyUntil:new Date(now.getTime()+60000)}},{new:true});
 if(!locked) throw ApiError.conflict('A message is being processed. Please retry shortly.');
 try {
  if(await ChatTurn.countDocuments({user:actor.userId,createdAt:{$gte:new Date(now.getTime()-60000)}})>=20) throw ApiError.tooManyRequests('Please wait a minute before sending more messages');
  const answer = await buildChatAnswer(actor.userId,data.message,data.language,data.useHealthContext,data.allowExternalAi);
  const turn = await ChatTurn.create({conversation:conversationId,user:actor.userId,requestId:data.requestId,question:data.message,reply:answer.reply,language:data.language,useHealthContext:data.useHealthContext,allowExternalAi:data.allowExternalAi,userMessageId:new Types.ObjectId(),assistantMessageId:new Types.ObjectId(),metadata:{...answer.metadata,escalation:answer.metadata.requiresHumanReview?'pending':'not_needed'}});
  await ChatConversation.updateOne({_id:conversationId},{$set:{lastMessageAt:turn.createdAt,...(!locked.title?{title:data.message.slice(0,50)}:{})}});
  return result(await escalate(turn));
 } finally {
  await ChatConversation.updateOne({_id:conversationId,busyUntil:locked.busyUntil},{$unset:{busyUntil:1}});
 }
}
export async function listMessages(actor: AuthUser, id: string, page: number, limit: number) {
 await owned(actor,id);
 const conversation = new Types.ObjectId(id);
 const [legacyTotal,turnTotal] = await Promise.all([ChatMessage.countDocuments({conversation}),ChatTurn.countDocuments({conversation})]);
 const items = await ChatTurn.aggregate([
  {$match:{conversation}},
  {$project:{messages:[
   {id:'$userMessageId',conversation:'$conversation',role:{$literal:'user'},content:'$question',createdAt:'$createdAt',updatedAt:'$updatedAt',order:{$literal:0}},
   {id:'$assistantMessageId',conversation:'$conversation',role:{$literal:'assistant'},content:'$reply',metadata:'$metadata',createdAt:'$createdAt',updatedAt:'$updatedAt',order:{$literal:1}},
  ]}},{$unwind:'$messages'},{$replaceRoot:{newRoot:'$messages'}},
  {$unionWith:{coll:ChatMessage.collection.name,pipeline:[{$match:{conversation}},{$project:{_id:0,id:'$_id',conversation:1,role:1,content:1,metadata:1,createdAt:1,updatedAt:1,order:{$literal:0}}}]}},
  {$sort:{createdAt:-1,id:-1,order:-1}},{$skip:(page-1)*limit},{$limit:limit},{$project:{order:0}},
 ]);
 return {items:items.reverse(),total:legacyTotal+turnTotal*2};
}
function toDto(c: InstanceType<typeof ChatConversation>) {return {id:c._id,user:c.user,title:c.title,lastMessageAt:c.lastMessageAt,createdAt:c.createdAt,updatedAt:c.updatedAt};}
