# -*- coding: utf-8 -*-
"""Deterministic crisis / safety detection for free-text mood journal entries.

This is a transparent, rule-based heuristic (keyword matching in en/hi/kn).
It is REAL logic and is always labelled as RULE_BASED -- it is never presented
as a trained model output. Its purpose is the safety doorbell: whenever crisis
language appears, the service escalates regardless of model availability.
"""

from dataclasses import dataclass, field

DISTRESS_KEYWORDS = {
    "en": [
        "suicide", "suicidal", "kill myself", "end my life", "want to die",
        "self-harm", "hurt myself", "no reason to live", "better off dead",
        "hopeless", "worthless", "harm myself", "i want to disappear",
    ],
    "hi": [
        "आत्महत्या", "मरना चाहती हूँ", "मरना चाहता हूँ",
        "जीने का कोई मतलब नहीं", "खुद को नुकसान", "बेकार हूँ",
        "अपनी जान लेना", "आत्म-नुकसान",
    ],
    "kn": [
        "ಆತ್ಮಹತ್ಯೆ", "ಸಾಯಬೇಕು", "ಬದುಕುವ ಅರ್ಥ ಇಲ್ಲ",
        "ತನ್ನನ್ನು ತಾನು ಹಾನಿಮಾಡಿಕೊಳ್ಳ", "ನಾನು ಬೇಡವಾದವಳು",
        "ಸ್ವಂತ ಪ್ರಾಣ ತೆಗೆಯಲು", "ಬದುಕಲು ಬೇಡ",
    ],
}

POSITIVE_KEYWORDS = {
    "en": ["happy", "grateful", "excited", "joyful", "peaceful", "love", "hopeful"],
    "hi": ["खुश", "कृतज्ञ", "उत्साहित", "प्रसन्न", "शांत", "प्यार", "आशावान"],
    "kn": ["ಸಂತೋಷ", "ಕೃತಜ್ಞ", "ಉತ್ಸಾಹಿ", "ನೆಮ್ಮದಿ", "ಪ್ರೀತಿ", "ಭರವಸೆ"],
}

NEGATIVE_KEYWORDS = {
    "en": ["sad", "anxious", "worried", "stressed", "angry", "scared", "lonely"],
    "hi": ["दुखी", "चिंतित", "परेशान", "तनाव", "गुस्सा", "डरा हुआ", "अकेला"],
    "kn": ["ದುಃಖ", "ಆತಂಕ", "ಚಿಂತೆ", "ಒತ್ತಡ", "ಕೋಪ", "ಭಯ", "ಒಂಟಿ"],
}

SUPPORTED_LANGUAGES = ("en", "hi", "kn")

SAFETY_MESSAGES = {
    "en": {
        "escalation": "SAFETY ESCALATION: Distress content detected. If you or someone you know is in crisis, please seek immediate professional help.",
        "clear": "No crisis language detected.",
    },
    "hi": {
        "escalation": "सुरक्षा चेतावनी: संकट की भाषा पाई गई। यदि आप या आपका कोई परिचित संकट में है, तो कृपया तत्काल पेशेवर सहायता लें।",
        "clear": "संकट की भाषा नहीं पाई गई।",
    },
    "kn": {
        "escalation": "ಸುರಕ್ಷತಾ ಎಚ್ಚರಿಕೆ: ಸಂಕಷ್ಟದ ಭಾಷೆ ಪತ್ತೆಯಾಗಿದೆ. ನೀವು ಅಥವಾ ನಿಮಗೆ ತಿಳಿದಿರುವ ಯಾರಾದರೂ ಸಂಕಷ್ಟದಲ್ಲಿದ್ದರೆ, ದಯವಿಟ್ಟು ತಕ್ಷಣ ವೃತ್ತಿಪರ ಸಹಾಯ ಪಡೆಯಿರಿ.",
        "clear": "ಸಂಕಷ್ಟದ ಭಾಷೆ ಪತ್ತೆಯಾಗಿಲ್ಲ.",
    },
}


def _message(lang, key):
    return SAFETY_MESSAGES.get(lang, SAFETY_MESSAGES["en"]).get(key, SAFETY_MESSAGES["en"][key])


@dataclass
class SafetyResult:
    safety_flag: bool
    safety_keywords: list = field(default_factory=list)
    safety_message: str = ""
    positive_signals: int = 0
    negative_signals: int = 0
    rule_based_sentiment: str = "neutral"
    rule_based_score: float = 0.5

    def to_dict(self):
        return {
            "safety_flag": self.safety_flag,
            "safety_keywords": self.safety_keywords,
            "safety_message": self.safety_message,
            "positive_signals": self.positive_signals,
            "negative_signals": self.negative_signals,
            "rule_based_sentiment": self.rule_based_sentiment,
            "rule_based_score": self.rule_based_score,
        }


def _normalize_language(language):
    return language if language in SUPPORTED_LANGUAGES else "en"


def analyze_safety(text, language="en"):
    lang = _normalize_language(language)
    text_lower = text.lower()

    matched_distress = [kw for kw in DISTRESS_KEYWORDS[lang] if kw.lower() in text_lower]
    positive_count = sum(1 for kw in POSITIVE_KEYWORDS[lang] if kw.lower() in text_lower)
    negative_count = sum(1 for kw in NEGATIVE_KEYWORDS[lang] if kw.lower() in text_lower)

    total = positive_count + negative_count
    if total == 0:
        sentiment, score = "neutral", 0.5
    else:
        score = positive_count / total
        if score > 0.6:
            sentiment = "positive"
        elif score < 0.4:
            sentiment = "distressed" if matched_distress else "negative"
        else:
            sentiment = "neutral"

    safety_flag = bool(matched_distress)
    return SafetyResult(
        safety_flag=safety_flag,
        safety_keywords=matched_distress,
        safety_message=_message(lang, "escalation" if safety_flag else "clear"),
        positive_signals=positive_count,
        negative_signals=negative_count,
        rule_based_sentiment=sentiment,
        rule_based_score=round(score, 3),
    )
