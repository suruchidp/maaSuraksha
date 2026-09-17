import { EducationalContent } from '../models/EducationalContent';
const text = (en: string, hi: string, kn: string) => ({ en, hi, kn });
const nhs = 'https://www.nhs.uk/';
export const STARTER_RESOURCES = [
 {
  slug: 'antenatal-care-v1', category: 'pregnancy', tags: ['trimester_1', 'trimester_2', 'trimester_3'],
  title: text('Make the most of antenatal visits', 'गर्भावस्था की देखभाल भेंट की तैयारी', 'ಗರ್ಭಧಾರಣೆ ಆರೈಕೆ ಭೇಟಿಗೆ ಸಿದ್ಧತೆ'),
  body: text('Regular antenatal visits help your care team review your health and your baby’s development. Bring your health records and a list of questions. Ask which tests and scans you need, when to return, and whom to contact with concerns. Your local care team will set your appointment schedule.', 'नियमित गर्भावस्था भेंट में आपकी और बच्चे की सेहत की समीक्षा होती है। स्वास्थ्य रिकॉर्ड और सवालों की सूची साथ लाएँ। जाँच, स्कैन, अगली भेंट और चिंता होने पर संपर्क के बारे में पूछें। आपकी स्थानीय देखभाल टीम भेंट का समय तय करेगी।', 'ನಿಯಮಿತ ಗರ್ಭಧಾರಣೆ ಭೇಟಿಗಳಲ್ಲಿ ನಿಮ್ಮ ಆರೋಗ್ಯ ಮತ್ತು ಮಗುವಿನ ಬೆಳವಣಿಗೆಯನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತದೆ. ಆರೋಗ್ಯ ದಾಖಲೆಗಳು ಮತ್ತು ಪ್ರಶ್ನೆಗಳ ಪಟ್ಟಿಯನ್ನು ತರಿರಿ. ಪರೀಕ್ಷೆಗಳು, ಸ್ಕ್ಯಾನ್, ಮುಂದಿನ ಭೇಟಿ ಮತ್ತು ಸಮಸ್ಯೆ ಇದ್ದಾಗ ಯಾರನ್ನು ಸಂಪರ್ಕಿಸಬೇಕು ಎಂದು ಕೇಳಿ. ಸ್ಥಳೀಯ ಆರೈಕೆ ತಂಡ ಭೇಟಿಗಳ ವೇಳಾಪಟ್ಟಿ ನಿಗದಿಪಡಿಸುತ್ತದೆ.'),
  sources: [{title: 'NHS: Antenatal care', url: nhs+'pregnancy/your-pregnancy-care/your-antenatal-care-and-appointments/'}],
 },
 {
  slug: 'nutrition-v1', category: 'nutrition', tags: ['general', 'risk_followup'],
  title: text('Everyday nutrition in pregnancy', 'गर्भावस्था में रोज़ का पोषण', 'ಗರ್ಭಧಾರಣೆಯಲ್ಲಿ ದೈನಂದಿನ ಪೋಷಣೆ'),
  body: text('Choose varied foods, including vegetables, fruit, whole grains and protein foods. You do not need to eat for two. If you have a glucose-related screening result or a special dietary need, ask your care team for an individual plan. Use Diet Guidance for educational meal ideas; it does not replace a prescribed plan.', 'सब्ज़ी, फल, साबुत अनाज और प्रोटीन वाले विविध खाद्य पदार्थ चुनें। दो लोगों जितना खाना ज़रूरी नहीं है। ग्लूकोज़ संबंधी जाँच परिणाम या विशेष आहार आवश्यकता हो तो देखभाल टीम से व्यक्तिगत योजना पूछें। भोजन के शैक्षिक सुझाव के लिए आहार मार्गदर्शन देखें; यह निर्धारित योजना का विकल्प नहीं है।', 'ತರಕಾರಿ, ಹಣ್ಣು, ಸಂಪೂರ್ಣ ಧಾನ್ಯ ಮತ್ತು ಪ್ರೋಟೀನ್ ಆಹಾರಗಳ ವೈವಿಧ್ಯವನ್ನು ಆಯ್ಕೆಮಾಡಿ. ಇಬ್ಬರಿಗೆ ಬೇಕಾದಷ್ಟು ತಿನ್ನಬೇಕಾಗಿಲ್ಲ. ಗ್ಲೂಕೋಸ್ ಪರೀಕ್ಷೆಯ ಫಲಿತಾಂಶ ಅಥವಾ ವಿಶೇಷ ಆಹಾರ ಅಗತ್ಯವಿದ್ದರೆ ವೈಯಕ್ತಿಕ ಯೋಜನೆಗಾಗಿ ಆರೈಕೆ ತಂಡವನ್ನು ಕೇಳಿ. ಆಹಾರ ಮಾರ್ಗದರ್ಶನದಲ್ಲಿನ ಸಲಹೆಗಳು ಶಿಕ್ಷಣಕ್ಕಾಗಿ ಮಾತ್ರ; ನಿಗದಿತ ಯೋಜನೆಗೆ ಪರ್ಯಾಯವಲ್ಲ.'),
  sources: [{title:'NHS: Healthy diet in pregnancy',url:nhs+'pregnancy/keeping-well/have-a-healthy-diet/'}],
 },
 {
  slug:'gentle-activity-v1',category:'exercise',tags:['general'],
  title:text('Staying active comfortably', 'आराम से सक्रिय रहें', 'ಆರಾಮವಾಗಿ ಚಟುವಟಿಕೆಯಿಂದಿರಿ'),
  body:text('Keep comfortable everyday activity, such as walking, if your care team says it is suitable. Avoid exhausting yourself and drink water. If you were not active before pregnancy or have complications, discuss a suitable activity plan with your clinician.', 'देखभाल टीम उपयुक्त बताए तो पैदल चलने जैसी आरामदायक गतिविधि जारी रखें। बहुत थकने से बचें और पानी पिएँ। पहले सक्रिय नहीं थीं या कोई जटिलता है तो डॉक्टर से उपयुक्त गतिविधि योजना पूछें।', 'ಆರೈಕೆ ತಂಡ ಸೂಕ್ತವೆಂದು ಹೇಳಿದರೆ ನಡೆಯುವಂತಹ ಆರಾಮದಾಯಕ ದೈನಂದಿನ ಚಟುವಟಿಕೆ ಮುಂದುವರಿಸಿ. ಅತಿಯಾಗಿ ದಣಿಯಬೇಡಿ ಮತ್ತು ನೀರು ಕುಡಿಯಿರಿ. ಗರ್ಭಧಾರಣೆಗೆ ಮೊದಲು ಚಟುವಟಿಕೆ ಇರದಿದ್ದರೆ ಅಥವಾ ತೊಂದರೆಗಳಿದ್ದರೆ ವೈದ್ಯರೊಂದಿಗೆ ಸೂಕ್ತ ಯೋಜನೆ ಚರ್ಚಿಸಿ.'),
  sources:[{title:'NHS: Exercise in pregnancy',url:nhs+'pregnancy/keeping-well/exercise/'}],
 },
 {
  slug:'emotional-support-v1',category:'mental_health',tags:['general'],
  title:text('Talk about how you feel', 'अपनी भावनाओं के बारे में बात करें', 'ನಿಮ್ಮ ಭಾವನೆಗಳ ಬಗ್ಗೆ ಮಾತನಾಡಿ'),
  body:text('Tell a trusted person and your care team if worry or low mood is affecting daily life. Support is available during pregnancy and after birth. If you have thoughts of harming yourself or your baby, seek urgent help immediately and ask someone you trust to stay with you.', 'चिंता या उदासी रोज़मर्रा के जीवन को प्रभावित करे तो भरोसेमंद व्यक्ति और देखभाल टीम को बताएँ। गर्भावस्था और प्रसव के बाद सहायता उपलब्ध है। स्वयं या बच्चे को नुकसान पहुँचाने के विचार हों तो तुरंत आपात सहायता लें और किसी भरोसेमंद व्यक्ति को साथ रहने के लिए कहें।', 'ಚಿಂತೆ ಅಥವಾ ದುಃಖ ದೈನಂದಿನ ಜೀವನಕ್ಕೆ ಅಡ್ಡಿಯಾದರೆ ವಿಶ್ವಾಸಾರ್ಹ ವ್ಯಕ್ತಿ ಮತ್ತು ಆರೈಕೆ ತಂಡಕ್ಕೆ ತಿಳಿಸಿ. ಗರ್ಭಧಾರಣೆ ಮತ್ತು ಹೆರಿಗೆಯ ನಂತರ ಬೆಂಬಲ ಲಭ್ಯವಿದೆ. ನಿಮಗೆ ಅಥವಾ ಮಗುವಿಗೆ ಹಾನಿ ಮಾಡುವ ಯೋಚನೆ ಬಂದರೆ ತಕ್ಷಣ ತುರ್ತು ನೆರವು ಪಡೆಯಿರಿ ಮತ್ತು ವಿಶ್ವಾಸಾರ್ಹ ವ್ಯಕ್ತಿಯನ್ನು ನಿಮ್ಮೊಂದಿಗೆ ಇರಲು ಕೇಳಿ.'),
  sources:[{title:'NHS: Mental health in pregnancy and after birth',url:nhs+'pregnancy/mental-health-in-pregnancy-and-after-the-birth/'}],
 },
 {
  slug:'birth-preparation-v1',category:'labor_delivery',tags:['trimester_3'],
  title:text('Prepare your birth contact plan', 'प्रसव के लिए संपर्क योजना बनाएँ', 'ಹೆರಿಗೆ ಸಂಪರ್ಕ ಯೋಜನೆ ತಯಾರಿಸಿ'),
  body:text('Keep your maternity unit’s contact number, transport plan and health records ready. Contractions or waters breaking can mean labour is starting. Contact your maternity team if you think labour has started or are unsure. Bleeding, reduced baby movements or possible labour before 37 weeks need urgent contact.', 'प्रसूति केंद्र का नंबर, परिवहन योजना और स्वास्थ्य रिकॉर्ड तैयार रखें। संकुचन या पानी की थैली फटना प्रसव शुरू होने का संकेत हो सकता है। प्रसव शुरू लगता हो या संदेह हो तो टीम से संपर्क करें। रक्तस्राव, बच्चे की हलचल कम होना या 37 सप्ताह से पहले प्रसव का संदेह हो तो तुरंत संपर्क करें।', 'ಪ್ರಸೂತಿ ಘಟಕದ ಸಂಪರ್ಕ ಸಂಖ್ಯೆ, ಸಾರಿಗೆ ಯೋಜನೆ ಮತ್ತು ಆರೋಗ್ಯ ದಾಖಲೆಗಳನ್ನು ಸಿದ್ಧವಾಗಿಡಿ. ಸಂಕೋಚನಗಳು ಅಥವಾ ನೀರು ಒಡೆಯುವುದು ಹೆರಿಗೆ ಆರಂಭದ ಸೂಚನೆಯಾಗಬಹುದು. ಹೆರಿಗೆ ಆರಂಭವಾಗಿದೆ ಎಂದು ಅನಿಸಿದರೆ ಅಥವಾ ಅನುಮಾನವಿದ್ದರೆ ತಂಡವನ್ನು ಸಂಪರ್ಕಿಸಿ. ರಕ್ತಸ್ರಾವ, ಮಗುವಿನ ಚಲನೆ ಕಡಿಮೆಯಾಗುವುದು ಅಥವಾ 37 ವಾರಗಳ ಮೊದಲು ಹೆರಿಗೆಯ ಅನುಮಾನ ಇದ್ದರೆ ತುರ್ತಾಗಿ ಸಂಪರ್ಕಿಸಿ.'),
  sources:[{title:'NHS: Signs of labour',url:nhs+'pregnancy/labour-and-birth/signs-that-labour-has-begun/'}],
 },
 {
  slug:'postpartum-recovery-v1',category:'postpartum',tags:['trimester_3'],
  title:text('Plan support after birth', 'प्रसव के बाद सहायता की तैयारी', 'ಹೆರಿಗೆಯ ನಂತರ ಬೆಂಬಲಕ್ಕೆ ಸಿದ್ಧತೆ'),
  body:text('Arrange practical help and follow-up with your care team after birth. Tell them about physical discomfort and emotional concerns. Heavy bleeding, chest pain or difficulty breathing require urgent medical help.', 'प्रसव के बाद व्यावहारिक सहायता और देखभाल भेंट की व्यवस्था करें। शारीरिक तकलीफ़ और भावनात्मक चिंता के बारे में टीम को बताएँ। बहुत रक्तस्राव, सीने में दर्द या साँस लेने में परेशानी हो तो तुरंत चिकित्सा सहायता लें।', 'ಹೆರಿಗೆಯ ನಂತರ ದೈನಂದಿನ ಸಹಾಯ ಮತ್ತು ಆರೈಕೆ ಭೇಟಿಗಳನ್ನು ಯೋಜಿಸಿ. ದೈಹಿಕ ತೊಂದರೆಗಳು ಮತ್ತು ಭಾವನಾತ್ಮಕ ಚಿಂತೆಗಳನ್ನು ತಂಡಕ್ಕೆ ತಿಳಿಸಿ. ಭಾರೀ ರಕ್ತಸ್ರಾವ, ಎದೆನೋವು ಅಥವಾ ಉಸಿರಾಟದ ತೊಂದರೆಗೆ ತುರ್ತು ವೈದ್ಯಕೀಯ ನೆರವು ಬೇಕು.'),
  sources:[{title:'NHS: Your body after birth',url:nhs+'pregnancy/labour-and-birth/your-body/'}],
 },
 {
  slug:'feeding-support-v1',category:'breastfeeding',tags:['trimester_3'],
  title:text('Get help with feeding your baby', 'बच्चे को दूध पिलाने में सहायता लें', 'ಮಗುವಿಗೆ ಹಾಲುಣಿಸಲು ನೆರವು ಪಡೆಯಿರಿ'),
  body:text('Ask your maternity team for feeding support early. If breastfeeding, offer feeds when your baby shows they want to feed. Seek help with pain, attachment or concerns about feeding and weight. Your team can support breastfeeding, formula feeding or a combination.', 'दूध पिलाने में सहायता के लिए प्रसूति टीम से जल्दी पूछें। स्तनपान कराते समय बच्चे के भूख के संकेत पर दूध दें। दर्द, सही पकड़ या दूध और वजन की चिंता हो तो सहायता लें। टीम स्तनपान, फ़ॉर्मूला या दोनों में मदद कर सकती है।', 'ಹಾಲುಣಿಸುವ ನೆರವಿಗಾಗಿ ಪ್ರಸೂತಿ ತಂಡವನ್ನು ಬೇಗ ಕೇಳಿ. ಸ್ತನ್ಯಪಾನ ಮಾಡಿಸುವಾಗ ಮಗುವಿನ ಹಸಿವಿನ ಸೂಚನೆಗಳಿಗೆ ತಕ್ಕಂತೆ ಹಾಲುಣಿಸಿ. ನೋವು, ಸರಿಯಾದ ಹಿಡಿತ, ಹಾಲುಣಿಸುವಿಕೆ ಅಥವಾ ತೂಕದ ಬಗ್ಗೆ ಚಿಂತೆ ಇದ್ದರೆ ನೆರವು ಪಡೆಯಿರಿ. ತಂಡ ಸ್ತನ್ಯಪಾನ, ಫಾರ್ಮುಲಾ ಅಥವಾ ಎರಡಕ್ಕೂ ಬೆಂಬಲ ನೀಡಬಹುದು.'),
  sources:[{title:'NHS: Early days after birth',url:nhs+'pregnancy/labour-and-birth/early-days/'}],
 },
 {
  slug:'newborn-checks-v1',category:'baby_care',tags:['trimester_3'],
  title:text('Your baby’s early checks', 'बच्चे की शुरुआती जाँच', 'ಮಗುವಿನ ಆರಂಭಿಕ ಪರೀಕ್ಷೆಗಳು'),
  body:text('Ask your local care team about newborn checks and follow-up. They can review feeding, weight and concerns such as jaundice. Keep questions and feeding concerns ready for your visits.', 'स्थानीय देखभाल टीम से नवजात की जाँच और अगली भेंट पूछें। टीम दूध, वजन और पीलिया जैसी चिंता की समीक्षा कर सकती है। भेंट के लिए सवाल और दूध संबंधी चिंता तैयार रखें।', 'ನವಜಾತ ಪರೀಕ್ಷೆಗಳು ಮತ್ತು ಮುಂದಿನ ಭೇಟಿಗಳ ಬಗ್ಗೆ ಸ್ಥಳೀಯ ಆರೈಕೆ ತಂಡವನ್ನು ಕೇಳಿ. ಹಾಲುಣಿಸುವಿಕೆ, ತೂಕ ಮತ್ತು ಕಾಮಾಲೆಯಂತಹ ಚಿಂತೆಗಳನ್ನು ಅವರು ಪರಿಶೀಲಿಸಬಹುದು. ಭೇಟಿಗಳಿಗಾಗಿ ಪ್ರಶ್ನೆಗಳನ್ನು ಮತ್ತು ಹಾಲುಣಿಸುವ ಚಿಂತೆಗಳನ್ನು ಸಿದ್ಧವಾಗಿಡಿ.'),
  sources:[{title:'NHS: Early days after birth',url:nhs+'pregnancy/labour-and-birth/early-days/'}],
 },
 {
  slug:'urgent-warning-signs-v1',category:'warning_signs',tags:['general','risk_followup'],
  title:text('Warning signs: when to get urgent help', 'चेतावनी संकेत: तुरंत सहायता कब लें', 'ಎಚ್ಚರಿಕೆ ಸೂಚನೆಗಳು: ತುರ್ತು ನೆರವು ಯಾವಾಗ ಪಡೆಯಬೇಕು'),
  body:text('Seek immediate medical care for severe headache, vision changes, chest pain, trouble breathing, heavy bleeding or severe belly pain. During pregnancy, a baby moving less than usual also needs prompt assessment. Tell the clinician you are pregnant or recently gave birth. This is not a complete symptom list; contact your care team if something feels wrong.', 'तेज़ सिरदर्द, नज़र में बदलाव, सीने में दर्द, साँस में परेशानी, बहुत रक्तस्राव या पेट में तेज़ दर्द हो तो तुरंत चिकित्सा सहायता लें। गर्भावस्था में बच्चे की सामान्य से कम हलचल की भी जल्दी जाँच चाहिए। डॉक्टर को गर्भावस्था या हाल के प्रसव के बारे में बताएँ। यह सभी लक्षणों की सूची नहीं है; कुछ गलत लगे तो टीम से संपर्क करें।', 'ತೀವ್ರ ತಲೆನೋವು, ದೃಷ್ಟಿ ಬದಲಾವಣೆ, ಎದೆನೋವು, ಉಸಿರಾಟದ ತೊಂದರೆ, ಭಾರೀ ರಕ್ತಸ್ರಾವ ಅಥವಾ ತೀವ್ರ ಹೊಟ್ಟೆನೋವಿಗೆ ತಕ್ಷಣ ವೈದ್ಯಕೀಯ ನೆರವು ಪಡೆಯಿರಿ. ಗರ್ಭಧಾರಣೆಯಲ್ಲಿ ಮಗುವಿನ ಚಲನೆ ಸಾಮಾನ್ಯಕ್ಕಿಂತ ಕಡಿಮೆ ಇದ್ದರೂ ಶೀಘ್ರ ಪರೀಕ್ಷೆ ಬೇಕು. ಗರ್ಭಿಣಿಯಾಗಿದ್ದೀರಿ ಅಥವಾ ಇತ್ತೀಚೆಗೆ ಹೆರಿಗೆಯಾಗಿದೆ ಎಂದು ವೈದ್ಯರಿಗೆ ತಿಳಿಸಿ. ಇದು ಸಂಪೂರ್ಣ ಲಕ್ಷಣಗಳ ಪಟ್ಟಿಯಲ್ಲ; ಏನೋ ತಪ್ಪಾಗಿದೆ ಎಂದು ಅನಿಸಿದರೆ ತಂಡವನ್ನು ಸಂಪರ್ಕಿಸಿ.'),
  sources:[{title:'CDC: Urgent maternal warning signs',url:'https://www.cdc.gov/hearher/maternal-warning-signs/index.html'}],
 },
];
export async function seedEducationResources() {
 await EducationalContent.init();
 for (const resource of STARTER_RESOURCES) {
  try { await EducationalContent.updateOne({slug:resource.slug},{$setOnInsert:{...resource,isActive:true}},{upsert:true}); }
  catch(error) { if((error as {code?:number}).code !== 11000) throw error; }
 }
}
