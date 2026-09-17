import { Language } from "@maasuraksha/shared";
import type {
  RecommendationCategory,
  RecommendationPriority,
} from "@maasuraksha/shared";

/**
 * Hand-authored, multilingual (EN / HI / KN) content store for the
 * system-generated recommendation engine.
 *
 * These strings are decision-support and educational guidance only, never a
 * diagnosis. They are written for this codebase; the engine fills
 * `{placeholder}` tokens exclusively with REAL persisted values (stored model
 * risk level, stored BP / glucose / hemoglobin readings, stored symptom
 * severity). No value is invented here.
 */

export const ENGINE_SOURCE = "MaaSuraksha engine v1";

export type LocalizedText = Record<Language, string>;

export interface RecommendationContent {
  category: RecommendationCategory;
  priority: RecommendationPriority;
  title: LocalizedText;
  content: LocalizedText;
}

/** Placeholder values; LocalizedText values are resolved per language. */
export type TemplateValues = Record<string, string | LocalizedText>;

export function fillLocalized(
  text: LocalizedText,
  values: TemplateValues
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

export const RISK_LEVEL_LABELS: Record<string, LocalizedText> = {
  low: { en: "low", hi: "कम", kn: "ಕಡಿಮೆ" },
  medium: { en: "medium", hi: "मध्यम", kn: "ಮಧ್ಯಮ" },
  moderate: { en: "moderate", hi: "मध्यम", kn: "ಮಧ್ಯಮ" },
  high: { en: "high", hi: "उच्च", kn: "ಹೆಚ್ಚಿನ" },
  critical: { en: "critical", hi: "गंभीर", kn: "ಗಂಭೀರ" },
};

export const PPD_SEVERITY_LABELS: Record<string, LocalizedText> = {
  none: { en: "no", hi: "कोई नहीं", kn: "ಇಲ್ಲ" },
  mild: { en: "mild", hi: "हल्का", kn: "ಸೌಮ್ಯ" },
  moderate: { en: "moderate", hi: "मध्यम", kn: "ಮಧ್ಯಮ" },
  severe: { en: "severe", hi: "गंभीर", kn: "ತೀವ್ರ" },
};

export const SYMPTOM_SEVERITY_LABELS: Record<string, LocalizedText> = {
  mild: { en: "mild", hi: "हल्का", kn: "ಸೌಮ್ಯ" },
  moderate: { en: "moderate", hi: "मध्यम", kn: "ಮಧ್ಯಮ" },
  severe: { en: "severe", hi: "गंभीर", kn: "ತೀವ್ರ" },
  critical: { en: "critical", hi: "अति गंभीर", kn: "ಅತಿ ತೀವ್ರ" },
};

/** Localized source phrases referenced in each generated "why" line. */
const SOURCE_PHRASES: Record<string, LocalizedText> = {
  maternal: {
    en: "your completed maternal risk assessment{model}",
    hi: "आपका पूर्ण मातृ जोखिम मूल्यांकन{model}",
    kn: "ನಿಮ್ಮ ಪೂರ್ಣಗೊಂಡ ತಾಯಿಯ ಅಪಾಯ ಮೌಲ್ಯಮಾಪನ{model}",
  },
  gdm: {
    en: "your completed GDM screening{model}",
    hi: "आपकी पूर्ण जीडीएम स्क्रीनिंग{model}",
    kn: "ನಿಮ್ಮ ಪೂರ್ಣಗೊಂಡ GDM ಪರೀಕ್ಷೆ{model}",
  },
  ppd: {
    en: "your completed PPD screening{model}",
    hi: "आपकी पूर्ण पीपीडी स्क्रीनिंग{model}",
    kn: "ನಿಮ್ಮ ಪೂರ್ಣಗೊಂಡ PPD ಪರೀಕ್ಷೆ{model}",
  },
  trimester: {
    en: "your pregnancy profile (trimester {trimester})",
    hi: "आपका गर्भावस्था प्रोफ़ाइल (त्रैमासिक {trimester})",
    kn: "ನಿಮ್ಮ ಗರ್ಭಧಾರಣೆ ಪ್ರೊಫೈಲ್ (ತ್ರೈಮಾಸಿಕ {trimester})",
  },
  "pregnancy-high-risk": {
    en: "your pregnancy profile, flagged as high risk",
    hi: "आपका गर्भावस्था प्रोफ़ाइल, उच्च जोखिम अंकित",
    kn: "ನಿಮ್ಮ ಗರ್ಭಧಾರಣೆ ಪ್ರೊಫೈಲ್, ಹೆಚ್ಚಿನ ಅಪಾಯ ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ",
  },
  bp: {
    en: "your latest recorded blood pressure of {sys}/{dia} mmHg",
    hi: "आपका नवीनतम रिकॉर्ड किया गया रक्तचाप {sys}/{dia} mmHg",
    kn: "ನಿಮ್ಮ ಇತ್ತೀಚೆ ದಾಖಲಾದ ರಕ್ತದೊತ್ತಡ {sys}/{dia} mmHg",
  },
  glucose: {
    en: "your latest recorded glucose of {glucose} mg/dL",
    hi: "आपका नवीनतम रिकॉर्ड किया गया ग्लूकोज {glucose} mg/dL",
    kn: "ನಿಮ್ಮ ಇತ್ತೀಚೆ ದಾಖಲಾದ ಗ್ಲೂಕೋಸ್ {glucose} mg/dL",
  },
  hemoglobin: {
    en: "your latest recorded hemoglobin of {hemoglobin} g/dL",
    hi: "आपका नवीनतम रिकॉर्ड किया गया हीमोग्लोबिन {hemoglobin} g/dL",
    kn: "ನಿಮ್ಮ ಇತ್ತೀಚೆ ದಾಖಲಾದ ಹಿಮೋಗ್ಲೋಬಿನ್ {hemoglobin} g/dL",
  },
  symptom: {
    en: "your latest symptom record ({severity} severity)",
    hi: "आपका नवीनतम लक्षण रिकॉर्ड ({severity} गंभीरता)",
    kn: "ನಿಮ್ಮ ಇತ್ತೀಚಿನ ರೋಗಲಕ್ಷಣ ದಾಖಲೆ ({severity} ತೀವ್ರತೆ)",
  },
};

const REASON_FRAMING: Record<string, LocalizedText> = {
  risk: {
    en: "Generated from {source}, recorded as {level} risk.",
    hi: "{source} से तैयार किया गया, जिसमें {level} जोखिम दर्ज हुआ।",
    kn: "{source} ಇಂದ ರಚಿಸಲಾಗಿದೆ, ಅದರಲ್ಲಿ {level} ಅಪಾಯ ದಾಖಲಾಗಿದೆ.",
  },
  severity: {
    en: "Generated from {source}, recorded as {level} severity.",
    hi: "{source} से तैयार किया गया, जिसमें {level} गंभीरता दर्ज हुई।",
    kn: "{source} ಇಂದ ರಚಿಸಲಾಗಿದೆ, ಅದರಲ್ಲಿ {level} ತೀವ್ರತೆ ದಾಖಲಾಗಿದೆ.",
  },
  data: {
    en: "Based on {source}.",
    hi: "{source} के आधार पर।",
    kn: "{source} ಆಧರಿಸಿ.",
  },
};

export function localizedReason(
  framing: keyof typeof REASON_FRAMING,
  sourceKey: keyof typeof SOURCE_PHRASES,
  values: TemplateValues
): LocalizedText {
  const source = fillLocalized(SOURCE_PHRASES[sourceKey], values);
  return fillLocalized(REASON_FRAMING[framing], { ...values, source });
}

export const RECOMMENDATION_TEMPLATES: Record<
  string,
  RecommendationContent
> = {
  /* ---- Maternal risk (completed assessment, real model result) ---- */
  "maternal-risk-high": {
    category: "warning",
    priority: "high",
    title: {
      en: "High maternal risk — seek medical review",
      hi: "उच्च मातृ जोखिम — चिकित्सकीय समीक्षा कराएं",
      kn: "ಹೆಚ್ಚಿನ ತಾಯಿಯ ಅಪಾಯ — ವೈದ್ಯಕೀಯ ಪರಿಶೀಲನೆ ಪಡೆಯಿರಿ",
    },
    content: {
      en: "Your completed maternal risk assessment recorded {level} risk. This is a screening estimate, not a diagnosis. Please contact your doctor soon for review and next steps.",
      hi: "आपके पूर्ण मातृ जोखिम मूल्यांकन में {level} जोखिम दर्ज हुआ। यह एक स्क्रीनिंग अनुमान है, निदान नहीं। कृपया शीघ्र ही अपने डॉक्टर से संपर्क करके समीक्षा और अगले कदमों की सलाह लें।",
      kn: "ನಿಮ್ಮ ಪೂರ್ಣಗೊಂಡ ತಾಯಿಯ ಅಪಾಯ ಮೌಲ್ಯಮಾಪನದಲ್ಲಿ {level} ಅಪಾಯ ದಾಖಲಾಗಿದೆ. ಇದು ಪರೀಕ್ಷಾ ಅಂದಾಜು, ರೋಗನಿರ್ಣಯವಲ್ಲ. ದಯವಿಟ್ಟು ಶೀಘ್ರದಲ್ಲೇ ನಿಮ್ಮ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ ಪರಿಶೀಲನೆ ಮತ್ತು ಮುಂದಿನ ಹಂತಗಳ ಸಲಹೆ ಪಡೆಯಿರಿ.",
    },
  },
  "maternal-risk-medium": {
    category: "medical",
    priority: "medium",
    title: {
      en: "Review your maternal risk at the next visit",
      hi: "अगली मुलाकात पर अपने मातृ जोखिम की समीक्षा करें",
      kn: "ಮುಂದಿನ ಭೇಟಿಯಲ್ಲಿ ನಿಮ್ಮ ತಾಯಿಯ ಅಪಾಯವನ್ನು ಪರಿಶೀಲಿಸಿ",
    },
    content: {
      en: "Your completed maternal risk assessment recorded {level} risk. This is a screening estimate, not a diagnosis. Please review the result with your care provider at your next visit.",
      hi: "आपके पूर्ण मातृ जोखिम मूल्यांकन में {level} जोखिम दर्ज हुआ। यह एक स्क्रीनिंग अनुमान है, निदान नहीं। कृपया अपनी अगली मुलाकात में परिणाम की समीक्षा अपने देखभाल प्रदाता से करें।",
      kn: "ನಿಮ್ಮ ಪೂರ್ಣಗೊಂಡ ತಾಯಿಯ ಅಪಾಯ ಮೌಲ್ಯಮಾಪನದಲ್ಲಿ {level} ಅಪಾಯ ದಾಖಲಾಗಿದೆ. ಇದು ಪರೀಕ್ಷಾ ಅಂದಾಜು, ರೋಗನಿರ್ಣಯವಲ್ಲ. ದಯವಿಟ್ಟು ಮುಂದಿನ ಭೇಟಿಯಲ್ಲಿ ಫಲಿತಾಂಶವನ್ನು ನಿಮ್ಮ ಆರೈಕೆ ಅಧಿಕಾರಿಯೊಂದಿಗೆ ಪರಿಶೀಲಿಸಿ.",
    },
  },
  "maternal-risk-low": {
    category: "general",
    priority: "low",
    title: {
      en: "Continue routine antenatal care",
      hi: "नियमित प्रसवपूर्व देखभाल जारी रखें",
      kn: "ನಿಯಮಿತ ಗರ್ಭಾವಧಿ ಆರೈಕೆಯನ್ನು ಮುಂದುವರಿಸಿ",
    },
    content: {
      en: "Your completed maternal risk assessment recorded low risk. Continue your routine antenatal check-ups, balanced meals and the care plan discussed with your care team.",
      hi: "आपके पूर्ण मातृ जोखिम मूल्यांकन में कम जोखिम दर्ज हुआ। अपनी नियमित प्रसवपूर्व जाँच, संतुलित भोजन और देखभाल टीम से तय की गई देखभाल योजना जारी रखें।",
      kn: "ನಿಮ್ಮ ಪೂರ್ಣಗೊಂಡ ತಾಯಿಯ ಅಪಾಯ ಮೌಲ್ಯಮಾಪನದಲ್ಲಿ ಕಡಿಮೆ ಅಪಾಯ ದಾಖಲಾಗಿದೆ. ನಿಯಮಿತ ಪ್ರಸವಪೂರ್ವ ತಪಾಸಣೆ, ಸಮತೋಲಿತ ಆಹಾರ ಮತ್ತು ಆರೈಕೆ ತಂಡದೊಂದಿಗೆ ನಿರ್ಧರಿಸಿದ ಆರೈಕೆ ಯೋಜನೆಯನ್ನು ಮುಂದುವರಿಸಿ.",
    },
  },

  /* ---- GDM screening (completed assessment, real model result) ---- */
  "gdm-risk-high": {
    category: "warning",
    priority: "high",
    title: {
      en: "GDM screening — follow-up needed",
      hi: "जीडीएम स्क्रीनिंग — अनुवर्ती जाँच आवश्यक",
      kn: "GDM ಪರೀಕ್ಷೆ — ಮುಂದಿನ ಪರಿಶೀಲನೆ ಅಗತ್ಯ",
    },
    content: {
      en: "Your completed GDM risk screening recorded {level} risk. This is a screening estimate and does not diagnose gestational diabetes. Please follow your care provider's advice about glucose testing and discuss this result with them.",
      hi: "आपकी पूर्ण जीडीएम जोखिम स्क्रीनिंग में {level} जोखिम दर्ज हुआ। यह एक स्क्रीनिंग अनुमान है और गर्भकालीन मधुमेह का निदान नहीं है। कृपया ग्लूकोज जाँच के बारे में अपने देखभाल प्रदाता की सलाह मानें और इस परिणाम पर उनसे चर्चा करें।",
      kn: "ನಿಮ್ಮ ಪೂರ್ಣಗೊಂಡ GDM ಅಪಾಯ ಪರೀಕ್ಷೆಯಲ್ಲಿ {level} ಅಪಾಯ ದಾಖಲಾಗಿದೆ. ಇದು ಪರೀಕ್ಷಾ ಅಂದಾಜು ಮತ್ತು ಗರ್ಭಾವಧಿ ಮಧುಮೇಹದ ರೋಗನಿರ್ಣಯವಲ್ಲ. ದಯವಿಟ್ಟು ಗ್ಲೂಕೋಸ್ ಪರೀಕ್ಷೆಯ ಬಗ್ಗೆ ನಿಮ್ಮ ಆರೈಕೆ ಅಧಿಕಾರಿಯ ಸಲಹೆಯನ್ನು ಅನುಸರಿಸಿ ಮತ್ತು ಈ ಫಲಿತಾಂಶವನ್ನು ಅವರೊಂದಿಗೆ ಚರ್ಚಿಸಿ.",
    },
  },
  "gdm-risk-moderate": {
    category: "medical",
    priority: "medium",
    title: {
      en: "GDM screening — discuss with your provider",
      hi: "जीडीएम स्क्रीनिंग — अपने प्रदाता से चर्चा करें",
      kn: "GDM ಪರೀಕ್ಷೆ — ನಿಮ್ಮ ಆರೈಕೆ ಅಧಿಕಾರಿಯೊಂದಿಗೆ ಚರ್ಚಿಸಿ",
    },
    content: {
      en: "Your completed GDM risk screening recorded {level} risk, a screening estimate and not a diagnosis. Please discuss the result with your care provider at your next visit.",
      hi: "आपकी पूर्ण जीडीएम जोखिम स्क्रीनिंग में {level} जोखिम दर्ज हुआ, जो एक स्क्रीनिंग अनुमान है, निदान नहीं। कृपया अपनी अगली मुलाकात में परिणाम पर अपने देखभाल प्रदाता से चर्चा करें।",
      kn: "ನಿಮ್ಮ ಪೂರ್ಣಗೊಂಡ GDM ಅಪಾಯ ಪರೀಕ್ಷೆಯಲ್ಲಿ {level} ಅಪಾಯ ದಾಖಲಾಗಿದೆ, ಅದು ಪರೀಕ್ಷಾ ಅಂದಾಜು ಮತ್ತು ರೋಗನಿರ್ಣಯವಲ್ಲ. ದಯವಿಟ್ಟು ಮುಂದಿನ ಭೇಟಿಯಲ್ಲಿ ಫಲಿತಾಂಶವನ್ನು ನಿಮ್ಮ ಆರೈಕೆ ಅಧಿಕಾರಿಯೊಂದಿಗೆ ಚರ್ಚಿಸಿ.",
    },
  },
  "gdm-risk-low": {
    category: "general",
    priority: "low",
    title: {
      en: "Continue routine glucose monitoring",
      hi: "नियमित ग्लूकोज निगरानी जारी रखें",
      kn: "ನಿಯಮಿತ ಗ್ಲೂಕೋಸ್ ಮೇಲ್ವಿಚಾರಣೆ ಮುಂದುವರಿಸಿ",
    },
    content: {
      en: "Your completed GDM risk screening recorded low risk. Continue your routine antenatal care and discuss any concerns with your care team.",
      hi: "आपकी पूर्ण जीडीएम जोखिम स्क्रीनिंग में कम जोखिम दर्ज हुआ। अपनी नियमित प्रसवपूर्व देखभाल जारी रखें और किसी भी चिंता पर देखभाल टीम से चर्चा करें।",
      kn: "ನಿಮ್ಮ ಪೂರ್ಣಗೊಂಡ GDM ಅಪಾಯ ಪರೀಕ್ಷೆಯಲ್ಲಿ ಕಡಿಮೆ ಅಪಾಯ ದಾಖಲಾಗಿದೆ. ನಿಯಮಿತ ಗರ್ಭಾವಧಿ ಆರೈಕೆಯನ್ನು ಮುಂದುವರಿಸಿ ಮತ್ತು ಯಾವುದೇ ಕಾಳಜಿಗಳನ್ನು ಆರೈಕೆ ತಂಡದೊಂದಿಗೆ ಚರ್ಚಿಸಿ.",
    },
  },

  /* ---- PPD screening (completed assessment, real model result) ---- */
  "ppd-risk-moderate": {
    category: "mental_health",
    priority: "medium",
    title: {
      en: "Support for how you are feeling",
      hi: "आप कैसा महसूस कर रहे हैं, इसके लिए सहारा",
      kn: "ನಿಮ್ಮ ಭಾವನೆಗಳಿಗೆ ಆಧಾರ",
    },
    content: {
      en: "Your completed PPD screening recorded {level} distress. This is a screening result, not a diagnosis. It can help to talk — consider discussing how you have been feeling with your care provider or a trusted support person.",
      hi: "आपकी पूर्ण पीपीडी स्क्रीनिंग में {level} परेशानी दर्ज हुई। यह एक स्क्रीनिंग परिणाम है, निदान नहीं। बात करने से मदद मिल सकती है — अपने देखभाल प्रदाता या किसी विश्वसनीय व्यक्ति से अपनी भावनाओं पर चर्चा करने पर विचार करें।",
      kn: "ನಿಮ್ಮ ಪೂರ್ಣಗೊಂಡ PPD ಪರೀಕ್ಷೆಯಲ್ಲಿ {level} ತೊಂದರೆ ದಾಖಲಾಗಿದೆ. ಇದು ಪರೀಕ್ಷಾ ಫಲಿತಾಂಶ, ರೋಗನಿರ್ಣಯವಲ್ಲ. ಮಾತನಾಡುವುದು ಸಹಾಯ ಮಾಡಬಹುದು — ನೀವು ಹೇಗೆ ಭಾವಿಸುತ್ತಿದ್ದೀರಿ ಎಂಬುದನ್ನು ನಿಮ್ಮ ಆರೈಕೆ ಅಧಿಕಾರಿ ಅಥವಾ ನಂಬಬಹುದಾದ ವ್ಯಕ್ತಿಯೊಂದಿಗೆ ಚರ್ಚಿಸುವುದನ್ನು ಪರಿಗಣಿಸಿ.",
    },
  },
  "ppd-risk-severe": {
    category: "mental_health",
    priority: "high",
    title: {
      en: "PPD screening — speak with your provider soon",
      hi: "पीपीडी स्क्रीनिंग — शीघ्र अपने प्रदाता से बात करें",
      kn: "PPD ಪರೀಕ್ಷೆ — ಶೀಘ್ರದಲ್ಲೇ ನಿಮ್ಮ ಆರೈಕೆ ಅಧಿಕಾರಿಯೊಂದಿಗೆ ಮಾತನಾಡಿ",
    },
    content: {
      en: "Your completed PPD screening recorded {level} severity. This is a screening result, not a diagnosis. If you are struggling, please reach out soon — talk to your care provider or a mental-health professional about how you are feeling.",
      hi: "आपकी पूर्ण पीपीडी स्क्रीनिंग में {level} गंभीरता दर्ज हुई। यह एक स्क्रीनिंग परिणाम है, निदान नहीं। यदि आप संघर्ष कर रहे हैं, तो कृपया शीघ्र ही अपने देखभाल प्रदाता या मानसिक-स्वास्थ्य पेशेवर से बात करें।",
      kn: "ನಿಮ್ಮ ಪೂರ್ಣಗೊಂಡ PPD ಪರೀಕ್ಷೆಯಲ್ಲಿ {level} ತೀವ್ರತೆ ದಾಖಲಾಗಿದೆ. ಇದು ಪರೀಕ್ಷಾ ಫಲಿತಾಂಶ, ರೋಗನಿರ್ಣಯವಲ್ಲ. ನೀವು ಕಷ್ಟದಲ್ಲಿದ್ದರೆ, ದಯವಿಟ್ಟು ಶೀಘ್ರದಲ್ಲೇ ಮಾತನಾಡಿ — ಹೇಗೆ ಭಾವಿಸುತ್ತಿದ್ದೀರಿ ಎಂಬುದನ್ನು ನಿಮ್ಮ ಆರೈಕೆ ಅಧಿಕಾರಿ ಅಥವಾ ಮಾನಸಿಕ ಆರೋಗ್ಯ ತಜ್ಞರೊಂದಿಗೆ ಹಂಚಿಕೊಳ್ಳಿ.",
    },
  },

  /* ---- Pregnancy profile (stored clinical/lifestyle data) ---- */
  "pregnancy-trimester-1": {
    category: "general",
    priority: "low",
    title: {
      en: "First-trimester care basics",
      hi: "पहली तिमाही की बुनियादी देखभाल",
      kn: "ಮೊದಲ ತ್ರೈಮಾಸಿಕ ಆರೈಕೆ ಮೂಲಗಳು",
    },
    content: {
      en: "Journey into your first trimester: keep your antenatal appointments, stay hydrated and eat a balanced diet. Discuss any supplements with your care provider before starting them.",
      hi: "पहली तिमाही में: अपनी प्रसवपूर्व मुलाकातें जारी रखें, हाइड्रेटेड रहें और संतुलित भोजन करें। किसी भी सप्लीमेंट को शुरू करने से पहले अपने देखभाल प्रदाता से चर्चा करें।",
      kn: "ಮೊದಲ ತ್ರೈಮಾಸಿಕದಲ್ಲಿ: ನಿಮ್ಮ ಪ್ರಸವಪೂರ್ವ ಭೇಟಿಗಳನ್ನು ಮುಂದುವರಿಸಿ, ನೀರಿನಂಶ ಸಮತೋಲನ ಇಟ್ಟುಕೊಳ್ಳಿ ಮತ್ತು ಸಮತೋಲಿತ ಆಹಾರ ಸೇವಿಸಿ. ಯಾವುದೇ ಪೂರಕವನ್ನು ಪ್ರಾರಂಭಿಸುವ ಮೊದಲು ನಿಮ್ಮ ಆರೈಕೆ ಅಧಿಕಾರಿಯೊಂದಿಗೆ ಚರ್ಚಿಸಿ.",
    },
  },
  "pregnancy-trimester-2": {
    category: "general",
    priority: "low",
    title: {
      en: "Second-trimester care basics",
      hi: "दूसरी तिमाही की बुनियादी देखभाल",
      kn: "ಎರಡನೇ ತ್ರೈಮಾಸಿಕ ಆರೈಕೆ ಮೂಲಗಳು",
    },
    content: {
      en: "Journey into your second trimester: continue regular antenatal visits, gentle activity and a balanced diet. Share any new symptoms with your care provider.",
      hi: "दूसरी तिमाही में: नियमित प्रसवपूर्व मुलाकातें, हल्की गतिविधि और संतुलित भोजन जारी रखें। किसी भी नए लक्षण को अपने देखभाल प्रदाता से साझा करें।",
      kn: "ಎರಡನೇ ತ್ರೈಮಾಸಿಕದಲ್ಲಿ: ನಿಯಮಿತ ಪ್ರಸವಪೂರ್ವ ಭೇಟಿಗಳು, ಸೌಮ್ಯ ಚಟುವಟಿಕೆ ಮತ್ತು ಸಮತೋಲಿತ ಆಹಾರ ಮುಂದುವರಿಸಿ. ಯಾವುದೇ ಹೊಸ ರೋಗಲಕ್ಷಣಗಳನ್ನು ನಿಮ್ಮ ಆರೈಕೆ ಅಧಿಕಾರಿಯೊಂದಿಗೆ ಹಂಚಿಕೊಳ್ಳಿ.",
    },
  },
  "pregnancy-trimester-3": {
    category: "general",
    priority: "low",
    title: {
      en: "Third-trimester care basics",
      hi: "तीसरी तिमाही की बुनियादी देखभाल",
      kn: "ಮೂರನೇ ತ್ರೈಮಾಸಿಕ ಆರೈಕೆ ಮೂಲಗಳು",
    },
    content: {
      en: "Journey into your third trimester: stay in touch with your care team about your birth plan, rest well and report any warning signs you have been told about.",
      hi: "तीसरी तिमाही में: जन्म योजना के बारे में अपनी देखभाल टीम से संपर्क बनाए रखें, अच्छा आराम करें और बताए गए किसी भी चेतावनी संकेत को तुरंत बताएं।",
      kn: "ಮೂರನೇ ತ್ರೈಮಾಸಿಕದಲ್ಲಿ: ಜನನ ಯೋಜನೆಯ ಬಗ್ಗೆ ಆರೈಕೆ ತಂಡದೊಂದಿಗೆ ಸಂಪರ್ಕದಲ್ಲಿರಿ, ಚೆನ್ನಾಗಿ ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ ಮತ್ತು ತಿಳಿಸಿದ ಯಾವುದೇ ಎಚ್ಚರಿಕೆ ಚಿಹ್ನೆಗಳನ್ನು ವರದಿ ಮಾಡಿ.",
    },
  },
  "pregnancy-high-risk": {
    category: "medical",
    priority: "high",
    title: {
      en: "Follow your high-risk antenatal plan",
      hi: "अपनी उच्च-जोखिम प्रसवपूर्व योजना का पालन करें",
      kn: "ನಿಮ್ಮ ಹೆಚ್ಚಿನ ಅಪಾಯದ ಪ್ರಸವಪೂರ್ವ ಯೋಜನೆಯನ್ನು ಅನುಸರಿಸಿ",
    },
    content: {
      en: "Your pregnancy profile is flagged as high risk. Please follow the antenatal care plan agreed with your care team and attend your scheduled check-ups.",
      hi: "आपका गर्भावस्था प्रोफ़ाइल उच्च जोखिम अंकित है। कृपया अपनी देखभाल टीम से तय की गई प्रसवपूर्व देखभाल योजना का पालन करें और निर्धारित जाँचों में शामिल हों।",
      kn: "ನಿಮ್ಮ ಗರ್ಭಧಾರಣೆ ಪ್ರೊಫೈಲ್ ಹೆಚ್ಚಿನ ಅಪಾಯ ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಆರೈಕೆ ತಂಡದೊಂದಿಗೆ ನಿರ್ಧರಿಸಿದ ಪ್ರಸವಪೂರ್ವ ಆರೈಕೆ ಯೋಜನೆಯನ್ನು ಅನುಸರಿಸಿ ಮತ್ತು ನಿಗದಿತ ತಪಾಸಣೆಗಳಿಗೆ ಹಾಜರಾಗಿ.",
    },
  },

  /* ---- Health metrics (latest stored readings) ---- */
  "metric-bp-high": {
    category: "warning",
    priority: "high",
    title: {
      en: "Elevated blood pressure — review needed",
      hi: "उच्च रक्तचाप — समीक्षा आवश्यक",
      kn: "ಹೆಚ್ಚಿನ ರಕ್ತದೊತ್ತಡ — ಪರಿಶೀಲನೆ ಅಗತ್ಯ",
    },
    content: {
      en: "Your latest recorded blood pressure was {sys}/{dia} mmHg, which is elevated. This is a screening observation, not a diagnosis. Please contact your care provider for review, especially if you also have headache, blurred vision or other warning signs.",
      hi: "आपका नवीनतम रिकॉर्ड किया गया रक्तचाप {sys}/{dia} mmHg था, जो ऊँचा है। यह एक स्क्रीनिंग टिप्पणी है, निदान नहीं। कृपया समीक्षा के लिए अपने देखभाल प्रदाता से संपर्क करें, खासकर यदि सिरदर्द, धुंधली दृष्टि या अन्य चेतावनी संकेत भी हों।",
      kn: "ನಿಮ್ಮ ಇತ್ತೀಚೆ ದಾಖಲಾದ ರಕ್ತದೊತ್ತಡ {sys}/{dia} mmHg ಆಗಿತ್ತು, ಅದು ಹೆಚ್ಚಿದೆ. ಇದು ಪರೀಕ್ಷಾ ಅವಲೋಕನ, ರೋಗನಿರ್ಣಯವಲ್ಲ. ದಯವಿಟ್ಟು ಪರಿಶೀಲನೆಗಾಗಿ ನಿಮ್ಮ ಆರೈಕೆ ಅಧಿಕಾರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ, ವಿಶೇಷವಾಗಿ ತಲೆನೋವು, ಮಸುಕು ದೃಷ್ಟಿ ಅಥವಾ ಇತರ ಎಚ್ಚರಿಕೆ ಚಿಹ್ನೆಗಳು ಇದ್ದರೆ.",
    },
  },
  "metric-glucose-high": {
    category: "medical",
    priority: "medium",
    title: {
      en: "Elevated glucose reading — discuss with your provider",
      hi: "उच्च ग्लूकोज स्तर — अपने प्रदाता से चर्चा करें",
      kn: "ಹೆಚ್ಚಿನ ಗ್ಲೂಕೋಸ್ ಮೌಲ್ಯ — ನಿಮ್ಮ ಆರೈಕೆ ಅಧಿಕಾರಿಯೊಂದಿಗೆ ಚರ್ಚಿಸಿ",
    },
    content: {
      en: "Your latest recorded glucose was {glucose} mg/dL, above the typical range. A single reading is not a diagnosis. Please discuss it with your care provider.",
      hi: "आपका नवीनतम रिकॉर्ड किया गया ग्लूकोज {glucose} mg/dL था, जो सामान्य सीमा से अधिक है। एक अकेला माप निदान नहीं है। कृपया इस पर अपने देखभाल प्रदाता से चर्चा करें।",
      kn: "ನಿಮ್ಮ ಇತ್ತೀಚೆ ದಾಖಲಾದ ಗ್ಲೂಕೋಸ್ {glucose} mg/dL ಆಗಿತ್ತು, ಅದು ಸಾಮಾನ್ಯ ವ್ಯಾಪ್ತಿಗಿಂತ ಹೆಚ್ಚಿದೆ. ಒಂದೇ ಅಳತೆ ರೋಗನಿರ್ಣಯವಲ್ಲ. ದಯವಿಟ್ಟು ಇದನ್ನು ನಿಮ್ಮ ಆರೈಕೆ ಅಧಿಕಾರಿಯೊಂದಿಗೆ ಚರ್ಚಿಸಿ.",
    },
  },
  "metric-hemoglobin-low": {
    category: "nutrition",
    priority: "medium",
    title: {
      en: "Low hemoglobin — iron-rich diet review",
      hi: "कम हीमोग्लोबिन — आयरन युक्त आहार समीक्षा",
      kn: "ಕಡಿಮೆ ಹಿಮೋಗ್ಲೋಬಿನ್ — ಕಬ್ಬಿಣ ಭರಿತ ಆಹಾರ ಪರಿಶೀಲನೆ",
    },
    content: {
      en: "Your latest recorded hemoglobin was {hemoglobin} g/dL, below the typical range for pregnancy. Include iron-rich foods in your meals and discuss whether any supplements are right for you with your care provider.",
      hi: "आपका नवीनतम रिकॉर्ड किया गया हीमोग्लोबिन {hemoglobin} g/dL था, जो गर्भावस्था की सामान्य सीमा से कम है। अपने भोजन में आयरन युक्त खाद्य पदार्थ शामिल करें और अपने देखभाल प्रदाता से चर्चा करें कि कोई सप्लीमेंट आपके लिए उपयुक्त है या नहीं।",
      kn: "ನಿಮ್ಮ ಇತ್ತೀಚೆ ದಾಖಲಾದ ಹಿಮೋಗ್ಲೋಬಿನ್ {hemoglobin} g/dL ಆಗಿತ್ತು, ಅದು ಗರ್ಭಧಾರಣೆಯ ಸಾಮಾನ್ಯ ವ್ಯಾಪ್ತಿಗಿಂತ ಕಡಿಮೆ. ನಿಮ್ಮ ಊಟದಲ್ಲಿ ಕಬ್ಬಿಣ ಭರಿತ ಆಹಾರಗಳನ್ನು ಸೇರಿಸಿ ಮತ್ತು ಯಾವುದೇ ಪೂರಕ ನಿಮಗೆ ಸೂಕ್ತವಾಗಿದೆಯೇ ಎಂಬುದನ್ನು ನಿಮ್ಮ ಆರೈಕೆ ಅಧಿಕಾರಿಯೊಂದಿಗೆ ಚರ್ಚಿಸಿ.",
    },
  },

  /* ---- Symptoms (latest stored severity) ---- */
  "symptom-critical": {
    category: "warning",
    priority: "high",
    title: {
      en: "Critical symptoms — urgent medical attention",
      hi: "गंभीर लक्षण — तत्काल चिकित्सकीय सहायता",
      kn: "ಅತಿ ತೀವ್ರ ರೋಗಲಕ್ಷಣಗಳು — ತುರ್ತು ವೈದ್ಯಕೀಯ ಸಹಾಯ",
    },
    content: {
      en: "You recently recorded symptoms at critical severity. Please seek urgent medical attention and inform your care provider immediately. Symptoms alone do not confirm a diagnosis.",
      hi: "आपने हाल ही में अति गंभीर स्तर के लक्षण दर्ज किए। कृपया तत्काल चिकित्सकीय सहायता लें और अपने देखभाल प्रदाता को तुरंत सूचित करें। लक्षण अकेले किसी निदान की पुष्टि नहीं करते।",
      kn: "ನೀವು ಇತ್ತೀಚೆಗೆ ಅತಿ ತೀವ್ರ ಮಟ್ಟದ ರೋಗಲಕ್ಷಣಗಳನ್ನು ದಾಖಲಿಸಿದ್ದೀರಿ. ದಯವಿಟ್ಟು ತುರ್ತು ವೈದ್ಯಕೀಯ ಸಹಾಯ ಪಡೆಯಿರಿ ಮತ್ತು ನಿಮ್ಮ ಆರೈಕೆ ಅಧಿಕಾರಿಗೆ ತಕ್ಷಣ ತಿಳಿಸಿ. ರೋಗಲಕ್ಷಣಗಳು ಮಾತ್ರ ರೋಗನಿರ್ಣಯವನ್ನು ದೃಢಪಡಿಸುವುದಿಲ್ಲ.",
    },
  },
  "symptom-severe": {
    category: "medical",
    priority: "high",
    title: {
      en: "Severe symptoms — contact your provider",
      hi: "गंभीर लक्षण — अपने प्रदाता से संपर्क करें",
      kn: "ತೀವ್ರ ರೋಗಲಕ್ಷಣಗಳು — ನಿಮ್ಮ ಆರೈಕೆ ಅಧಿಕಾರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ",
    },
    content: {
      en: "You recently recorded symptoms at severe severity. Please contact your care provider to review them. Symptoms alone do not confirm a diagnosis.",
      hi: "आपने हाल ही में गंभीर स्तर के लक्षण दर्ज किए। कृपया उनकी समीक्षा के लिए अपने देखभाल प्रदाता से संपर्क करें। लक्षण अकेले किसी निदान की पुष्टि नहीं करते।",
      kn: "ನೀವು ಇತ್ತೀಚೆಗೆ ತೀವ್ರ ಮಟ್ಟದ ರೋಗಲಕ್ಷಣಗಳನ್ನು ದಾಖಲಿಸಿದ್ದೀರಿ. ದಯವಿಟ್ಟು ಅವುಗಳನ್ನು ಪರಿಶೀಲಿಸಲು ನಿಮ್ಮ ಆರೈಕೆ ಅಧಿಕಾರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ. ರೋಗಲಕ್ಷಣಗಳು ಮಾತ್ರ ರೋಗನಿರ್ಣಯವನ್ನು ದೃಢಪಡಿಸುವುದಿಲ್ಲ.",
    },
  },
  "symptom-moderate": {
    category: "medical",
    priority: "medium",
    title: {
      en: "Moderate symptoms — share at your next visit",
      hi: "मध्यम लक्षण — अगली मुलाकात में साझा करें",
      kn: "ಮಧ್ಯಮ ರೋಗಲಕ್ಷಣಗಳು — ಮುಂದಿನ ಭೇಟಿಯಲ್ಲಿ ಹಂಚಿಕೊಳ್ಳಿ",
    },
    content: {
      en: "You recently recorded moderate symptoms. Please mention them to your care provider at your next visit.",
      hi: "आपने हाल ही में मध्यम लक्षण दर्ज किए। कृपया अपनी अगली मुलाकात में उनका उल्लेख अपने देखभाल प्रदाता से करें।",
      kn: "ನೀವು ಇತ್ತೀಚೆಗೆ ಮಧ್ಯಮ ರೋಗಲಕ್ಷಣಗಳನ್ನು ದಾಖಲಿಸಿದ್ದೀರಿ. ದಯವಿಟ್ಟು ಮುಂದಿನ ಭೇಟಿಯಲ್ಲಿ ಅವುಗಳನ್ನು ನಿಮ್ಮ ಆರೈಕೆ ಅಧಿಕಾರಿಯೊಂದಿಗೆ ಹಂಚಿಕೊಳ್ಳಿ.",
    },
  },
};