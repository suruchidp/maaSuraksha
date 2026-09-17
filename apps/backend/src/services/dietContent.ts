import { Language } from "@maasuraksha/shared";
import type { DietMealPreference, DietRegion } from "@maasuraksha/shared";

/**
 * Hand-authored, multilingual (EN / HI / KN) knowledge base for the
 * system-generated diet guidance engine.
 *
 * These strings are educational decision support only, NEVER a prescription or
 * a diagnosis. All text is concise, original MaaSuraksha content derived from
 * public dietary guidance (see `DIET_SOURCES`), and every produced record
 * carries source attribution. The engine fills `{placeholder}` tokens
 * exclusively with REAL persisted values; no value is invented here.
 */

export const DIET_CONTENT_VERSION = "diet-v1";

export type LocalizedText = Record<Language, string>;

function L(en: string, hi: string, kn: string): LocalizedText {
  return { en, hi, kn };
}

export interface DietSourceRef {
  id: string;
  title: string;
  url: string;
}

export const DIET_SOURCES: Record<string, DietSourceRef> = {
  icmr: {
    id: "icmr-dgi-2024",
    title: "ICMR-NIN Dietary Guidelines for Indians 2024",
    url: "https://nin.res.in/dietaryguidelines/",
  },
  nhm: {
    id: "nhm-gdm",
    title:
      "Govt of India — National Guidelines for Diagnosis & Management of Gestational Diabetes Mellitus",
    url: "https://nhm.gov.in/",
  },
  fssai: {
    id: "fssai-eat-right",
    title: "FSSAI — Eat Right India",
    url: "https://www.fssai.gov.in",
  },
  who: {
    id: "who-maternal-nutrition",
    title: "World Health Organization — Maternal nutrition",
    url: "https://www.who.int/",
  },
};

export const DIET_DISCLAIMER: LocalizedText = L(
  "This diet guidance is educational decision support only — it is not a prescription and does not diagnose any condition. Always discuss your diet, supplements and medical care with your doctor or a qualified dietitian.",
  "यह आहार मार्गदर्शन केवल शैक्षिक सहायता है — यह नुस्खा नहीं है और किसी स्थिति का निदान नहीं है। अपने आहार, पूरक और चिकित्सकीय देखभाल पर हमेशा अपने डॉक्टर या योग्य आहार विशेषज्ञ से चर्चा करें।",
  "ಈ ಆಹಾರ ಮಾರ್ಗದರ್ಶನವು ಕೇವಲ ಶೈಕ್ಷಣಿಕ ಬೆಂಬಲವಾಗಿದೆ — ಇದು ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಅಲ್ಲ ಮತ್ತು ಯಾವುದೇ ಸ್ಥಿತಿಯ ರೋಗನಿರ್ಣಯವಲ್ಲ. ನಿಮ್ಮ ಆಹಾರ, ಪೂರಕ ಮತ್ತು ವೈದ್ಯಕೀಯ ಆರೈಕೆಯ ಬಗ್ಗೆ ಯಾವಾಗಲೂ ನಿಮ್ಮ ವೈದ್ಯರು ಅಥವಾ ಅರ್ಹ ಆಹಾರ ತಜ್ಞರೊಂದಿಗೆ ಚರ್ಚಿಸಿ."
);

export const DIET_GENERAL_PRINCIPLES: LocalizedText[] = [
  L(
    "Eat a variety of foods from different groups every day — cereals, dals and pulses, dairy, vegetables, fruits, nuts and oils.",
    "हर दिन अलग-अलग समूहों के खाद्य पदार्थ खाएं — अनाज, दालें, दूध, सब्ज़ियाँ, फल, मेवे और तेल।",
    "ಪ್ರತಿದಿನ ವಿವಿಧ ಗುಂಪುಗಳ ಆಹಾರವನ್ನು ಸೇವಿಸಿ — ಧಾನ್ಯಗಳು, ಬೇಳೆಗಳು, ಹಾಲು, ತರಕಾರಿಗಳು, ಹಣ್ಣುಗಳು, ಬೀಜಗಳು ಮತ್ತು ಎಣ್ಣೆ."
  ),
  L(
    "Include whole grains and millets in your daily meals — whole wheat, brown rice, ragi, jowar, bajra.",
    "अपने दैनिक भोजन में साबुत अनाज और मोटे अनाज शामिल करें — गेहूं, ब्राउन राइस, रागी, ज्वार, बाजरा।",
    "ನಿಮ್ಮ ದೈನಂದಿನ ಊಟದಲ್ಲಿ ಸಂಪೂರ್ಣ ಧಾನ್ಯಗಳು ಮತ್ತು ಸಿರಿಧಾನ್ಯಗಳನ್ನು ಸೇರಿಸಿ — ಗೋಧಿ, ಕಂದು ಅಕ್ಕಿ, ರಾಗಿ, ಜೋಳ, ಸಜ್ಜೆ."
  ),
  L(
    "Add plenty of vegetables, including green leafy vegetables, and seasonal fruits to meals each day.",
    "भोजन में खूब सब्ज़ियाँ, हरी पत्तेदार सब्ज़ियाँ और मौसमी फल शामिल करें।",
    "ಊಟದಲ್ಲಿ ಸಾಕಷ್ಟು ತರಕಾರಿಗಳು, ಹಸಿರು ಎಲೆ ತರಕಾರಿಗಳು ಮತ್ತು ಕಾಲದ ಹಣ್ಣುಗಳನ್ನು ಸೇರಿಸಿ."
  ),
  L(
    "Include dals, beans, milk and curd for protein and calcium.",
    "प्रोटीन और कैल्शियम के लिए दालें, बीन्स, दूध और दही शामिल करें।",
    "ಪ್ರೋಟೀನ್ ಮತ್ತು ಕ್ಯಾಲ್ಸಿಯಂಗೆ ಬೇಳೆಗಳು, ಬೀನ್ಸ್, ಹಾಲು ಮತ್ತು ಮೊಸರು ಸೇರಿಸಿ."
  ),
  L(
    "Use a moderate amount of cooking oil and avoid deep-fried foods most days.",
    "तेल सीमित मात्रा में उपयोग करें और अधिकांश दिन तले हुए खाद्य पदार्थों से बचें।",
    "ಅಡುಗೆ ಎಣ್ಣೆಯನ್ನು ಮಿತವಾಗಿ ಬಳಸಿ ಮತ್ತು ಹೆಚ್ಚಿನ ದಿನಗಳಲ್ಲಿ ಆಳ ಎಣ್ಣೆಯಲ್ಲಿ ಕರಿದ ಆಹಾರಗಳನ್ನು ತಪ್ಪಿಸಿ."
  ),
  L(
    "Limit added salt, sugar and sugary drinks; season food lightly.",
    "नमक, चीनी और मीठे पेय सीमित करें; भोजन हल्का खाएं।",
    "ಉಪ್ಪು, ಸಕ್ಕರೆ ಮತ್ತು ಸಿಹಿ ಪಾನೀಯಗಳನ್ನು ಮಿತಿಗೊಳಿಸಿ; ಆಹಾರವನ್ನು ಹಗುರವಾಗಿ ತಯಾರಿಸಿ."
  ),
  L(
    "Drink safe, clean water regularly through the day.",
    "दिन भर नियमित रूप से साफ़, शुद्ध पानी पिएं।",
    "ದಿನವಿಡೀ ನಿಯಮಿತವಾಗಿ ಸುರಕ್ಷಿತ, ಶುದ್ಧ ನೀರು ಕುಡಿಯಿರಿ."
  ),
];

export const DIET_HYDRATION: LocalizedText = L(
  "Drink water regularly through the day, especially in hot weather. Safe, clean drinking water is important in pregnancy. If your doctor has advised you to limit fluids for any medical reason, follow their advice.",
  "दिन भर नियमित रूप से पानी पिएं, खासकर गर्म मौसम में। गर्भावस्था में सुरक्षित, शुद्ध पानी महत्वपूर्ण है। यदि किसी चिकित्सकीय कारण से आपके डॉक्टर ने तरल सीमित करने को कहा है, तो उनकी सलाह का पालन करें।",
  "ವಿಶೇಷವಾಗಿ ಬಿಸಿ ವಾತಾವರಣದಲ್ಲಿ ದಿನವಿಡೀ ನಿಯಮಿತವಾಗಿ ನೀರು ಕುಡಿಯಿರಿ. ಗರ್ಭಧಾರಣೆಯಲ್ಲಿ ಸುರಕ್ಷಿತ, ಶುದ್ಧ ನೀರು ಮುಖ್ಯ. ಯಾವುದೇ ವೈದ್ಯಕೀಯ ಕಾರಣಕ್ಕಾಗಿ ನಿಮ್ಮ ವೈದ್ಯರು ದ್ರವಗಳನ್ನು ಮಿತಿಗೊಳಿಸಲು ಸಲಹೆ ನೀಡಿದ್ದರೆ, ಅವರ ಸಲಹೆಯನ್ನು ಅನುಸರಿಸಿ."
);

export const DIET_FOOD_SAFETY: LocalizedText[] = [
  L(
    "Wash vegetables and fruits well before eating or cooking.",
    "खाने या पकाने से पहले सब्ज़ियों और फलों को अच्छी तरह धोएं।",
    "ತಿನ್ನುವ ಅಥವಾ ಅಡುಗೆ ಮಾಡುವ ಮೊದಲು ತರಕಾರಿ ಮತ್ತು ಹಣ್ಣುಗಳನ್ನು ಚೆನ್ನಾಗಿ ತೊಳೆಯಿರಿ."
  ),
  L(
    "Cook pulses, meat, eggs and fish fully before eating.",
    "दाल, मांस, अंडे और मछली को खाने से पहले पूरी तरह पकाएं।",
    "ಬೇಳೆ, ಮಾಂಸ, ಮೊಟ್ಟೆ ಮತ್ತು ಮೀನನ್ನು ತಿನ್ನುವ ಮೊದಲು ಚೆನ್ನಾಗಿ ಬೇಯಿಸಿ."
  ),
  L(
    "In pregnancy, avoid raw or undercooked eggs, meat and fish.",
    "गर्भावस्था में कच्चे या अधपके अंडे, मांस और मछली से बचें।",
    "ಗರ್ಭಧಾರಣೆಯಲ್ಲಿ ಹಸಿ ಅಥವಾ ಅರೆಬೇಯಿಸಿದ ಮೊಟ್ಟೆ, ಮಾಂಸ ಮತ್ತು ಮೀನನ್ನು ತಪ್ಪಿಸಿ."
  ),
  L(
    "Avoid unpasteurised milk and salads with raw, unwashed greens from unknown sources.",
    "बिना पाश्चुरीकृत दूध और अज्ञात स्रोतों से कच्ची, बिना धुली हरी सब्ज़ियों वाले सलाद से बचें।",
    "ಪಾಶ್ಚುರೈಸ್ ಮಾಡದ ಹಾಲು ಮತ್ತು ಅಜ್ಞಾತ ಮೂಲದ ಹಸಿ, ತೊಳೆಯದ ಸೊಪ್ಪುಗಳ ಸಲಾಡ್ ತಪ್ಪಿಸಿ."
  ),
  L(
    "Store cooked food safely and reheat well; do not leave it out for long.",
    "पका हुआ भोजन सुरक्षित रखें और अच्छी तरह गरम करें; इसे देर तक बाहर न रखें।",
    "ಬೇಯಿಸಿದ ಆಹಾರವನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಇರಿಸಿ ಮತ್ತು ಚೆನ್ನಾಗಿ ಬಿಸಿ ಮಾಡಿ; ದೀರ್ಘಕಾಲ ಹೊರಗೆ ಇಡಬೇಡಿ."
  ),
];

export const DIET_SUBSTITUTIONS: LocalizedText[] = [
  L(
    "Some days swap polished white rice for other grains like brown rice, millets or whole-wheat roti.",
    "कुछ दिन सफ़ेद चावल की जगह ब्राउन राइस, मोटे अनाज या साबुत गेहूं की रोटी खाएं।",
    "ಕೆಲವು ದಿನ ಬಿಳಿ ಅಕ್ಕಿಯ ಬದಲು ಕಂದು ಅಕ್ಕಿ, ಸಿರಿಧಾನ್ಯಗಳು ಅಥವಾ ಗೋಧಿ ರೊಟ್ಟಿ ಸೇವಿಸಿ."
  ),
  L(
    "Between meals, choose fruit, curd, roasted chana or nuts instead of biscuits, chips or sugary snacks.",
    "भोजन के बीच बिस्कुट, चिप्स या मीठे स्नैक्स की जगह फल, दही, भुना चना या मेवे लें।",
    "ಊಟದ ಮಧ್ಯೆ ಬಿಸ್ಕತ್ತು, ಚಿಪ್ಸ್ ಅಥವಾ ಸಿಹಿ ತಿಂಡಿಗಳ ಬದಲು ಹಣ್ಣು, ಮೊಸರು, ಹುರಿದ ಕಡಲೆ ಅಥವಾ ಬೀಜಗಳನ್ನು ಆಯ್ಕೆ ಮಾಡಿ."
  ),
  L(
    "Prefer whole fruit over fruit juice, and plain water over sweet drinks.",
    "फलों के रस की जगह पूरा फल और मीठे पेय की जगह सादा पानी चुनें।",
    "ಹಣ್ಣಿನ ರಸಕ್ಕಿಂತ ಸಂಪೂರ್ಣ ಹಣ್ಣನ್ನು, ಸಿಹಿ ಪಾನೀಯಗಳಿಗಿಂತ ಸಾದಾ ನೀರನ್ನು ಆರಿಸಿ."
  ),
  L(
    "Choose steaming, boiling or light sautéing over deep-frying on most days.",
    "अधिकांश दिनों में तलने की जगह भाप, उबाल या हल्की भूनाई चुनें।",
    "ಹೆಚ್ಚಿನ ದಿನಗಳಲ್ಲಿ ಆಳ ಎಣ್ಣೆ ಕರಿಯುವುದಕ್ಕಿಂತ ಆವಿಯಲ್ಲಿ ಬೇಯಿಸುವುದು, ಕುದಿಸುವುದು ಅಥವಾ ಸೌಮ್ಯ ಹುರಿಯುವುದನ್ನು ಆರಿಸಿ."
  ),
];

export interface DietStageTemplate {
  title: LocalizedText;
  body: LocalizedText;
  bullets: LocalizedText[];
}

export const DIET_STAGE_MISSING: DietStageTemplate = {
  title: L(
    "Balanced eating in pregnancy",
    "गर्भावस्था में संतुलित आहार",
    "ಗರ್ಭಧಾರಣೆಯಲ್ಲಿ ಸಮತೋಲಿತ ಆಹಾರ"
  ),
  body: L(
    "We do not yet have your pregnancy profile, so this general guidance applies at any stage. Once your profile is added, guidance specific to your trimester will appear here.",
    "अभी आपका गर्भावस्था प्रोफ़ाइल मौजूद नहीं है, इसलिए यह सामान्य मार्गदर्शन किसी भी चरण पर लागू होता है। प्रोफ़ाइल जुड़ते ही आपकी तिमाही के अनुसार मार्गदर्शन यहाँ दिखेगा।",
    "ನಿಮ್ಮ ಗರ್ಭಧಾರಣೆ ಪ್ರೊಫೈಲ್ ಇನ್ನೂ ಇಲ್ಲ, ಆದ್ದರಿಂದ ಈ ಸಾಮಾನ್ಯ ಮಾರ್ಗದರ್ಶನ ಯಾವುದೇ ಹಂತಕ್ಕೆ ಅನ್ವಯಿಸುತ್ತದೆ. ಪ್ರೊಫೈಲ್ ಸೇರಿದಾಗ ನಿಮ್ಮ ತ್ರೈಮಾಸಿಕಕ್ಕೆ ನಿರ್ದಿಷ್ಟವಾದ ಮಾರ್ಗದರ್ಶನ ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತದೆ."
  ),
  bullets: [
    ...DIET_GENERAL_PRINCIPLES,
    L(
      "Share your diet and any concerns with your care team, and keep your antenatal appointments.",
      "अपने आहार और किसी भी चिंता को देखभाल टीम के साथ साझा करें, और प्रसवपूर्व मुलाकातें जारी रखें।",
      "ನಿಮ್ಮ ಆಹಾರ ಮತ್ತು ಯಾವುದೇ ಕಾಳಜಿಗಳನ್ನು ಆರೈಕೆ ತಂಡದೊಂದಿಗೆ ಹಂಚಿಕೊಳ್ಳಿ, ಮತ್ತು ಪ್ರಸವಪೂರ್ವ ಭೇಟಿಗಳನ್ನು ಮುಂದುವರಿಸಿ."
    ),
  ],
};

export const DIET_STAGE: Record<"1" | "2" | "3", DietStageTemplate> = {
  "1": {
    title: L(
      "First-trimester nutrition",
      "पहली तिमाही के लिए आहार",
      "ಮೊದಲ ತ್ರೈಮಾಸಿಕ ಆಹಾರ"
    ),
    body: L(
      "In the first trimester your body is adjusting to pregnancy. Eating a variety of light, balanced meals throughout the day helps you get the nutrients you need even if you feel sick.",
      "पहली तिमाही में आपका शरीर गर्भावस्था के अनुसार ढल रहा है। पूरे दिन हल्के, संतुलित भोजन करने से आपको आवश्यक पोषक तत्व मिलते हैं, भले ही आपको उल्टी या मतली हो।",
      "ಮೊದಲ ತ್ರೈಮಾಸಿಕದಲ್ಲಿ ನಿಮ್ಮ ದೇಹ ಗರ್ಭಧಾರಣೆಗೆ ಹೊಂದಿಕೊಳ್ಳುತ್ತಿದೆ. ವಾಕರಿಕೆ ಇದ್ದರೂ ದಿನವಿಡೀ ಹಗುರವಾದ, ಸಮತೋಲಿತ ಊಟವನ್ನು ಸೇವಿಸುವುದರಿಂದ ಅಗತ್ಯ ಪೋಷಕಾಂಶಗಳು ಸಿಗುತ್ತವೆ."
    ),
    bullets: [
      L(
        "If nausea bothers you, try small, frequent meals and bland foods rather than one big meal.",
        "मतली परेशान करे तो एक बड़े भोजन की जगह छोटे-छोटे बार-बार भोजन और हल्का सादा भोजन लें।",
        "ವಾಕರಿಕೆ ಮುಖ್ಯವಾಗಿದ್ದರೆ, ದೊಡ್ಡ ಊಟಕ್ಕಿಂತ ಸಣ್ಣ, ಆಗಾಗ್ಗೆ ಊಟ ಮತ್ತು ಸೌಮ್ಯ ಸಾದಾ ಆಹಾರ ಸೇವಿಸಿ."
      ),
      L(
        "Include iron-rich foods like green leafy vegetables, dals, beans and ragi, and foods rich in folate.",
        "हरी पत्तेदार सब्ज़ियाँ, दालें, बीन्स, रागी जैसे आयरन युक्त और फोलेट युक्त खाद्य पदार्थ शामिल करें।",
        "ಹಸಿರು ಎಲೆ ತರಕಾರಿಗಳು, ಬೇಳೆಗಳು, ಬೀನ್ಸ್, ರಾಗಿ ಮುಂತಾದ ಕಬ್ಬಿಣ ಭರಿತ ಮತ್ತು ಫೋಲೇಟ್ ಭರಿತ ಆಹಾರಗಳನ್ನು ಸೇರಿಸಿ."
      ),
      L(
        "Drink water regularly and keep your antenatal appointments.",
        "नियमित रूप से पानी पिएं और प्रसवपूर्व मुलाकातें जारी रखें।",
        "ನಿಯಮಿತವಾಗಿ ನೀರು ಕುಡಿಯಿರಿ ಮತ್ತು ಪ್ರಸವಪೂರ್ವ ಭೇಟಿಗಳನ್ನು ಮುಂದುವರಿಸಿ."
      ),
    ],
  },
  "2": {
    title: L(
      "Second-trimester nutrition",
      "दूसरी तिमाही के लिए आहार",
      "ಎರಡನೇ ತ್ರೈಮಾಸಿಕ ಆಹಾರ"
    ),
    body: L(
      "In the second trimester your appetite often increases as your baby grows. Keep meals regular and balanced, and pay attention to protein, calcium and iron-rich foods.",
      "दूसरी तिमाही में बच्चे की वृद्धि के साथ भूख अक्सर बढ़ती है। भोजन नियमित और संतुलित रखें, और प्रोटीन, कैल्शियम और आयरन युक्त खाद्य पदार्थों पर ध्यान दें।",
      "ಎರಡನೇ ತ್ರೈಮಾಸಿಕದಲ್ಲಿ ಮಗು ಬೆಳೆದಂತೆ ಹಸಿವು ಹೆಚ್ಚಾಗುತ್ತದೆ. ಊಟವನ್ನು ನಿಯಮಿತ ಮತ್ತು ಸಮತೋಲಿತವಾಗಿಡಿ, ಪ್ರೋಟೀನ್, ಕ್ಯಾಲ್ಸಿಯಂ ಮತ್ತು ಕಬ್ಬಿಣ ಭರಿತ ಆಹಾರಗಳಿಗೆ ಗಮನ ಕೊಡಿ."
    ),
    bullets: [
      L(
        "Include milk, curd, dal, beans and paneer each day for protein and calcium.",
        "रोज़ दूध, दही, दाल, बीन्स और पनीर शामिल करें — ये प्रोटीन और कैल्शियम देते हैं।",
        "ಪ್ರತಿದಿನ ಹಾಲು, ಮೊಸರು, ಬೇಳೆ, ಬೀನ್ಸ್ ಮತ್ತು ಪನೀರ್ ಸೇರಿಸಿ — ಇವು ಪ್ರೋಟೀನ್ ಮತ್ತು ಕ್ಯಾಲ್ಸಿಯಂ ನೀಡುತ್ತವೆ."
      ),
      L(
        "Build each meal around a whole grain plus a vegetable and a protein food.",
        "हर भोजन में साबुत अनाज के साथ सब्ज़ी और एक प्रोटीन युक्त चीज़ शामिल करें।",
        "ಪ್ರತಿ ಊಟದಲ್ಲಿ ಧಾನ್ಯದೊಂದಿಗೆ ತರಕಾರಿ ಮತ್ತು ಪ್ರೋಟೀನ್ ಆಹಾರ ಸೇರಿಸಿ."
      ),
      L(
        "Choose fruits as snacks and keep sugary snacks limited.",
        "नाश्ते में फल चुनें और मीठे स्नैक्स सीमित रखें।",
        "ತಿಂಡಿಗೆ ಹಣ್ಣುಗಳನ್ನು ಆರಿಸಿ ಮತ್ತು ಸಿಹಿ ತಿಂಡಿಗಳನ್ನು ಮಿತಿಗೊಳಿಸಿ."
      ),
    ],
  },
  "3": {
    title: L(
      "Third-trimester nutrition",
      "तीसरी तिमाही के लिए आहार",
      "ಮೂರನೇ ತ್ರೈಮಾಸಿಕ ಆಹಾರ"
    ),
    body: L(
      "In the third trimester your baby grows quickly and your tummy is fuller, so small frequent meals can feel more comfortable. Keep iron-rich foods, fiber and fluids in your routine.",
      "तीसरी तिमाही में शिशु तेज़ी से बढ़ता है और पेट भरा रहता है, इसलिए छोटे-छोटे बार-बार भोजन आरामदायक होते हैं। आयरन युक्त भोजन, फाइबर और तरल पदार्थ नियमित रखें।",
      "ಮೂರನೇ ತ್ರೈಮಾಸಿಕದಲ್ಲಿ ಮಗು ವೇಗವಾಗಿ ಬೆಳೆಯುತ್ತದೆ, ಹೊಟ್ಟೆ ತುಂಬಿರುತ್ತದೆ, ಆದ್ದರಿಂದ ಸಣ್ಣ, ಆಗಾಗ್ಗೆ ಊಟ ಹೆಚ್ಚು ಆರಾಮಕರ. ಕಬ್ಬಿಣ ಭರಿತ ಆಹಾರ, ನಾರಿನ ಅಂಶ ಮತ್ತು ದ್ರವಗಳನ್ನು ನಿಯಮಿತವಾಗಿಡಿ."
    ),
    bullets: [
      L(
        "Eat small, frequent meals and include green leafy vegetables, dals and fruits.",
        "छोटे-छोटे बार-बार भोजन करें और हरी पत्तेदार सब्ज़ियाँ, दालें और फल शामिल करें।",
        "ಸಣ್ಣ, ಆಗಾಗ್ಗೆ ಊಟ ಮಾಡಿ ಮತ್ತು ಹಸಿರು ಎಲೆ ತರಕಾರಿಗಳು, ಬೇಳೆಗಳು ಮತ್ತು ಹಣ್ಣುಗಳನ್ನು ಸೇರಿಸಿ."
      ),
      L(
        "Keep fiber in your meals to help with constipation, and drink water regularly.",
        "कब्ज़ से राहत के लिए भोजन में फाइबर रखें और नियमित पानी पिएं।",
        "ಮಲಬದ್ಧತೆಗೆ ಊಟದಲ್ಲಿ ನಾರಿನ ಅಂಶ ಇರಿಸಿ ಮತ್ತು ನಿಯಮಿತವಾಗಿ ನೀರು ಕುಡಿಯಿರಿ."
      ),
      L(
        "Limit very salty foods and report any warning signs you have been told about.",
        "बहुत अधिक नमक वाले खाद्य पदार्थ सीमित करें और बताए गए किसी भी चेतावनी संकेत को तुरंत बताएं।",
        "ಅತಿಯಾದ ಉಪ್ಪಿನ ಆಹಾರವನ್ನು ಮಿತಿಗೊಳಿಸಿ ಮತ್ತು ತಿಳಿಸಿದ ಯಾವುದೇ ಎಚ್ಚರಿಕೆ ಚಿಹ್ನೆಗಳನ್ನು ವರದಿ ಮಾಡಿ."
      ),
    ],
  },
};

export const DIET_HIGH_RISK: DietStageTemplate = {
  title: L(
    "Your pregnancy is flagged high risk",
    "आपकी गर्भावस्था उच्च जोखिम अंकित है",
    "ನಿಮ್ಮ ಗರ್ಭಧಾರಣೆ ಹೆಚ್ಚಿನ ಅಪಾಯ ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ"
  ),
  body: L(
    "This guidance is educational only. Because your pregnancy is marked high risk, any diet or lifestyle change should be discussed with your doctor or dietitian, who will guide your personal care plan. General healthy-eating guidance below remains useful.",
    "यह मार्गदर्शन केवल शैक्षिक है। चूँकि आपकी गर्भावस्था उच्च जोखिम अंकित है, आहार या जीवनशैली में कोई भी बदलाव अपने डॉक्टर या आहार विशेषज्ञ से चर्चा करके ही करें, जो आपकी व्यक्तिगत देखभाल योजना बनाएंगे। नीचे दी गई सामान्य स्वस्थ-आहार युक्तियाँ उपयोगी रहती हैं।",
    "ಈ ಮಾರ್ಗದರ್ಶನ ಕೇವಲ ಶೈಕ್ಷಣಿಕ. ನಿಮ್ಮ ಗರ್ಭಧಾರಣೆ ಹೆಚ್ಚಿನ ಅಪಾಯ ಎಂದು ಗುರುತಿಸಲಾಗಿದ್ದರಿಂದ, ಯಾವುದೇ ಆಹಾರ ಅಥವಾ ಜೀವನಶೈಲಿ ಬದಲಾವಣೆಯನ್ನು ವೈದ್ಯರು ಅಥವಾ ಆಹಾರ ತಜ್ಞರೊಂದಿಗೆ ಚರ್ಚಿಸಿ; ಅವರು ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಆರೈಕೆ ಯೋಜನೆಯನ್ನು ಮಾರ್ಗದರ್ಶಿಸುತ್ತಾರೆ. ಕೆಳಗಿನ ಸಾಮಾನ್ಯ ಆರೋಗ್ಯಕರ ಆಹಾರ ಸಲಹೆಗಳು ಉಪಯುಕ್ತವಾಗಿವೆ."
  ),
  bullets: [
    L(
      "Follow the care plan and check-up schedule agreed with your care team.",
      "देखभाल टीम से तय की गई देखभाल योजना और जाँच कार्यक्रम का पालन करें।",
      "ಆರೈಕೆ ತಂಡದೊಂದಿಗೆ ನಿರ್ಧರಿಸಿದ ಆರೈಕೆ ಯೋಜನೆ ಮತ್ತು ತಪಾಸಣೆ ವೇಳಾಪಟ್ಟಿಯನ್ನು ಅನುಸರಿಸಿ."
    ),
    L(
      "Discuss any supplement or dietary change with your provider before starting it.",
      "कोई भी पूरक या आहार परिवर्तन शुरू करने से पहले अपने प्रदाता से चर्चा करें।",
      "ಯಾವುದೇ ಪೂರಕ ಅಥವಾ ಆಹಾರ ಬದಲಾವಣೆ ಪ್ರಾರಂಭಿಸುವ ಮೊದಲು ನಿಮ್ಮ ಆರೈಕೆ ಅಧಿಕಾರಿಯೊಂದಿಗೆ ಚರ್ಚಿಸಿ."
    ),
    L(
      "Report any warning signs you have been told about immediately.",
      "बताए गए किसी भी चेतावनी संकेत की सूचना तुरंत दें।",
      "ತಿಳಿಸಿದ ಯಾವುದೇ ಎಚ್ಚರಿಕೆ ಚಿಹ್ನೆಗಳನ್ನು ತಕ್ಷಣ ವರದಿ ಮಾಡಿ."
    ),
  ],
};

export const DIET_GDM: DietStageTemplate = {
  title: L(
    "Eating well after GDM screening — educational guidance",
    "जीडीएम स्क्रीनिंग के बाद अच्छा आहार — शैक्षिक मार्गदर्शन",
    "GDM ಪರೀಕ್ಷೆಯ ನಂತರ ಉತ್ತಮ ಆಹಾರ — ಶೈಕ್ಷಣಿಕ ಮಾರ್ಗದರ್ಶನ"
  ),
  body: L(
    "Your completed GDM risk screening recorded {level} risk. This is a screening estimate, not a diagnosis of gestational diabetes. As a precaution, eating in a blood-glucose-friendly way can help. Please continue to follow your care team's advice and attend the glucose testing they recommend.",
    "आपकी पूर्ण जीडीएम जोखिम स्क्रीनिंग में {level} जोखिम दर्ज हुआ। यह एक स्क्रीनिंग अनुमान है, गर्भकालीन मधुमेह का निदान नहीं। सावधानी के रूप में रक्त-ग्लूकोज-अनुकूल आहार मदद कर सकता है। कृपया देखभाल टीम की सलाह मानें और उनके द्वारा सुझाई गई ग्लूकोज जाँच कराएं।",
    "ನಿಮ್ಮ ಪೂರ್ಣಗೊಂಡ GDM ಅಪಾಯ ಪರೀಕ್ಷೆಯಲ್ಲಿ {level} ಅಪಾಯ ದಾಖಲಾಗಿದೆ. ಇದು ಪರೀಕ್ಷಾ ಅಂದಾಜು, ಗರ್ಭಾವಧಿ ಮಧುಮೇಹದ ರೋಗನಿರ್ಣಯವಲ್ಲ. ಮುನ್ನೆಚ್ಚರಿಕೆಯಾಗಿ ರಕ್ತ-ಗ್ಲೂಕೋಸ್-ಸ್ನೇಹಿ ಆಹಾರ ಸಹಾಯ ಮಾಡಬಲ್ಲದು. ದಯವಿಟ್ಟು ಆರೈಕೆ ತಂಡದ ಸಲಹೆಯನ್ನು ಅನುಸರಿಸಿ ಮತ್ತು ಅವರು ಶಿಫಾರಸು ಮಾಡಿದ ಗ್ಲೂಕೋಸ್ ಪರೀಕ್ಷೆಗೆ ಹಾಜರಾಗಿ."
  ),
  bullets: [
    L(
      "Have regular meals and small, planned snacks; avoid skipping meals.",
      "नियमित भोजन और छोटे योजनाबद्ध नाश्ते लें; भोजन स्किप न करें।",
      "ನಿಯಮಿತ ಊಟ ಮತ್ತು ಸಣ್ಣ, ಯೋಜಿತ ತಿಂಡಿಗಳನ್ನು ಸೇವಿಸಿ; ಊಟ ಬಿಡಬೇಡಿ."
    ),
    L(
      "Choose whole grains and millets, and balance each meal with vegetables and a protein food such as dal, curd, egg or fish.",
      "साबुत अनाज और मोटे अनाज चुनें, और हर भोजन में सब्ज़ियों और प्रोटीन युक्त चीज़ (दाल, दही, अंडा या मछली) के साथ संतुलन रखें।",
      "ಧಾನ್ಯಗಳು ಮತ್ತು ಸಿರಿಧಾನ್ಯಗಳನ್ನು ಆರಿಸಿ, ಪ್ರತಿ ಊಟವನ್ನು ತರಕಾರಿಗಳು ಮತ್ತು ಪ್ರೋಟೀನ್ ಆಹಾರ (ಬೇಳೆ, ಮೊಸರು, ಮೊಟ್ಟೆ ಅಥವಾ ಮೀನು) ಜೊತೆ ಸಮತೋಲನಗೊಳಿಸಿ."
    ),
    L(
      "Prefer whole fruit over fruit juice; avoid sugary drinks and added sugar.",
      "फलों के रस की जगह पूरा फल चुनें; मीठे पेय और अतिरिक्त चीनी से बचें।",
      "ಹಣ್ಣಿನ ರಸಕ್ಕಿಂತ ಸಂಪೂರ್ಣ ಹಣ್ಣು ಆರಿಸಿ; ಸಿಹಿ ಪಾನೀಯಗಳು ಮತ್ತು ಸೇರಿಸಿದ ಸಕ್ಕರೆಯನ್ನು ತಪ್ಪಿಸಿ."
    ),
    L(
      "Increase fiber with salads, beans and whole grains.",
      "सलाद, बीन्स और साबुत अनाज से फाइबर बढ़ाएं।",
      "ಸಲಾಡ್, ಬೀನ್ಸ್ ಮತ್ತು ಧಾನ್ಯಗಳಿಂದ ನಾರಿನ ಅಂಶ ಹೆಚ್ಚಿಸಿ."
    ),
    L(
      "This is educational support only. Follow the dietary guidance provided by your doctor or qualified dietitian if they have given you an individualized plan.",
      "यह केवल शैक्षिक सहायता है। यदि आपके डॉक्टर या योग्य आहार विशेषज्ञ ने आपको व्यक्तिगत आहार योजना दी है, तो उनके द्वारा दिए गए आहार मार्गदर्शन का पालन करें।",
      "ಇದು ಕೇವಲ ಶೈಕ್ಷಣಿಕ ಬೆಂಬಲ. ನಿಮ್ಮ ವೈದ್ಯರು ಅಥವಾ ಅರ್ಹ ಆಹಾರ ತಜ್ಞರು ನಿಮಗೆ ವೈಯಕ್ತಿಕ ಆಹಾರ ಯೋಜನೆ ನೀಡಿದ್ದರೆ, ಅವರು ನೀಡಿದ ಆಹಾರ ಮಾರ್ಗದರ್ಶನವನ್ನು ಅನುಸರಿಸಿ."
    ),
  ],
};

export interface DietMetricTemplate {
  title: LocalizedText;
  body: LocalizedText;
  bullets: LocalizedText[];
}

export const DIET_METRIC: Record<string, DietMetricTemplate> = {
  iron: {
    title: L(
      "Include iron-rich foods in your meals",
      "अपने भोजन में आयरन युक्त खाद्य पदार्थ शामिल करें",
      "ನಿಮ್ಮ ಊಟದಲ್ಲಿ ಕಬ್ಬಿಣ ಭರಿತ ಆಹಾರಗಳನ್ನು ಸೇರಿಸಿ"
    ),
    body: L(
      "Your latest hemoglobin reading was {hemoglobin} g/dL, below the typical range for pregnancy. Iron-rich foods help support healthy blood levels. This note is educational — it is not a diagnosis of anemia and does not replace your provider's advice.",
      "आपका नवीनतम हीमोग्लोबिन {hemoglobin} g/dL था, जो गर्भावस्था की सामान्य सीमा से कम है। आयरन युक्त खाद्य पदार्थ स्वस्थ रक्त स्तर में सहायक होते हैं। यह सूचना शैक्षिक है — यह एनीमिया का निदान नहीं है और आपके प्रदाता की सलाह का विकल्प नहीं है।",
      "ನಿಮ್ಮ ಇತ್ತೀಚೆ ದಾಖಲಾದ ಹಿಮೋಗ್ಲೋಬಿನ್ {hemoglobin} g/dL ಆಗಿತ್ತು, ಅದು ಗರ್ಭಧಾರಣೆಯ ಸಾಮಾನ್ಯ ವ್ಯಾಪ್ತಿಗಿಂತ ಕಡಿಮೆ. ಕಬ್ಬಿಣ ಭರಿತ ಆಹಾರಗಳು ಆರೋಗ್ಯಕರ ರಕ್ತದ ಮಟ್ಟವನ್ನು ಬೆಂಬಲಿಸುತ್ತವೆ. ಇದು ಶೈಕ್ಷಣಿಕ ಟಿಪ್ಪಣಿ — ಇದು ರಕ್ತಹೀನತೆಯ ರೋಗನಿರ್ಣಯವಲ್ಲ ಮತ್ತು ನಿಮ್ಮ ಆರೈಕೆ ಅಧಿಕಾರಿಯ ಸಲಹೆಗೆ ಬದಲಿಯಲ್ಲ."
    ),
    bullets: [
      L(
        "Include iron-rich foods such as green leafy vegetables, dals and beans, dates, ragi and small amounts of jaggery.",
        "हरी पत्तेदार सब्ज़ियाँ, दालें, बीन्स, खजूर, रागी और थोड़ी सी गुड़ जैसे आयरन युक्त खाद्य पदार्थ शामिल करें।",
        "ಹಸಿರು ಎಲೆ ತರಕಾರಿಗಳು, ಬೇಳೆಗಳು, ಬೀನ್ಸ್, ಖರ್ಜೂರ, ರಾಗಿ ಮತ್ತು ಸ್ವಲ್ಪ ಬೆಲ್ಲದಂತಹ ಕಬ್ಬಿಣ ಭರಿತ ಆಹಾರಗಳನ್ನು ಸೇರಿಸಿ."
      ),
      L(
        "Pair iron-rich foods with vitamin C foods like lemon or amla to help absorption.",
        "आयरन युक्त खाद्य पदार्थों को नींबू या आंवला जैसे विटामिन सी युक्त चीज़ों के साथ लें — इससे अवशोषण में मदद मिलती है।",
        "ಕಬ್ಬಿಣ ಭರಿತ ಆಹಾರಗಳನ್ನು ನಿಂಬೆ ಅಥವಾ ನೆಲ್ಲಿಕಾಯಿಯಂತಹ ವಿಟಮಿನ್ ಸಿ ಆಹಾರಗಳೊಂದಿಗೆ ಸೇವಿಸಿ — ಇದು ಹೀರುವಿಕೆಗೆ ಸಹಾಯ ಮಾಡುತ್ತದೆ."
      ),
      L(
        "Discuss with your care provider whether any supplement is right for you — do not start supplements on your own.",
        "अपने देखभाल प्रदाता से चर्चा करें कि कोई पूरक आपके लिए उपयुक्त है या नहीं — बिना सलाह के पूरक न लें।",
        "ಯಾವುದೇ ಪೂರಕ ನಿಮಗೆ ಸೂಕ್ತವೇ ಎಂದು ಆರೈಕೆ ಅಧಿಕಾರಿಯೊಂದಿಗೆ ಚರ್ಚಿಸಿ — ಸ್ವಯಂ ಬಳಕೆಯಿಂದ ಪೂರಕ ಪ್ರಾರಂಭಿಸಬೇಡಿ."
      ),
    ],
  },
  bp: {
    title: L(
      "Watching salt and blood pressure",
      "नमक और रक्तचाप का ध्यान रखें",
      "ಉಪ್ಪು ಮತ್ತು ರಕ್ತದೊತ್ತಡದ ಬಗ್ಗೆ ಗಮನ"
    ),
    body: L(
      "Your latest recorded blood pressure was {sys}/{dia} mmHg, which is elevated. This is a screening observation, not a diagnosis. Reducing added salt in your meals is generally helpful, and you should get this reviewed by your care provider.",
      "आपका नवीनतम रिकॉर्ड किया गया रक्तचाप {sys}/{dia} mmHg था, जो ऊँचा है। यह एक स्क्रीनिंग टिप्पणी है, निदान नहीं। भोजन में अतिरिक्त नमक कम करना आम तौर पर मददगार है, और इसकी समीक्षा अपने देखभाल प्रदाता से करवाएं।",
      "ನಿಮ್ಮ ಇತ್ತೀಚೆ ದಾಖಲಾದ ರಕ್ತದೊತ್ತಡ {sys}/{dia} mmHg ಆಗಿತ್ತು, ಅದು ಹೆಚ್ಚಿದೆ. ಇದು ಪರೀಕ್ಷಾ ಅವಲೋಕನ, ರೋಗನಿರ್ಣಯವಲ್ಲ. ಊಟದಲ್ಲಿ ಸೇರಿಸುವ ಉಪ್ಪನ್ನು ಕಡಿಮೆ ಮಾಡುವುದು ಸಾಮಾನ್ಯವಾಗಿ ಸಹಾಯಕ, ಮತ್ತು ಇದನ್ನು ನಿಮ್ಮ ಆರೈಕೆ ಅಧಿಕಾರಿಯಿಂದ ಪರಿಶೀಲಿಸಬೇಕು."
    ),
    bullets: [
      L(
        "Limit added salt while cooking and at the table; taste before adding salt.",
        "खाना बनाते समय और मेज़ पर नमक सीमित रखें; नमक डालने से पहले चखें।",
        "ಅಡುಗೆ ಮಾಡುವಾಗ ಮತ್ತು ಊಟದ ಸಮಯದಲ್ಲಿ ಉಪ್ಪನ್ನು ಮಿತಿಗೊಳಿಸಿ; ಉಪ್ಪು ಸೇರಿಸುವ ಮೊದಲು ರುಚಿ ನೋಡಿ."
      ),
      L(
        "Choose fresh foods more often; limit very salty packaged snacks, pickles and papads.",
        "ताज़ा खाद्य पदार्थ अधिक चुनें; बहुत नमकीन पैकेज्ड स्नैक्स, अचार और पापड़ सीमित करें।",
        "ಹೆಚ್ಚಾಗಿ ತಾಜಾ ಆಹಾರ ಆರಿಸಿ; ಅತಿಯಾದ ಉಪ್ಪಿನ ಪ್ಯಾಕೆಟ್ ತಿಂಡಿಗಳು, ಉಪ್ಪಿನಕಾಯಿ ಮತ್ತು ಪಾಪಡ್ಗಳನ್ನು ಮಿತಿಗೊಳಿಸಿ."
      ),
      L(
        "Contact your provider for review, especially with headache, blurred vision or other warning signs.",
        "समीक्षा के लिए अपने प्रदाता से संपर्क करें, खासकर सिरदर्द, धुंधली दृष्टि या अन्य चेतावनी संकेत होने पर।",
        "ಪರಿಶೀಲನೆಗಾಗಿ ನಿಮ್ಮ ಆರೈಕೆ ಅಧಿಕಾರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ, ವಿಶೇಷವಾಗಿ ತಲೆನೋವು, ಮಸುಕು ದೃಷ್ಟಿ ಅಥವಾ ಇತರ ಎಚ್ಚರಿಕೆ ಚಿಹ್ನೆಗಳಿದ್ದರೆ."
      ),
    ],
  },
  glucose: {
    title: L(
      "Elevated glucose reading — discuss with your provider",
      "उच्च ग्लूकोज स्तर — अपने प्रदाता से चर्चा करें",
      "ಹೆಚ್ಚಿನ ಗ್ಲೂಕೋಸ್ ಮೌಲ್ಯ — ನಿಮ್ಮ ಆರೈಕೆ ಅಧಿಕಾರಿಯೊಂದಿಗೆ ಚರ್ಚಿಸಿ"
    ),
    body: L(
      "Your latest recorded glucose reading was {glucose} mg/dL. A single reading is not a diagnosis. Please discuss it with your care provider; they will decide whether any testing or dietary changes are needed.",
      "आपका नवीनतम ग्लूकोज स्तर {glucose} mg/dL था। एक अकेला माप निदान नहीं है। कृपया इस पर अपने देखभाल प्रदाता से चर्चा करें; वे तय करेंगे कि कोई जाँच या आहार परिवर्तन आवश्यक है या नहीं।",
      "ನಿಮ್ಮ ಇತ್ತೀಚೆ ದಾಖಲಾದ ಗ್ಲೂಕೋಸ್ ಮೌಲ್ಯ {glucose} mg/dL. ಒಂದೇ ಅಳತೆ ರೋಗನಿರ್ಣಯವಲ್ಲ. ದಯವಿಟ್ಟು ಇದನ್ನು ನಿಮ್ಮ ಆರೈಕೆ ಅಧಿಕಾರಿಯೊಂದಿಗೆ ಚರ್ಚಿಸಿ; ಯಾವುದೇ ಪರೀಕ್ಷೆ ಅಥವಾ ಆಹಾರ ಬದಲಾವಣೆ ಬೇಕೇ ಎಂಬುದನ್ನು ಅವರು ನಿರ್ಧರಿಸುತ್ತಾರೆ."
    ),
    bullets: [
      L(
        "A single reading by itself does not tell you if you have gestational diabetes.",
        "एक अकेला माप अपने आप में यह नहीं बताता कि आपको गर्भकालीन मधुमेह है।",
        "ಒಂದೇ ಅಳತೆಯಿಂದ ನಿಮಗೆ ಗರ್ಭಾವಧಿ ಮಧುಮೇಹ ಇದೆಯೇ ಎಂದು ತಿಳಿಯುವುದಿಲ್ಲ."
      ),
      L(
        "Keep your regular meals; do not skip meals because of one reading.",
        "अपने नियमित भोजन जारी रखें; एक माप के कारण भोजन न छोड़ें।",
        "ನಿಮ್ಮ ನಿಯಮಿತ ಊಟ ಮುಂದುವರಿಸಿ; ಒಂದು ಅಳತೆಯಿಂದಾಗಿ ಊಟ ಬಿಡಬೇಡಿ."
      ),
      L(
        "Discuss the reading with your care team rather than changing your diet on your own.",
        "अपने आहार बदलने से पहले इस माप पर देखभाल टीम से चर्चा करें।",
        "ಸ್ವಯಂ ಆಹಾರ ಬದಲಾಯಿಸುವ ಬದಲು ಈ ಅಳತೆಯನ್ನು ಆರೈಕೆ ತಂಡದೊಂದಿಗೆ ಚರ್ಚಿಸಿ."
      ),
    ],
  },
};

export const DIET_SYMPTOM: DietStageTemplate = {
  title: L(
    "Take care — talk to your care team before changing your diet",
    "सावधान रहें — आहार बदलने से पहले देखभाल टीम से बात करें",
    "ಕಾಳಜಿ ವಹಿಸಿ — ಆಹಾರ ಬದಲಾಯಿಸುವ ಮೊದಲು ಆರೈಕೆ ತಂಡದೊಂದಿಗೆ ಮಾತನಾಡಿ"
  ),
  body: L(
    "You recently recorded symptoms at {severity} severity. Symptoms alone do not confirm any diagnosis, but this is a good time to contact your care provider. While unwell, avoid making big changes to your diet on your own.",
    "आपने हाल ही में {severity} गंभीरता के लक्षण दर्ज किए। लक्षण अकेले किसी निदान की पुष्टि नहीं करते, लेकिन यह अपने देखभाल प्रदाता से संपर्क करने का अच्छा समय है। अस्वस्थ रहते हुए अपने आहार में बड़े बदलाव स्वयं न करें।",
    "ನೀವು ಇತ್ತೀಚೆಗೆ {severity} ತೀವ್ರತೆಯ ರೋಗಲಕ್ಷಣಗಳನ್ನು ದಾಖಲಿಸಿದ್ದೀರಿ. ರೋಗಲಕ್ಷಣಗಳು ಮಾತ್ರ ಯಾವುದೇ ರೋಗನಿರ್ಣಯವನ್ನು ದೃಢಪಡಿಸುವುದಿಲ್ಲ, ಆದರೆ ಇದು ಆರೈಕೆ ಅಧಿಕಾರಿಯನ್ನು ಸಂಪರ್ಕಿಸಲು ಒಳ್ಳೆಯ ಸಮಯ. ಅನಾರೋಗ್ಯದ ಸಮಯದಲ್ಲಿ ಸ್ವಯಂ ದೊಡ್ಡ ಆಹಾರ ಬದಲಾವಣೆಗಳನ್ನು ಮಾಡಬೇಡಿ."
  ),
  bullets: [
    L(
      "Contact your care provider or follow the guidance they already gave you.",
      "अपने देखभाल प्रदाता से संपर्क करें या उनके पहले दिए गए मार्गदर्शन का पालन करें।",
      "ನಿಮ್ಮ ಆರೈಕೆ ಅಧಿಕಾರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ ಅಥವಾ ಅವರು ಈಗಾಗಲೇ ನೀಡಿದ ಮಾರ್ಗದರ್ಶನವನ್ನು ಅನುಸರಿಸಿ."
    ),
    L(
      "Stay hydrated and eat light, balanced meals as tolerated.",
      "हाइड्रेटेड रहें और सहन होने पर हल्का, संतुलित भोजन करें।",
      "ದ್ರವಾಂಶ ಸಮತೋಲನ ಇಟ್ಟುಕೊಳ್ಳಿ ಮತ್ತು ಸಹಿಸಿಕೊಳ್ಳುವಷ್ಟು ಹಗುರವಾದ, ಸಮತೋಲಿತ ಊಟ ಸೇವಿಸಿ."
    ),
    L(
      "Do not start, stop or change any supplement or medicine without advice.",
      "बिना सलाह के कोई पूरक या दवा शुरू, बंद या बदलें नहीं।",
      "ಸಲಹೆಯಿಲ್ಲದೆ ಯಾವುದೇ ಪೂರಕ ಅಥವಾ ಔಷಧಿಯನ್ನು ಪ್ರಾರಂಭಿಸಬೇಡಿ, ನಿಲ್ಲಿಸಬೇಡಿ ಅಥವಾ ಬದಲಾಯಿಸಬೇಡಿ."
    ),
  ],
};

/* ---- Meal examples (deterministic per preference + region) ---- */

export interface DietMealExamples {
  breakfast: LocalizedText[];
  lunch: LocalizedText[];
  snacks: LocalizedText[];
  dinner: LocalizedText[];
  note: LocalizedText;
}

export const MEAL_SLOT_LABELS: Record<string, LocalizedText> = {
  breakfast: L("Breakfast", "नाश्ता", "ಉಪಹಾರ"),
  lunch: L("Lunch", "दोपहर का भोजन", "ಮಧ್ಯಾಹ್ನದ ಊಟ"),
  snacks: L("Snacks", "नाश्ता (Snacks)", "ತಿಂಡಿಗಳು"),
  dinner: L("Dinner", "रात का भोजन", "ರಾತ್ರಿ ಊಟ"),
};

export const DIET_GUIDANCE_HEADINGS: Record<string, LocalizedText> = {
  guidance: L("Guidance", "मार्गदर्शन", "ಮಾರ್ಗದರ್ಶನ"),
  note: L("A note", "एक सुझाव", "ಟಿಪ್ಪಣಿ"),
  substitutions: L(
    "Easy swaps",
    "आसान बदलाव",
    "ಸುಲಭ ಬದಲಾವಣೆಗಳು"
  ),
  foodSafety: L(
    "Food safety",
    "खाद्य सुरक्षा",
    "ಆಹಾರ ಸುರಕ್ಷತೆ"
  ),
  hydration: L(
    "Drinking water",
    "पानी पीना",
    "ನೀರು ಕುಡಿಯುವುದು"
  ),
};

export const DIET_MEAL_TITLE: Record<DietMealPreference, LocalizedText> = {
  vegetarian: L(
    "Vegetarian meal ideas",
    "शाकाहारी भोजन के विचार",
    "ಸಸ್ಯಾಹಾರಿ ಊಟದ ಆಲೋಚನೆಗಳು"
  ),
  eggitarian: L(
    "Meal ideas with eggs",
    "अंडे सहित भोजन के विचार",
    "ಮೊಟ್ಟೆ ಸೇರಿದ ಊಟದ ಆಲೋಚನೆಗಳು"
  ),
  non_vegetarian: L(
    "Meal ideas with chicken and fish",
    "चिकन और मछली सहित भोजन के विचार",
    "ಚಿಕನ್ ಮತ್ತು ಮೀನು ಸೇರಿದ ಊಟದ ಆಲೋಚನೆಗಳು"
  ),
};

export const DIET_MEAL_EXAMPLES: Record<
  DietMealPreference,
  Record<DietRegion, DietMealExamples>
> = {
  /* ------------------------- vegetarian ------------------------- */
  vegetarian: {
    north: {
      breakfast: [
        L("Whole-wheat parantha with curd and a small fruit", "साबुत गेहूं की पराठा दही और एक छोटे फल के साथ", "ಗೋಧಿ ಪರೋಟಾ ಮೊಸರು ಮತ್ತು ಸಣ್ಣ ಹಣ್ಣಿನೊಂದಿಗೆ"),
        L("Ragi porridge with warm milk and nuts", "दूध और मेवों के साथ रागी दलिया", "ಹಾಲು ಮತ್ತು ಬೀಜಗಳೊಂದಿಗೆ ರಾಗಿ ಗಂಜಿ"),
      ],
      lunch: [
        L("Dal + whole-wheat roti + seasonal vegetable + salad", "दाल + साबुत गेहूं की रोटी + मौसमी सब्ज़ी + सलाद", "ಬೇಳೆ + ಗೋಧಿ ರೊಟ್ಟಿ + ಕಾಲದ ತರಕಾರಿ + ಸಲಾಡ್"),
      ],
      snacks: [
        L("Roasted chana or a fruit, with a glass of milk", "भुना चना या एक फल, दूध के साथ", "ಹುರಿದ ಕಡಲೆ ಅಥವಾ ಒಂದು ಹಣ್ಣು, ಒಂದು ಲೋಟ ಹಾಲಿನೊಂದಿಗೆ"),
      ],
      dinner: [
        L("Khichdi or vegetable pulao with curd", "खिचड़ी या सब्ज़ी पुलाव दही के साथ", "ಖಿಚಡಿ ಅಥವಾ ತರಕಾರಿ ಪಲಾವ್ ಮೊಸರಿನೊಂದಿಗೆ"),
      ],
      note: L(
        "These are sample vegetarian meals for a North-Indian style plate. Adjust portions to your appetite and comfort.",
        "ये उत्तरी भारतीय शैली के नमूना शाकाहारी भोजन हैं। भूख और आराम के अनुसार मात्रा समायोजित करें।",
        "ಇವು ಉತ್ತರ ಭಾರತೀಯ ಶೈಲಿಯ ಮಾದರಿ ಸಸ್ಯಾಹಾರಿ ಊಟಗಳು. ಹಸಿವು ಮತ್ತು ಆರಾಮಕ್ಕೆ ಅನುಗುಣವಾಗಿ ಪ್ರಮಾಣವನ್ನು ಸರಿಹೊಂದಿಸಿ."
      ),
    },
    south: {
      breakfast: [
        L("Idli or dosa with sambar and a small vegetable side", "सांभर और हल्की सब्ज़ी के साथ इडली या डोसा", "ಸಾಂಬಾರ್ ಮತ್ತು ಸಣ್ಣ ತರಕಾರಿ ಜೊತೆ ಇಡ್ಲಿ ಅಥವಾ ದೋಸೆ"),
        L("Ragi malt (koozh style) with milk or curd", "दूध या दही के साथ रागी माल्ट", "ಹಾಲು ಅಥವಾ ಮೊಸರಿನೊಂದಿಗೆ ರಾಗಿ ಮಾಲ್ಟ್"),
      ],
      lunch: [
        L("Steamed rice + sambar + greens (palya) + curd", "स्टीम्ड चावल + सांभर + साग (पाल्या) + दही", "ಆವಿದ ಅನ್ನ + ಸಾಂಬಾರ್ + ಸೊಪ್ಪು ಪಲ್ಯ + ಮೊಸರು"),
      ],
      snacks: [
        L("Curd rice or a fruit between meals", "भोजन के बीच दही चावल या एक फल", "ಊಟದ ಮಧ್ಯೆ ಮೊಸರು ಅನ್ನ ಅಥವಾ ಒಂದು ಹಣ್ಣು"),
      ],
      dinner: [
        L("Uppittu (upma) or vegetable rice with curd", "उपमा या सब्ज़ी चावल दही के साथ", "ಉಪ್ಪಿಟ್ಟು ಅಥವಾ ತರಕಾರಿ ಅನ್ನ ಮೊಸರಿನೊಂದಿಗೆ"),
      ],
      note: L(
        "These are sample vegetarian meals for a South-Indian style plate. Adjust portions to your appetite and comfort.",
        "ये दक्षिण भारतीय शैली के नमूना शाकाहारी भोजन हैं। भूख और आराम के अनुसार मात्रा समायोजित करें।",
        "ಇವು ದಕ್ಷಿಣ ಭಾರತೀಯ ಶೈಲಿಯ ಮಾದರಿ ಸಸ್ಯಾಹಾರಿ ಊಟಗಳು. ಹಸಿವು ಮತ್ತು ಆರಾಮಕ್ಕೆ ಅನುಗುಣವಾಗಿ ಪ್ರಮಾಣ ಸರಿಹೊಂದಿಸಿ."
      ),
    },
    east: {
      breakfast: [
        L("Soft rice or luchi with a vegetable (torkari) side", "हल्के चावल या लुची सब्ज़ी (तरकारी) के साथ", "ಮೃದು ಅನ್ನ ಅಥವಾ ಲೂಚಿ ತರಕಾರಿ (ಟಾರ್ಕರಿ) ಜೊತೆ"),
        L("Seasonal fruit with a glass of milk", "दूध के साथ मौसमी फल", "ಹಾಲಿನೊಂದಿಗೆ ಕಾಲದ ಹಣ್ಣು"),
      ],
      lunch: [
        L("Rice + dal + a seasonal vegetable + greens", "चावल + दाल + मौसमी सब्ज़ी + साग", "ಅನ್ನ + ಬೇಳೆ + ಕಾಲದ ತರಕಾರಿ + ಸೊಪ್ಪು"),
      ],
      snacks: [
        L("Roasted murmura (puffed rice) with peanuts or a fruit", "मूँगफली के साथ मुरमुरा या एक फल", "ಕಡಲೆಕಾಯಿಯೊಂದಿಗೆ ಮುರಮುರಾ ಅಥವಾ ಒಂದು ಹಣ್ಣು"),
      ],
      dinner: [
        L("Rice with dal and a light vegetable, or khichdi", "दाल और हल्की सब्ज़ी के साथ चावल, या खिचड़ी", "ಬೇಳೆ ಮತ್ತು ಹಗುರ ತರಕಾರಿಯೊಂದಿಗೆ ಅನ್ನ, ಅಥವಾ ಖಿಚಡಿ"),
      ],
      note: L(
        "These are sample vegetarian meals for an East-Indian style plate. Adjust portions to your appetite and comfort.",
        "ये पूर्वी भारतीय शैली के नमूना शाकाहारी भोजन हैं। भूख और आराम के अनुसार मात्रा समायोजित करें।",
        "ಇವು ಪೂರ್ವ ಭಾರತೀಯ ಶೈಲಿಯ ಮಾದರಿ ಸಸ್ಯಾಹಾರಿ ಊಟಗಳು. ಹಸಿವು ಮತ್ತು ಆರಾಮಕ್ಕೆ ಅನುಗುಣವಾಗಿ ಪ್ರಮಾಣ ಸರಿಹೊಂದಿಸಿ."
      ),
    },
    west: {
      breakfast: [
        L("Bajra or jowar roti with curd and a small fruit", "दही और एक छोटे फल के साथ बाजरे या ज्वार की रोटी", "ಮೊಸರು ಮತ್ತು ಸಣ್ಣ ಹಣ್ಣಿನೊಂದಿಗೆ ಸಜ್ಜೆ ಅಥವಾ ಜೋಳದ ರೊಟ್ಟಿ"),
        L("Vegetable thepla with curd", "दही के साथ सब्ज़ी थेपला", "ಮೊಸರಿನೊಂದಿಗೆ ತರಕಾರಿ ಥೇಪ್ಲಾ"),
      ],
      lunch: [
        L("Roti + dal + seasonal vegetable + salad", "रोटी + दाल + मौसमी सब्ज़ी + सलाद", "ರೊಟ್ಟಿ + ಬೇಳೆ + ಕಾಲದ ತರಕಾರಿ + ಸಲಾಡ್"),
      ],
      snacks: [
        L("Sprouts or roasted peanuts, with water", "अंकुरित अनाज या भुनी मूँगफली, पानी के साथ", "ಮೊಳಕೆ ಕಾಳುಗಳು ಅಥವಾ ಹುರಿದ ಕಡಲೆಕಾಯಿ, ನೀರಿನೊಂದಿಗೆ"),
      ],
      dinner: [
        L("Dal khichdi or vegetable bhakri with curd", "दाल खिचड़ी या सब्ज़ी भाकरी दही के साथ", "ಬೇಳೆ ಖಿಚಡಿ ಅಥವಾ ತರಕಾರಿ ಭಕರಿ ಮೊಸರಿನೊಂದಿಗೆ"),
      ],
      note: L(
        "These are sample vegetarian meals for a West-Indian style plate. Adjust portions to your appetite and comfort.",
        "ये पश्चिम भारतीय शैली के नमूना शाकाहारी भोजन हैं। भूख और आराम के अनुसार मात्रा समायोजित करें।",
        "ಇವು ಪಶ್ಚಿಮ ಭಾರತೀಯ ಶೈಲಿಯ ಮಾದರಿ ಸಸ್ಯಾಹಾರಿ ಊಟಗಳು. ಹಸಿವು ಮತ್ತು ಆರಾಮಕ್ಕೆ ಅನುಗುಣವಾಗಿ ಪ್ರಮಾಣ ಸರಿಹೊಂದಿಸಿ."
      ),
    },
    other: {
      breakfast: [
        L("Whole-grain porridge or upma with a glass of milk", "दूध के साथ साबुत अनाज दलिया या उपमा", "ಹಾಲಿನೊಂದಿಗೆ ಧಾನ್ಯ ಗಂಜಿ ಅಥವಾ ಉಪ್ಪಿಟ್ಟು"),
        L("Roti or idli with a vegetable side and a fruit", "सब्ज़ी और एक फल के साथ रोटी या इडली", "ತರಕಾರಿ ಮತ್ತು ಒಂದು ಹಣ್ಣಿನೊಂದಿಗೆ ರೊಟ್ಟಿ ಅಥವಾ ಇಡ್ಲಿ"),
      ],
      lunch: [
        L("A whole grain + dal or curd + vegetables + salad", "साबुत अनाज + दाल या दही + सब्ज़ियाँ + सलाद", "ಧಾನ್ಯ + ಬೇಳೆ ಅಥವಾ ಮೊಸರು + ತರಕಾರಿಗಳು + ಸಲಾಡ್"),
      ],
      snacks: [
        L("A fruit, curd or roasted chana between meals", "भोजन के बीच एक फल, दही या भुना चना", "ಊಟದ ಮಧ್ಯೆ ಒಂದು ಹಣ್ಣು, ಮೊಸರು ಅಥವಾ ಹುರಿದ ಕಡಲೆ"),
      ],
      dinner: [
        L("Vegetable khichdi or rice with dal and a gravy vegetable", "सब्ज़ी खिचड़ी या दाल और सब्ज़ी के साथ चावल", "ತರಕಾರಿ ಖಿಚಡಿ ಅಥವಾ ಬೇಳೆ ಮತ್ತು ತರಕಾರಿ ಸಾರಿನೊಂದಿಗೆ ಅನ್ನ"),
      ],
      note: L(
        "These are broadly suitable vegetarian meal ideas that work across India. Adjust portions to your appetite and comfort.",
        "ये भारत भर में काम करने वाले सामान्य शाकाहारी भोजन के विचार हैं। भूख और आराम के अनुसार मात्रा समायोजित करें।",
        "ಇವು ಇಡೀ ಭಾರತಕ್ಕೆ ಸೂಕ್ತವಾದ ಸಾಮಾನ್ಯ ಸಸ್ಯಾಹಾರಿ ಊಟದ ಆಲೋಚನೆಗಳು. ಹಸಿವು ಮತ್ತು ಆರಾಮಕ್ಕೆ ಅನುಗುಣವಾಗಿ ಪ್ರಮಾಣ ಸರಿಹೊಂದಿಸಿ."
      ),
    },
  },
  /* ------------------------- eggitarian ------------------------- */
  eggitarian: {
    north: {
      breakfast: [
        L("Boiled egg with whole-wheat roti and curd", "साबुत गेहूं की रोटी और दही के साथ उबला अंडा", "ಗೋಧಿ ರೊಟ್ಟಿ ಮತ್ತು ಮೊಸರಿನೊಂದಿಗೆ ಬೇಯಿಸಿದ ಮೊಟ್ಟೆ"),
        L("Ragi porridge with milk and an egg", "दूध और एक अंडे के साथ रागी दलिया", "ಹಾಲು ಮತ್ತು ಮೊಟ್ಟೆಯೊಂದಿಗೆ ರಾಗಿ ಗಂಜಿ"),
      ],
      lunch: [
        L("Egg curry + whole-wheat roti + seasonal vegetable", "अंडा करी + साबुत गेहूं की रोटी + मौसमी सब्ज़ी", "ಮೊಟ್ಟೆ ಕರಿ + ಗೋಧಿ ರೊಟ್ಟಿ + ಕಾಲದ ತರಕಾರಿ"),
      ],
      snacks: [
        L("A fruit or half an egg sandwich between meals", "भोजन के बीच एक फल या अंडा सैंडविच", "ಊಟದ ಮಧ್ಯೆ ಒಂದು ಹಣ್ಣು ಅಥವಾ ಮೊಟ್ಟೆ ಸ್ಯಾಂಡ್ವಿಚ್"),
      ],
      dinner: [
        L("Egg bhurji with vegetables and a roti or rice", "सब्ज़ियों और रोटी या चावल के साथ अंडा भुर्जी", "ತರಕಾರಿಗಳೊಂದಿಗೆ ಮೊಟ್ಟೆ ಭುರ್ಜಿ ಮತ್ತು ರೊಟ್ಟಿ ಅಥವಾ ಅನ್ನ"),
      ],
      note: L(
        "These are sample egg-including meals for a North-Indian style plate. Prepare eggs fully cooked.",
        "ये उत्तरी भारतीय शैली के नमूना अंडे वाले भोजन हैं। अंडे पूरी तरह पकाकर खाएं।",
        "ಇವು ಉತ್ತರ ಭಾರತೀಯ ಶೈಲಿಯ ಮಾದರಿ ಮೊಟ್ಟೆ ಸೇರಿದ ಊಟಗಳು. ಮೊಟ್ಟೆಗಳನ್ನು ಚೆನ್ನಾಗಿ ಬೇಯಿಸಿ ಸೇವಿಸಿ."
      ),
    },
    south: {
      breakfast: [
        L("Idli or dosa with sambar and a boiled egg", "सांभर और एक उबले अंडे के साथ इडली या डोसा", "ಸಾಂಬಾರ್ ಮತ್ತು ಬೇಯಿಸಿದ ಮೊಟ್ಟೆಯೊಂದಿಗೆ ಇಡ್ಲಿ ಅಥವಾ ದೋಸೆ"),
      ],
      lunch: [
        L("Rice + sambar + greens + a boiled egg", "चावल + सांभर + साग + एक उबला अंडा", "ಅನ್ನ + ಸಾಂಬಾರ್ + ಸೊಪ್ಪು + ಬೇಯಿಸಿದ ಮೊಟ್ಟೆ"),
      ],
      snacks: [
        L("Fruit or curd with a little hard-boiled egg", "एक फल या दही थोड़े उबले अंडे के साथ", "ಒಂದು ಹಣ್ಣು ಅಥವಾ ಮೊಸರು ಸ್ವಲ್ಪ ಬೇಯಿಸಿದ ಮೊಟ್ಟೆಯೊಂದಿಗೆ"),
      ],
      dinner: [
        L("Vegetable rice with egg curry or an egg omelette", "अंडा करी या अंडा ऑमलेट के साथ सब्ज़ी चावल", "ಮೊಟ್ಟೆ ಕರಿ ಅಥವಾ ಮೊಟ್ಟೆ ಆಮ್ಲೆಟ್ ಜೊತೆ ತರಕಾರಿ ಅನ್ನ"),
      ],
      note: L(
        "These are sample egg-including meals for a South-Indian style plate. Prepare eggs fully cooked.",
        "ये दक्षिण भारतीय शैली के नमूना अंडे वाले भोजन हैं। अंडे पूरी तरह पकाकर खाएं।",
        "ಇವು ದಕ್ಷಿಣ ಭಾರತೀಯ ಶೈಲಿಯ ಮಾದರಿ ಮೊಟ್ಟೆ ಸೇರಿದ ಊಟಗಳು. ಮೊಟ್ಟೆಗಳನ್ನು ಚೆನ್ನಾಗಿ ಬೇಯಿಸಿ ಸೇವಿಸಿ."
      ),
    },
    east: {
      breakfast: [
        L("Boiled egg with soft rice and a vegetable side", "हल्के चावल और सब्ज़ी के साथ उबला अंडा", "ಮೃದು ಅನ್ನ ಮತ್ತು ತರಕಾರಿಯೊಂದಿಗೆ ಬೇಯಿಸಿದ ಮೊಟ್ಟೆ"),
      ],
      lunch: [
        L("Rice + dal + greens + a boiled egg or egg curry", "चावल + दाल + साग + एक उबला अंडा या अंडा करी", "ಅನ್ನ + ಬೇಳೆ + ಸೊಪ್ಪು + ಬೇಯಿಸಿದ ಮೊಟ್ಟೆ ಅಥವಾ ಮೊಟ್ಟೆ ಕರಿ"),
      ],
      snacks: [
        L("A fruit or roasted chana between meals", "भोजन के बीच एक फल या भुना चना", "ಊಟದ ಮಧ್ಯೆ ಒಂದು ಹಣ್ಣು ಅಥವಾ ಹುರಿದ ಕಡಲೆ"),
      ],
      dinner: [
        L("Egg curry with rice and a light vegetable", "चावल और हल्की सब्ज़ी के साथ अंडा करी", "ಅನ್ನ ಮತ್ತು ಹಗುರ ತರಕಾರಿಯೊಂದಿಗೆ ಮೊಟ್ಟೆ ಕರಿ"),
      ],
      note: L(
        "These are sample egg-including meals for an East-Indian style plate. Prepare eggs fully cooked.",
        "ये पूर्वी भारतीय शैली के नमूना अंडे वाले भोजन हैं। अंडे पूरी तरह पकाकर खाएं।",
        "ಇವು ಪೂರ್ವ ಭಾರತೀಯ ಶೈಲಿಯ ಮಾದರಿ ಮೊಟ್ಟೆ ಸೇರಿದ ಊಟಗಳು. ಮೊಟ್ಟೆಗಳನ್ನು ಚೆನ್ನಾಗಿ ಬೇಯಿಸಿ ಸೇವಿಸಿ."
      ),
    },
    west: {
      breakfast: [
        L("Boiled egg with bajra roti and curd", "दही के साथ बाजरे की रोटी और उबला अंडा", "ಮೊಸರಿನೊಂದಿಗೆ ಸಜ್ಜೆ ರೊಟ್ಟಿ ಮತ್ತು ಬೇಯಿಸಿದ ಮೊಟ್ಟೆ"),
      ],
      lunch: [
        L("Roti + dal + vegetables + a boiled egg", "रोटी + दाल + सब्ज़ियाँ + एक उबला अंडा", "ರೊಟ್ಟಿ + ಬೇಳೆ + ತರಕಾರಿಗಳು + ಬೇಯಿಸಿದ ಮೊಟ್ಟೆ"),
      ],
      snacks: [
        L("A fruit or egg-and-vegetable thepla between meals", "भोजन के बीच एक फल या अंडा-सब्ज़ी थेपला", "ಊಟದ ಮಧ್ಯೆ ಒಂದು ಹಣ್ಣು ಅಥವಾ ಮೊಟ್ಟೆ-ತರಕಾರಿ ಥೇಪ್ಲಾ"),
      ],
      dinner: [
        L("Egg bhurji or egg curry with a roti", "रोटी के साथ अंडा भुर्जी या अंडा करी", "ರೊಟ್ಟಿಯೊಂದಿಗೆ ಮೊಟ್ಟೆ ಭುರ್ಜಿ ಅಥವಾ ಮೊಟ್ಟೆ ಕರಿ"),
      ],
      note: L(
        "These are sample egg-including meals for a West-Indian style plate. Prepare eggs fully cooked.",
        "ये पश्चिम भारतीय शैली के नमूना अंडे वाले भोजन हैं। अंडे पूरी तरह पकाकर खाएं।",
        "ಇವು ಪಶ್ಚಿಮ ಭಾರತೀಯ ಶೈಲಿಯ ಮಾದರಿ ಮೊಟ್ಟೆ ಸೇರಿದ ಊಟಗಳು. ಮೊಟ್ಟೆಗಳನ್ನು ಚೆನ್ನಾಗಿ ಬೇಯಿಸಿ ಸೇವಿಸಿ."
      ),
    },
    other: {
      breakfast: [
        L("Whole-grain porridge or upma with a boiled egg", "साबुत अनाज दलिया या उपमा एक उबले अंडे के साथ", "ಧಾನ್ಯ ಗಂಜಿ ಅಥವಾ ಉಪ್ಪಿಟ್ಟು ಬೇಯಿಸಿದ ಮೊಟ್ಟೆಯೊಂದಿಗೆ"),
      ],
      lunch: [
        L("A whole grain + dal or egg + vegetables + salad", "साबुत अनाज + दाल या अंडा + सब्ज़ियाँ + सलाद", "ಧಾನ್ಯ + ಬೇಳೆ ಅಥವಾ ಮೊಟ್ಟೆ + ತರಕಾರಿಗಳು + ಸಲಾಡ್"),
      ],
      snacks: [
        L("A fruit, curd or roasted chana between meals", "भोजन के बीच एक फल, दही या भुना चना", "ಊಟದ ಮಧ್ಯೆ ಒಂದು ಹಣ್ಣು, ಮೊಸರು ಅಥವಾ ಹುರಿದ ಕಡಲೆ"),
      ],
      dinner: [
        L("Dal with rice and an egg curry or omelette", "चावल और अंडा करी या ऑमलेट के साथ दाल", "ಅನ್ನ ಮತ್ತು ಮೊಟ್ಟೆ ಕರಿ ಅಥವಾ ಆಮ್ಲೆಟ್ ಜೊತೆ ಬೇಳೆ"),
      ],
      note: L(
        "These are broadly suitable egg-including meal ideas that work across India. Prepare eggs fully cooked.",
        "ये भारत भर में काम करने वाले सामान्य अंडे वाले भोजन के विचार हैं। अंडे पूरी तरह पकाकर खाएं।",
        "ಇವು ಇಡೀ ಭಾರತಕ್ಕೆ ಸೂಕ್ತವಾದ ಮೊಟ್ಟೆ ಸೇರಿದ ಊಟದ ಆಲೋಚನೆಗಳು. ಮೊಟ್ಟೆಗಳನ್ನು ಚೆನ್ನಾಗಿ ಬೇಯಿಸಿ ಸೇವಿಸಿ."
      ),
    },
  },
  /* ---------------------- non_vegetarian ----------------------- */
  non_vegetarian: {
    north: {
      breakfast: [
        L("Whole-wheat parantha or roti with curd and a fruit", "दही और एक फल के साथ साबुत गेहूं की पराठा या रोटी", "ಮೊಸರು ಮತ್ತು ಹಣ್ಣಿನೊಂದಿಗೆ ಗೋಧಿ ಪರೋಟಾ ಅಥವಾ ರೊಟ್ಟಿ"),
      ],
      lunch: [
        L("Chicken or fish curry + whole-wheat roti + vegetable + salad", "चिकन या मछली करी + साबुत गेहूं की रोटी + सब्ज़ी + सलाद", "ಚಿಕನ್ ಅಥವಾ ಮೀನು ಕರಿ + ಗೋಧಿ ರೊಟ್ಟಿ + ತರಕಾರಿ + ಸಲಾಡ್"),
      ],
      snacks: [
        L("A fruit, roasted chana or a glass of milk between meals", "भोजन के बीच एक फल, भुना चना या एक गिलास दूध", "ಊಟದ ಮಧ್ಯೆ ಒಂದು ಹಣ್ಣು, ಹುರಿದ ಕಡಲೆ ಅಥವಾ ಒಂದು ಲೋಟ ಹಾಲು"),
      ],
      dinner: [
        L("Vegetable rice or khichdi with a small portion of fish", "थोड़ी मछली के साथ सब्ज़ी चावल या खिचड़ी", "ಸ್ವಲ್ಪ ಮೀನಿನೊಂದಿಗೆ ತರಕಾರಿ ಅನ್ನ ಅಥವಾ ಖಿಚಡಿ"),
      ],
      note: L(
        "These are sample meals for a North-Indian non-vegetarian plate. Choose fresh, fully cooked chicken or fish.",
        "ये उत्तरी भारतीय शैली के नमूना मांसाहारी भोजन हैं। ताज़ा, पूरी तरह पका हुआ चिकन या मछली चुनें।",
        "ಇವು ಉತ್ತರ ಭಾರತೀಯ ಶೈಲಿಯ ಮಾದರಿ ಮಾಂಸಾಹಾರಿ ಊಟಗಳು. ತಾಜಾ, ಚೆನ್ನಾಗಿ ಬೇಯಿಸಿದ ಚಿಕನ್ ಅಥವಾ ಮೀನನ್ನು ಆರಿಸಿ."
      ),
    },
    south: {
      breakfast: [
        L("Idli or dosa with sambar", "सांभर के साथ इडली या डोसा", "ಸಾಂಬಾರ್ ಜೊತೆ ಇಡ್ಲಿ ಅಥವಾ ದೋಸೆ"),
      ],
      lunch: [
        L("Fish curry + steamed rice + greens", "मछली करी + स्टीम्ड चावल + साग", "ಮೀನು ಕರಿ + ಆವಿದ ಅನ್ನ + ಸೊಪ್ಪು"),
      ],
      snacks: [
        L("A fruit or curd between meals", "भोजन के बीच एक फल या दही", "ಊಟದ ಮಧ್ಯೆ ಒಂದು ಹಣ್ಣು ಅಥವಾ ಮೊಸರು"),
      ],
      dinner: [
        L("Vegetable rice with a small portion of chicken or fish", "थोड़े चिकन या मछली के साथ सब्ज़ी चावल", "ಸ್ವಲ್ಪ ಚಿಕನ್ ಅಥವಾ ಮೀನಿನೊಂದಿಗೆ ತರಕಾರಿ ಅನ್ನ"),
      ],
      note: L(
        "These are sample meals for a South-Indian non-vegetarian plate. Choose fresh, fully cooked chicken or fish.",
        "ये दक्षिण भारतीय शैली के नमूना मांसाहारी भोजन हैं। ताज़ा, पूरी तरह पका हुआ चिकन या मछली चुनें।",
        "ಇವು ದಕ್ಷಿಣ ಭಾರತೀಯ ಶೈಲಿಯ ಮಾದರಿ ಮಾಂಸಾಹಾರಿ ಊಟಗಳು. ತಾಜಾ, ಚೆನ್ನಾಗಿ ಬೇಯಿಸಿದ ಚಿಕನ್ ಅಥವಾ ಮೀನನ್ನು ಆರಿಸಿ."
      ),
    },
    east: {
      breakfast: [
        L("Soft rice or luchi with a vegetable side", "सब्ज़ी के साथ हल्के चावल या लुची", "ತರಕಾರಿಯೊಂದಿಗೆ ಮೃದು ಅನ್ನ ಅಥವಾ ಲೂಚಿ"),
      ],
      lunch: [
        L("Rice + fish curry + greens", "चावल + मछली करी + साग", "ಅನ್ನ + ಮೀನು ಕರಿ + ಸೊಪ್ಪು"),
      ],
      snacks: [
        L("A fruit or roasted chana between meals", "भोजन के बीच एक फल या भुना चना", "ಊಟದ ಮಧ್ಯೆ ಒಂದು ಹಣ್ಣು ಅಥವಾ ಹುರಿದ ಕಡಲೆ"),
      ],
      dinner: [
        L("Rice with dal and a light fish or chicken dish", "दाल और हल्की मछली या चिकन डिश के साथ चावल", "ಬೇಳೆ ಮತ್ತು ಹಗುರ ಮೀನು ಅಥವಾ ಚಿಕನ್ ಖಾದ್ಯದೊಂದಿಗೆ ಅನ್ನ"),
      ],
      note: L(
        "These are sample meals for an East-Indian non-vegetarian plate. Choose fresh, fully cooked fish or chicken.",
        "ये पूर्वी भारतीय शैली के नमूना मांसाहारी भोजन हैं। ताज़ा, पूरी तरह पकी हुई मछली या चिकन चुनें।",
        "ಇವು ಪೂರ್ವ ಭಾರತೀಯ ಶೈಲಿಯ ಮಾದರಿ ಮಾಂಸಾಹಾರಿ ಊಟಗಳು. ತಾಜಾ, ಚೆನ್ನಾಗಿ ಬೇಯಿಸಿದ ಮೀನು ಅಥವಾ ಚಿಕನ್ ಆರಿಸಿ."
      ),
    },
    west: {
      breakfast: [
        L("Bajra or jowar roti with curd and a fruit", "दही और एक फल के साथ बाजरे या ज्वार की रोटी", "ಮೊಸರು ಮತ್ತು ಹಣ್ಣಿನೊಂದಿಗೆ ಸಜ್ಜೆ ಅಥವಾ ಜೋಳದ ರೊಟ್ಟಿ"),
      ],
      lunch: [
        L("Fish or chicken curry + roti + vegetables", "मछली या चिकन करी + रोटी + सब्ज़ियाँ", "ಮೀನು ಅಥವಾ ಚಿಕನ್ ಕರಿ + ರೊಟ್ಟಿ + ತರಕಾರಿಗಳು"),
      ],
      snacks: [
        L("A fruit or sprouts between meals", "भोजन के बीच एक फल या अंकुरित अनाज", "ಊಟದ ಮಧ್ಯೆ ಒಂದು ಹಣ್ಣು ಅಥವಾ ಮೊಳಕೆ ಕಾಳುಗಳು"),
      ],
      dinner: [
        L("Vegetable khichdi with a small portion of fish", "थोड़ी मछली के साथ सब्ज़ी खिचड़ी", "ಸ್ವಲ್ಪ ಮೀನಿನೊಂದಿಗೆ ತರಕಾರಿ ಖಿಚಡಿ"),
      ],
      note: L(
        "These are sample meals for a West-Indian non-vegetarian plate. Choose fresh, fully cooked fish or chicken.",
        "ये पश्चिम भारतीय शैली के नमूना मांसाहारी भोजन हैं। ताज़ा, पूरी तरह पकी मछली या चिकन चुनें।",
        "ಇವು ಪಶ್ಚಿಮ ಭಾರತೀಯ ಶೈಲಿಯ ಮಾದರಿ ಮಾಂಸಾಹಾರಿ ಊಟಗಳು. ತಾಜಾ, ಚೆನ್ನಾಗಿ ಬೇಯಿಸಿದ ಮೀನು ಅಥವಾ ಚಿಕನ್ ಆರಿಸಿ."
      ),
    },
    other: {
      breakfast: [
        L("Whole-grain porridge or upma", "साबुत अनाज दलिया या उपमा", "ಧಾನ್ಯ ಗಂಜಿ ಅಥವಾ ಉಪ್ಪಿಟ್ಟು"),
      ],
      lunch: [
        L("A whole grain + fish or chicken + vegetables + salad", "साबुत अनाज + मछली या चिकन + सब्ज़ियाँ + सलाद", "ಧಾನ್ಯ + ಮೀನು ಅಥವಾ ಚಿಕನ್ + ತರಕಾರಿಗಳು + ಸಲಾಡ್"),
      ],
      snacks: [
        L("A fruit, curd or roasted chana between meals", "भोजन के बीच एक फल, दही या भुना चना", "ಊಟದ ಮಧ್ಯೆ ಒಂದು ಹಣ್ಣು, ಮೊಸರು ಅಥವಾ ಹುರಿದ ಕಡಲೆ"),
      ],
      dinner: [
        L("Dal with rice and a small portion of chicken or fish", "थोड़े चिकन या मछली के साथ दाल चावल", "ಸ್ವಲ್ಪ ಚಿಕನ್ ಅಥವಾ ಮೀನಿನೊಂದಿಗೆ ಬೇಳೆ ಅನ್ನ"),
      ],
      note: L(
        "These are broadly suitable meal ideas that work across India. Choose fresh, fully cooked fish or chicken.",
        "ये भारत भर में काम करने वाले सामान्य भोजन के विचार हैं। ताज़ा, पूरी तरह पका हुआ चिकन या मछली चुनें।",
        "ಇವು ಇಡೀ ಭಾರತಕ್ಕೆ ಸೂಕ್ತವಾದ ಸಾಮಾನ್ಯ ಊಟದ ಆಲೋಚನೆಗಳು. ತಾಜಾ, ಚೆನ್ನಾಗಿ ಬೇಯಿಸಿದ ಮೀನು ಅಥವಾ ಚಿಕನ್ ಆರಿಸಿ."
      ),
    },
  },
};

/* ---- Localized "why shown" source phrases for the rationale ---- */

const DIET_RATIONALE_SOURCES: Record<string, LocalizedText> = {
  stage: L(
    "your pregnancy profile (trimester {trimester})",
    "आपका गर्भावस्था प्रोफ़ाइल (त्रैमासिक {trimester})",
    "ನಿಮ್ಮ ಗರ್ಭಧಾರಣೆ ಪ್ರೊಫೈಲ್ (ತ್ರೈಮಾಸಿಕ {trimester})"
  ),
  "stage-missing": L(
    "your pregnancy profile has not been set up yet",
    "आपका गर्भावस्था प्रोफ़ाइल अभी नहीं बना है",
    "ನಿಮ್ಮ ಗರ್ಭಧಾರಣೆ ಪ್ರೊಫೈಲ್ ಇನ್ನೂ ಸಿದ್ಧವಾಗಿಲ್ಲ"
  ),
  highRiskProfile: L(
    "your pregnancy profile (flagged high risk)",
    "आपका गर्भावस्था प्रोफ़ाइल (उच्च जोखिम अंकित)",
    "ನಿಮ್ಮ ಗರ್ಭಧಾರಣೆ ಪ್ರೊಫೈಲ್ (ಹೆಚ್ಚಿನ ಅಪಾಯ ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ)"
  ),
  highRiskMaternal: L(
    "your completed maternal risk assessment{model}",
    "आपका पूर्ण मातृ जोखिम मूल्यांकन{model}",
    "ನಿಮ್ಮ ಪೂರ್ಣಗೊಂಡ ತಾಯಿಯ ಅಪಾಯ ಮೌಲ್ಯಮಾಪನ{model}"
  ),
  gdm: L(
    "your completed GDM screening{model}",
    "आपकी पूर्ण जीडीएम स्क्रीनिंग{model}",
    "ನಿಮ್ಮ ಪೂರ್ಣಗೊಂಡ GDM ಪರೀಕ್ಷೆ{model}"
  ),
  hemoglobin: L(
    "your latest recorded hemoglobin of {hemoglobin} g/dL",
    "आपका नवीनतम रिकॉर्ड किया गया हीमोग्लोबिन {hemoglobin} g/dL",
    "ನಿಮ್ಮ ಇತ್ತೀಚೆ ದಾಖಲಾದ ಹಿಮೋಗ್ಲೋಬಿನ್ {hemoglobin} g/dL"
  ),
  bp: L(
    "your latest recorded blood pressure of {sys}/{dia} mmHg",
    "आपका नवीनतम रिकॉर्ड किया गया रक्तचाप {sys}/{dia} mmHg",
    "ನಿಮ್ಮ ಇತ್ತೀಚೆ ದಾಖಲಾದ ರಕ್ತದೊತ್ತಡ {sys}/{dia} mmHg"
  ),
  glucose: L(
    "your latest recorded glucose of {glucose} mg/dL",
    "आपका नवीनतम रिकॉर्ड किया गया ग्लूकोज {glucose} mg/dL",
    "ನಿಮ್ಮ ಇತ್ತೀಚೆ ದಾಖಲಾದ ಗ್ಲೂಕೋಸ್ {glucose} mg/dL"
  ),
  symptom: L(
    "your latest symptom record ({severity} severity)",
    "आपका नवीनतम लक्षण रिकॉर्ड ({severity} गंभीरता)",
    "ನಿಮ್ಮ ಇತ್ತೀಚಿನ ರೋಗಲಕ್ಷಣ ದಾಖಲೆ ({severity} ತೀವ್ರತೆ)"
  ),
meals: L(
    "your diet preferences ({preference}{region})",
    "आपकी आहार प्राथमिकताएँ ({preference}{region})",
    "ನಿಮ್ಮ ಆಹಾರ ಆದ್ಯತೆಗಳು ({preference}{region})"
  ),
  "meals-default": L(
    "your diet preferences are not set yet — showing a general starting set of meal ideas",
    "आपकी आहार प्राथमिकताएँ अभी निर्धारित नहीं हैं — सामान्य शुरुआती भोजन विचार दिखाए जा रहे हैं",
    "ನಿಮ್ಮ ಆಹಾರ ಆದ್ಯತೆಗಳನ್ನು ಇನ್ನೂ ಹೊಂದಿಸಿಲ್ಲ — ಸಾಮಾನ್ಯ ಆರಂಭಿಕ ಊಟದ ಆಲೋಚನೆಗಳನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ"
  ),
};

const DIET_REASON_FRAMING: Record<string, LocalizedText> = {
  data: L("Based on {source}.", "{source} के आधार पर।", "{source} ಆಧರಿಸಿ."),
  risk: L(
    "Generated from {source}, recorded as {level} risk.",
    "{source} से तैयार किया गया, जिसमें {level} जोखिम दर्ज हुआ।",
    "{source} ಇಂದ ರಚಿಸಲಾಗಿದೆ, ಅದರಲ್ಲಿ {level} ಅಪಾಯ ದಾಖಲಾಗಿದೆ."
  ),
  severity: L(
    "Generated from {source}, recorded as {level} severity.",
    "{source} से तैयार किया गया, जिसमें {level} गंभीरता दर्ज हुई।",
    "{source} ಇಂದ ರಚಿಸಲಾಗಿದೆ, ಅದರಲ್ಲಿ {level} ತೀವ್ರತೆ ದಾಖಲಾಗಿದೆ."
  ),
};

export type DietReasonSourceKey =
  | "stage"
  | "stage-missing"
  | "highRiskProfile"
  | "highRiskMaternal"
  | "gdm"
  | "hemoglobin"
  | "bp"
  | "glucose"
  | "symptom"
  | "meals"
  | "meals-default";

/** Fills `{placeholder}` tokens with REAL persisted values only. */
export function fillLocalizedText(
  text: LocalizedText,
  values: Record<string, string | LocalizedText>
): LocalizedText {
  const out = {} as LocalizedText;
  for (const lang of [Language.EN, Language.HI, Language.KN]) {
    out[lang] = (text[lang] ?? "").replace(
      /\{(\w+)\}/g,
      (match, key: string) => {
        const value = values[key];
        if (value === undefined || value === null) return match;
        return typeof value === "string" ? value : (value[lang] ?? match);
      }
    );
  }
  return out;
}

export function localizedDietReason(
  framing: "data" | "risk" | "severity",
  sourceKey: DietReasonSourceKey,
  values: Record<string, string | LocalizedText>
): LocalizedText {
  const source = fillLocalizedText(DIET_RATIONALE_SOURCES[sourceKey], values);
  return fillLocalizedText(DIET_REASON_FRAMING[framing], { ...values, source });
}