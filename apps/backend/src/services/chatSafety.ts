// Conservative text screening supplements, and never replaces, clinical review.
export const WARNING_SOURCE = { title: 'CDC: Urgent maternal warning signs', url: 'https://www.cdc.gov/hearher/maternal-warning-signs/index.html' };
const warnings: [string, RegExp][] = [
  ['chest_pain', /chest (?:pain|pressure)|pain in (?:my |the )?chest|सीने में दर्द|छाती में दर्द|ಎದೆ[ ]?ನೋವು/iu],
  ['breathing', /short(?:ness)? of breath|trouble breathing|difficulty breathing|can(?:not|'t|’t) breathe|साँस.*(?:परेशानी|तकलीफ)|सांस.*(?:परेशानी|तकलीफ)|ಉಸಿರಾಟ.*ತೊಂದರೆ/iu],
  ['bleeding', /(?:vaginal|heavy) bleeding|(?:i am|i'm|i’m) bleeding|bleeding (?:heavily|from)|रक्तस्राव|खून बह|ರಕ್ತಸ್ರಾವ/iu],
  ['movement', /(?:reduced|decreased|less|no) (?:fetal|baby|foetal) movement|baby (?:is |has )?(?:not moving|stopped moving|moving less)|baby isn.t moving|बच्चे.*(?:कम हलचल|हलचल कम|हिल नहीं)|ಮಗುವಿನ ಚಲನೆ.*(?:ಕಡಿಮೆ|ಇಲ್ಲ)/iu],
  ['headache', /(?:severe|persistent|worst|sudden) headache|headache.*(?:won.t go away|getting worse)|तेज़ सिरदर्द|तेज सिरदर्द|ತೀವ್ರ ತಲೆನೋವು/iu],
  ['vision', /blurred vision|vision (?:changes|loss)|धुंधला|नज़र.*बदल|ದೃಷ್ಟಿ.*(?:ಬದಲಾವಣೆ|ಮಸುಕು)/iu],
  ['belly_pain', /(?:severe|persistent) (?:abdominal|belly|stomach) pain|पेट में (?:तेज|तेज़) दर्द|ತೀವ್ರ ಹೊಟ್ಟೆನೋವು/iu],
  ['fluids', /(?:can(?:not|'t|’t)|unable to) keep (?:water|food|any |fluids)|severe (?:nausea|vomiting)|पानी.*(?:नहीं रुक|नहीं रख)|ನೀರು.*ಉಳಿಸಿಕೊಳ್ಳಲು ಸಾಧ್ಯವಿಲ್ಲ/iu],
  ['leaking', /(?:fluid|water|waters) (?:is |are )?(?:leaking|broke|breaking)|leaking (?:fluid|water)|waters? (?:has |have )?broken|पानी की थैली.*फट|ನೀರು.*ಒಡೆಯ/iu],
  ['fainting', /(?:i |keep |am )?(?:fainting|fainted)|passed out|बेहोश|ಮೂರ್ಛೆ/iu],
  ['swelling', /(?:extreme|sudden|severe) (?:face|hand|facial) swelling|(?:extreme|sudden|severe) swelling (?:of|in) (?:my |the )?(?:face|hands)|(?:painful|swollen) (?:one |single )?leg|चेहरे.*सूजन|ಕಾಲು.*(?:ನೋವು|ಊತ)/iu],
  ['self_harm', /(?:kill|hurt|harm) (?:myself|my baby)|suicid|end my life|want to die|wish i were dead|खुद को.*(?:नुकसान|मार)|आत्महत्या|ಆತ್ಮಹತ್ಯೆ|ನನಗೆ.*ಹಾನಿ/iu],
];
export function screenChat(message: string) {
  const text = message.toLowerCase().normalize('NFKC');
  const educational = /^(?:what (?:is|are)|explain|tell me about|define|meaning of|signs of|क्या है|ಎಂದರೇನು)/iu.test(text) && !/\b(?:i|my|i'm|i’m)\b/u.test(text);
  // Only remove explicit English negations in their own clause; another
  // warning after "but" remains screenable. Ambiguous wording errs toward care.
  const clauses = text.split(/[.!?;\n]|\bbut\b/u);
  const flags = warnings.filter(([, re]) => clauses.some(c => {
    const match = re.exec(c);
    return match && !/\b(?:no|not having|don.t have|do not have|den(?:y|ies))\s+(?:any\s+)?$/u.test(c.slice(0, match.index));
  })).map(([key]) => key);
  const fever = /(?:fever|temperature)\D{0,15}(\d{2,3}(?:\.\d+)?)/u.exec(text);
  if (fever && ((Number(fever[1]) >= 38 && Number(fever[1]) < 50) || Number(fever[1]) >= 100.4)) flags.push('fever');
  const urgent = flags.length > 0 && !educational;
  return { flags: [...new Set(flags)], urgent, educational };
}
