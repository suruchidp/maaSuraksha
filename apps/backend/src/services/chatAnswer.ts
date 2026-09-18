import { pregnancyAge } from '@maasuraksha/shared';
import { PregnancyProfile } from '../models/PregnancyProfile';
import { HealthMetric } from '../models/HealthMetric';
import { EducationalContent } from '../models/EducationalContent';
import { seedEducationResources } from './educationContent';
import { screenChat, WARNING_SOURCE } from './chatSafety';
import { chatCapabilities, generateGroundedAnswer } from './chatProvider';

type Lang = 'en' | 'hi' | 'kn';
const copy = {
 en: {
  disclaimer: 'This is educational support, not a diagnosis or medical treatment. Contact your care team for advice specific to you.',
  urgent: 'Your message may describe an urgent warning sign. Seek medical assessment immediately: contact maternity or emergency services or go to the nearest emergency facility. Do not wait for this chat or a referral response. Tell the clinician you are pregnant or recently gave birth.',
  selfHarm: 'If you may hurt yourself or your baby, seek emergency help now and ask a trusted person to stay with you.',
  boundary: 'I cannot diagnose a condition, interpret a test as a diagnosis, prescribe medicines, recommend doses, or advise stopping treatment. Ask your clinician or pharmacist to review this question. Do not change prescribed treatment based on this chat.',
  fallback: 'I do not have a reliable resource-based answer to that question. Ask your care team or browse Health Education. You can ask about pregnancy visits, diet, activity, birth planning or warning signs. Not detecting a warning sign does not mean a symptom is safe.',
  context: 'Saved health context (used with your permission):',
  unavailable: 'No current pregnancy profile is saved.',
  dates: 'LMP-based estimate',
  closed: 'Pregnancy completed',
  review: 'Dating needs care-team review.',
  metric: 'Latest saved reading',
  resources: 'Relevant health resources:',
  contextFailed: 'Saved health context could not be loaded; this reply uses general resources only.',
 },
 hi: {
  disclaimer: 'यह शैक्षिक सहायता है, निदान या उपचार नहीं। व्यक्तिगत सलाह के लिए देखभाल टीम से संपर्क करें।',
  urgent: 'आपका संदेश आपात चेतावनी संकेत बता सकता है। तुरंत चिकित्सा जाँच लें: प्रसूति या आपात सेवा से संपर्क करें या नज़दीकी आपात केंद्र जाएँ। चैट या रेफरल जवाब का इंतज़ार न करें। डॉक्टर को गर्भावस्था या हाल के प्रसव के बारे में बताएँ।',
  selfHarm: 'खुद को या बच्चे को नुकसान पहुँचाने का डर हो तो अभी आपात सहायता लें और भरोसेमंद व्यक्ति को साथ रहने को कहें।',
  boundary: 'मैं निदान, जाँच से निदान, दवा या खुराक निर्धारित नहीं कर सकता, न उपचार रोकने की सलाह दे सकता हूँ। डॉक्टर या फार्मासिस्ट से पूछें। चैट के आधार पर निर्धारित उपचार न बदलें।',
  fallback: 'इस सवाल का भरोसेमंद संसाधन आधारित जवाब उपलब्ध नहीं है। देखभाल टीम से पूछें या स्वास्थ्य शिक्षा देखें। गर्भावस्था भेंट, आहार, गतिविधि, प्रसव तैयारी और चेतावनी संकेत पूछ सकते हैं। चेतावनी न मिलने से लक्षण सुरक्षित साबित नहीं होता।',
  context: 'आपकी अनुमति से उपयोग की गई स्वास्थ्य जानकारी:', unavailable: 'वर्तमान गर्भावस्था प्रोफ़ाइल उपलब्ध नहीं है।', dates: 'LMP आधारित अनुमान', closed: 'गर्भावस्था पूरी हुई', review: 'तारीखों की देखभाल टीम से समीक्षा कराएँ।', metric: 'अंतिम दर्ज माप', resources: 'संबंधित स्वास्थ्य संसाधन:', contextFailed: 'स्वास्थ्य जानकारी नहीं मिली; यह जवाब सामान्य संसाधनों पर आधारित है।',
 },
 kn: {
  disclaimer: 'ಇದು ಶೈಕ್ಷಣಿಕ ನೆರವು, ರೋಗನಿರ್ಣಯ ಅಥವಾ ಚಿಕಿತ್ಸೆ ಅಲ್ಲ. ವೈಯಕ್ತಿಕ ಸಲಹೆಗಾಗಿ ಆರೈಕೆ ತಂಡವನ್ನು ಸಂಪರ್ಕಿಸಿ.',
  urgent: 'ನಿಮ್ಮ ಸಂದೇಶ ತುರ್ತು ಎಚ್ಚರಿಕೆ ಸೂಚನೆಯನ್ನು ವಿವರಿಸಬಹುದು. ತಕ್ಷಣ ವೈದ್ಯಕೀಯ ಪರೀಕ್ಷೆ ಪಡೆಯಿರಿ: ಪ್ರಸೂತಿ ಅಥವಾ ತುರ್ತು ಸೇವೆಯನ್ನು ಸಂಪರ್ಕಿಸಿ ಅಥವಾ ಹತ್ತಿರದ ತುರ್ತು ಕೇಂದ್ರಕ್ಕೆ ಹೋಗಿ. ಚಾಟ್ ಅಥವಾ ರೆಫರಲ್ ಉತ್ತರಕ್ಕೆ ಕಾಯಬೇಡಿ. ಗರ್ಭಿಣಿಯಾಗಿರುವುದು ಅಥವಾ ಇತ್ತೀಚಿನ ಹೆರಿಗೆಯ ಬಗ್ಗೆ ವೈದ್ಯರಿಗೆ ತಿಳಿಸಿ.',
  selfHarm: 'ನಿಮಗೆ ಅಥವಾ ಮಗುವಿಗೆ ಹಾನಿ ಮಾಡುವ ಭಯವಿದ್ದರೆ ಈಗಲೇ ತುರ್ತು ನೆರವು ಪಡೆಯಿರಿ ಮತ್ತು ವಿಶ್ವಾಸಾರ್ಹ ವ್ಯಕ್ತಿಯನ್ನು ಜೊತೆಯಲ್ಲಿರಲು ಕೇಳಿ.',
  boundary: 'ನಾನು ರೋಗನಿರ್ಣಯ, ಪರೀಕ್ಷೆಯಿಂದ ನಿರ್ಣಯ, ಔಷಧಿ ಅಥವಾ ಪ್ರಮಾಣ ನಿಗದಿಪಡಿಸುವುದು ಅಥವಾ ಚಿಕಿತ್ಸೆ ನಿಲ್ಲಿಸಲು ಸಲಹೆ ನೀಡಲು ಸಾಧ್ಯವಿಲ್ಲ. ವೈದ್ಯರು ಅಥವಾ ಔಷಧಗಾರರನ್ನು ಕೇಳಿ. ಚಾಟ್ ಆಧಾರದಲ್ಲಿ ನಿಗದಿತ ಚಿಕಿತ್ಸೆ ಬದಲಿಸಬೇಡಿ.',
  fallback: 'ಈ ಪ್ರಶ್ನೆಗೆ ವಿಶ್ವಾಸಾರ್ಹ ಸಂಪನ್ಮೂಲ ಆಧಾರಿತ ಉತ್ತರ ಇಲ್ಲ. ಆರೈಕೆ ತಂಡವನ್ನು ಕೇಳಿ ಅಥವಾ ಆರೋಗ್ಯ ಶಿಕ್ಷಣ ನೋಡಿ. ಗರ್ಭಧಾರಣೆ ಭೇಟಿಗಳು, ಆಹಾರ, ಚಟುವಟಿಕೆ, ಹೆರಿಗೆ ಸಿದ್ಧತೆ ಅಥವಾ ಎಚ್ಚರಿಕೆ ಸೂಚನೆಗಳನ್ನು ಕೇಳಬಹುದು. ಎಚ್ಚರಿಕೆ ಪತ್ತೆಯಾಗದಿರುವುದು ಲಕ್ಷಣ ಸುರಕ್ಷಿತವೆಂದು ಸಾಬೀತಾಗುವುದಿಲ್ಲ.',
  context: 'ನಿಮ್ಮ ಅನುಮತಿಯಿಂದ ಬಳಸಿದ ಆರೋಗ್ಯ ಮಾಹಿತಿ:', unavailable: 'ಪ್ರಸ್ತುತ ಗರ್ಭಧಾರಣೆ ವಿವರಗಳು ಇಲ್ಲ.', dates: 'LMP ಆಧಾರಿತ ಅಂದಾಜು', closed: 'ಗರ್ಭಧಾರಣೆ ಪೂರ್ಣಗೊಂಡಿದೆ', review: 'ದಿನಾಂಕಗಳನ್ನು ಆರೈಕೆ ತಂಡದೊಂದಿಗೆ ಪರಿಶೀಲಿಸಿ.', metric: 'ಕೊನೆಯ ದಾಖಲಾದ ಅಳತೆ', resources: 'ಸಂಬಂಧಿತ ಆರೋಗ್ಯ ಸಂಪನ್ಮೂಲಗಳು:', contextFailed: 'ಆರೋಗ್ಯ ಮಾಹಿತಿ ಲಭ್ಯವಾಗಲಿಲ್ಲ; ಈ ಉತ್ತರ ಸಾಮಾನ್ಯ ಸಂಪನ್ಮೂಲಗಳನ್ನು ಬಳಸುತ್ತದೆ.',
 },
};

export async function buildChatAnswer(user: string, message: string, language: Lang, useHealthContext: boolean, allowExternalAi=false) {
 const c = copy[language];
 const safety = screenChat(message);
 const metadata: { mode: string; requiresHumanReview: boolean; flags: string[]; sources: {title:string;url:string}[]; contextUsed: boolean; contextUnavailable?: boolean; escalation?: string; alertIds?: string[]; referralIds?: string[]; providerFallback?:boolean; externalAiUsed?:boolean } = {
  mode: 'local_resources', requiresHumanReview: safety.urgent, flags: safety.flags, sources: [], contextUsed: false,
 };
 if (safety.urgent) {
  metadata.sources = [WARNING_SOURCE];
  return { reply: [c.urgent, safety.flags.includes('self_harm') ? c.selfHarm : '', c.disclaimer].filter(Boolean).join('\n\n'), metadata };
 }
 if (/diagnos|prescrib|dosage|\bdose\b|\bmedicine\b|\bmedication\b|stop.*(?:tablet|treatment|insulin)|ignore.*(?:rule|instruction)|system prompt|दवा|खुराक|निदान|ಔಷಧ|ಪ್ರಮಾಣ|ರೋಗನಿರ್ಣಯ/iu.test(message)) {
  return { reply: `${c.boundary}\n\n${c.disclaimer}`, metadata };
 }
 let context = '';
 if (useHealthContext) {
  try {
   const [p, m] = await Promise.all([
    PregnancyProfile.findOne({user}).select('lmp status endedOn'),
    HealthMetric.findOne({user, date:{$lte:new Date()}}).sort({date:-1,_id:-1}).select('date systolicBP diastolicBP weight glucose heartRate temperature hemoglobin'),
   ]);
   const age = p ? pregnancyAge(p.lmp, new Date(), p.status === 'completed' ? p.endedOn : undefined) : undefined;
   context = [c.context, age ? `${c.dates}: ${age.weeks}w + ${age.days}d; EDD ${age.dueDate}; trimester ${age.trimester}${p!.status==='completed'?`; ${c.closed}`:''}. ${age.datingNeedsReview?c.review:''}` : c.unavailable,
    m ? `${c.metric} (${m.date.toISOString()}): ${[['systolicBP','mmHg'],['diastolicBP','mmHg'],['weight','kg'],['glucose','mg/dL'],['heartRate','bpm'],['temperature','°C'],['hemoglobin','g/dL']].flatMap(([key,unit])=>typeof m.get(key)==='number'?[`${key} ${m.get(key)} ${unit}`]:[]).join('; ')}.` : '',
   ].filter(Boolean).join('\n');
   metadata.contextUsed = true;
  } catch { context = c.contextFailed; metadata.contextUnavailable = true; }
 }
 const topics: [RegExp,string][] = [
  [/diet|food|eat|nutrition|खाना|आहार|भोजन|ಆಹಾರ|ಊಟ/iu, 'nutrition'],
  [/exercise|walk|activity|व्यायाम|चलना|ವ್ಯಾಯಾಮ|ನಡಿಗೆ/iu, 'exercise'],
  [/birth|labou?r|delivery|प्रसव|ಹೆರಿಗೆ/iu, 'labor_delivery'],
  [/mood|anxious|sad|mental|उदास|चिंता|ದುಃಖ|ಚಿಂತೆ/iu, 'mental_health'],
  [/postpartum|after birth|ಪ್ರಸವದ ನಂತರ|प्रसव के बाद/iu, 'postpartum'],
  [/symptom|warning|bleed|headache|nausea|vomit|pain|लक्षण|दर्द|सिरदर्द|ಲಕ್ಷಣ|ನೋವು|ವಾಂತಿ/iu, 'warning_signs'],
  [/pregnan|week|trimester|due date|scan|visit|antenatal|गर्भ|सप्ताह|ಗರ್ಭ|ವಾರ/iu, 'pregnancy'],
 ];
 const category = topics.find(([pattern])=>pattern.test(message))?.[1];
 let body = '';
 if (category) {
  try {
   await seedEducationResources();
   const resources = await EducationalContent.find({isActive:true,category}).sort({slug:1}).limit(2);
   body = resources.map(r=>`${r.title[language]}\n${r.body[language]}`).join('\n\n');
   metadata.sources = resources.flatMap(r=>r.sources).filter(s=>/^https:\/\/(?:www\.)?(?:nhs\.uk|cdc\.gov|acog\.org)\//u.test(s.url)).map(s=>({title:s.title,url:s.url}));
  } catch { metadata.mode = 'fallback'; }
 }
 if (!body && !(context && /week|trimester|due date|सप्ताह|वार|ವಾರ/iu.test(message))) { body = c.fallback; metadata.mode = 'fallback'; }
 if (allowExternalAi && metadata.sources.length && chatCapabilities().externalAiAvailable) {
  try { body = await generateGroundedAnswer({question:message,language,context,resources:body.slice(0,4000),sources:metadata.sources}); metadata.mode='openai'; metadata.externalAiUsed=true; }
  catch { metadata.providerFallback=true; }
 } else if(allowExternalAi) metadata.providerFallback=true;
 return { reply: [context, body ? `${metadata.sources.length?c.resources+'\n':''}${body.slice(0,2200)}` : '', c.disclaimer].filter(Boolean).join('\n\n'), metadata };
}
