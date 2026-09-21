"""Longitudinal PPD screening layer.

This module implements the actual PPD screening objective: NLP-based
sentiment analysis on DAILY MOOD JOURNAL ENTRIES, aggregated over time,
combined with the PPD classifier's snapshot on the most recent entry.

It is a deterministic, rule-based aggregation on top of two real models:

    1. MoodAnalysisService  -> sentiment + safety flag for each journal entry
    2. PPDPredictor         -> binary postpartum vs no on the latest entry

Neither model is replaced or faked. The screening layer only *combines* their
outputs according to explicit, documented rules.

Screening rule (deterministic):

    urgent   : any entry triggered the crisis safety flag
    high     : negative_ratio >= 0.60 AND ppd_snapshot == positive_screen
    moderate : negative_ratio >= 0.60 OR  ppd_snapshot == positive_screen
    low      : otherwise

This is decision support only. It is NOT a diagnosis. Clinical judgement is
required before any action is taken on the result.

Language handling:
    The `language` field in the request (en | hi | kn) controls the language
    of the human-facing free-text fields (`recommendation`, `message`).
    Structured enum fields (`screening_level`, `trend`, per-entry `sentiment`)
    stay English so the frontend can map them to localized UI labels.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any, Optional

from app.models.mood_analyzer import MoodAnalysisService
from app.models.ppd import PPDPredictor

logger = logging.getLogger(__name__)


# --- Rule thresholds (documented, not hidden) ------------------------------

NEGATIVE_RATIO_THRESHOLD = 0.60      # >= 60% of entries classified negative
MIN_ENTRIES_FOR_TREND = 4            # need at least 4 entries to compute a trend


# --- Localized strings -----------------------------------------------------
#
# Structured enum values (screening_level, trend, per-entry sentiment) stay
# English so the frontend can translate them into localized UI labels.
# Only the free-text `recommendation` and `message` are localized here.

STRINGS: dict[str, dict[str, str]] = {
    "en": {
        "message_empty": (
            "Submit at least one mood journal entry to run PPD screening."
        ),
        "recommendation_empty": (
            "No journal entries submitted; screening cannot be computed."
        ),
        "message_completed": (
            "Longitudinal PPD screening completed. Decision-support only; "
            "not a diagnosis. Escalate to a clinician for any "
            "moderate/high/urgent result."
        ),
        "rec_urgent": (
            "Immediate escalation. Crisis language detected in at least one "
            "journal entry. Contact the patient and/or emergency support "
            "per protocol."
        ),
        "rec_high": (
            "Elevated postpartum depression signal: sustained negative "
            "sentiment combined with a positive PPD classifier result. "
            "Schedule a clinical review within 48 hours."
        ),
        "rec_moderate": (
            "Moderate postpartum depression signal. Continue monitoring; "
            "if the trend is worsening, schedule a clinical review this week."
        ),
        "rec_worsening_low": (
            "Screening level is low, but the sentiment trend is worsening. "
            "Continue daily journaling and reassess in 3-5 days."
        ),
        "rec_low": (
            "No elevated postpartum depression signal detected. "
            "Continue routine monitoring."
        ),
    },
    "hi": {
        "message_empty": (
            "पीपीडी स्क्रीनिंग के लिए कृपया कम से कम एक मूड जर्नल प्रविष्टि जमा करें।"
        ),
        "recommendation_empty": (
            "कोई जर्नल प्रविष्टि जमा नहीं की गई; स्क्रीनिंग की गणना नहीं की जा सकती।"
        ),
        "message_completed": (
            "दीर्घकालिक पीपीडी स्क्रीनिंग पूरी हुई। यह केवल निर्णय-सहायता है, "
            "निदान नहीं। मध्यम/उच्च/आपातकालीन परिणाम के लिए चिकित्सक से परामर्श करें।"
        ),
        "rec_urgent": (
            "तत्काल एस्केलेशन। कम से कम एक जर्नल प्रविष्टि में संकट की भाषा पाई गई। "
            "प्रोटोकॉल के अनुसार रोगी और/या आपातकालीन सहायता से संपर्क करें।"
        ),
        "rec_high": (
            "बढ़ा हुआ प्रसवोत्तर अवसाद संकेत: लगातार नकारात्मक भावना और "
            "पीपीडी क्लासिफायर का सकारात्मक परिणाम। 48 घंटे के भीतर नैदानिक समीक्षा करें।"
        ),
        "rec_moderate": (
            "मध्यम प्रसवोत्तर अवसाद संकेत। निगरानी जारी रखें; यदि प्रवृत्ति बिगड़ रही है, "
            "तो इस सप्ताह नैदानिक समीक्षा करें।"
        ),
        "rec_worsening_low": (
            "स्क्रीनिंग स्तर कम है, लेकिन भावना की प्रवृत्ति बिगड़ रही है। "
            "दैनिक जर्नलिंग जारी रखें और 3-5 दिनों में पुनः मूल्यांकन करें।"
        ),
        "rec_low": (
            "कोई बढ़ा हुआ प्रसवोत्तर अवसाद संकेत नहीं पाया गया। "
            "नियमित निगरानी जारी रखें।"
        ),
    },
    "kn": {
        "message_empty": (
            "ಪಿಪಿಡಿ ಸ್ಕ್ರೀನಿಂಗ್‌ಗಾಗಿ ದಯವಿಟ್ಟು ಕನಿಷ್ಠ ಒಂದು ಮೂಡ್ ಜರ್ನಲ್ ನಮೂದನ್ನು ಸಲ್ಲಿಸಿ."
        ),
        "recommendation_empty": (
            "ಯಾವುದೇ ಜರ್ನಲ್ ನಮೂದುಗಳನ್ನು ಸಲ್ಲಿಸಲಾಗಿಲ್ಲ; ಸ್ಕ್ರೀನಿಂಗ್ ಅನ್ನು ಲೆಕ್ಕಹಾಕಲು ಸಾಧ್ಯವಿಲ್ಲ."
        ),
        "message_completed": (
            "ರೇಖಾಂಶ ಪಿಪಿಡಿ ಸ್ಕ್ರೀನಿಂಗ್ ಪೂರ್ಣಗೊಂಡಿದೆ. ಇದು ನಿರ್ಧಾರ-ಬೆಂಬಲ ಮಾತ್ರ, "
            "ರೋಗನಿರ್ಣಯವಲ್ಲ. ಮಧ್ಯಮ/ಹೆಚ್ಚಿನ/ತುರ್ತು ಫಲಿತಾಂಶಕ್ಕೆ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ."
        ),
        "rec_urgent": (
            "ತಕ್ಷಣದ ಎಸ್ಕಲೇಶನ್. ಕನಿಷ್ಠ ಒಂದು ಜರ್ನಲ್ ನಮೂದಿನಲ್ಲಿ ಸಂಕಷ್ಟದ ಭಾಷೆ ಪತ್ತೆಯಾಗಿದೆ. "
            "ಪ್ರೋಟೋಕಾಲ್ ಪ್ರಕಾರ ರೋಗಿ ಮತ್ತು/ಅಥವಾ ತುರ್ತು ಸಹಾಯವನ್ನು ಸಂಪರ್ಕಿಸಿ."
        ),
        "rec_high": (
            "ಹೆಚ್ಚಿದ ಮಾತೃತ್ವಾನಂತರ ಖಿನ್ನತೆಯ ಸೂಚನೆ: ನಿರಂತರ ಋಣಾತ್ಮಕ ಭಾವನೆ ಮತ್ತು "
            "ಪಿಪಿಡಿ ವರ್ಗೀಕರಣಕಾರರ ಧನಾತ್ಮಕ ಫಲಿತಾಂಶ. 48 ಗಂಟೆಗಳ ಒಳಗೆ ವೈದ್ಯಕೀಯ ಪರಿಶೀಲನೆ ಮಾಡಿ."
        ),
        "rec_moderate": (
            "ಮಧ್ಯಮ ಮಾತೃತ್ವಾನಂತರ ಖಿನ್ನತೆಯ ಸೂಚನೆ. ಮೇಲ್ವಿಚಾರಣೆ ಮುಂದುವರಿಸಿ; "
            "ಪ್ರವೃತ್ತಿ ಹದಗೆಡುತ್ತಿದ್ದರೆ, ಈ ವಾರ ವೈದ್ಯಕೀಯ ಪರಿಶೀಲನೆ ಮಾಡಿ."
        ),
        "rec_worsening_low": (
            "ಸ್ಕ್ರೀನಿಂಗ್ ಮಟ್ಟ ಕಡಿಮೆಯಾಗಿದೆ, ಆದರೆ ಭಾವನೆಯ ಪ್ರವೃತ್ತಿ ಹದಗೆಡುತ್ತಿದೆ. "
            "ದೈನಂದಿನ ಜರ್ನಲಿಂಗ್ ಮುಂದುವರಿಸಿ ಮತ್ತು 3-5 ದಿನಗಳಲ್ಲಿ ಮರುಮೌಲ್ಯಮಾಪನ ಮಾಡಿ."
        ),
        "rec_low": (
            "ಯಾವುದೇ ಹೆಚ್ಚಿದ ಮಾತೃತ್ವಾನಂತರ ಖಿನ್ನತೆಯ ಸೂಚನೆ ಕಂಡುಬಂದಿಲ್ಲ. "
            "ನಿಯಮಿತ ಮೇಲ್ವಿಚಾರಣೆ ಮುಂದುವರಿಸಿ."
        ),
    },
}


def _s(lang: str, key: str) -> str:
    """Look up a localized string; fall back to English if key or lang missing."""
    return STRINGS.get(lang, STRINGS["en"]).get(key, STRINGS["en"].get(key, ""))


# --- Request / result structures -------------------------------------------

@dataclass
class JournalEntry:
    text: str
    recorded_at: Optional[str] = None  # ISO 8601 string, optional


@dataclass
class PPDScreeningResult:
    screening_level: str                  # low | moderate | high | urgent
    negative_ratio: float
    total_entries: int
    negative_count: int
    positive_count: int
    neutral_count: int
    trend: str                            # improving | stable | worsening | insufficient_data
    safety_flags_count: int
    ppd_snapshot_label: Optional[str]     # positive_screen | negative_screen | None
    ppd_snapshot_probability: Optional[float]
    evidence: list[dict[str, Any]] = field(default_factory=list)
    recommendation: str = ""
    message: str = ""
    model_versions: dict[str, Optional[str]] = field(default_factory=dict)


# --- Service ---------------------------------------------------------------

class PPDScreeningService:
    """Combine longitudinal mood signals with a PPD snapshot classifier."""

    def __init__(
        self,
        mood: Optional[MoodAnalysisService] = None,
        ppd: Optional[PPDPredictor] = None,
    ) -> None:
        self.mood = mood or MoodAnalysisService()
        self.ppd = ppd or PPDPredictor()

    @staticmethod
    def _classify_entry(mood_result: dict[str, Any]) -> str:
        label = (mood_result.get("sentiment") or "").lower()
        if label in {"positive", "negative", "neutral"}:
            return label
        if label == "distressed":
            return "negative"
        return "neutral"

    @staticmethod
    def _compute_trend(labels_in_order: list[str]) -> str:
        n = len(labels_in_order)
        if n < MIN_ENTRIES_FOR_TREND:
            return "insufficient_data"
        mid = n // 2
        first = labels_in_order[:mid]
        second = labels_in_order[mid:]

        def score(seq: list[str]) -> float:
            m = {"negative": -1, "neutral": 0, "positive": 1}
            return sum(m.get(x, 0) for x in seq) / max(len(seq), 1)

        delta = score(second) - score(first)
        if delta <= -0.3:
            return "worsening"
        if delta >= 0.3:
            return "improving"
        return "stable"

    @staticmethod
    def _screen_level(
        negative_ratio: float,
        snapshot_label: Optional[str],
        safety_triggered: bool,
    ) -> str:
        if safety_triggered:
            return "urgent"
        snapshot_positive = snapshot_label == "positive_screen"
        if negative_ratio >= NEGATIVE_RATIO_THRESHOLD and snapshot_positive:
            return "high"
        if negative_ratio >= NEGATIVE_RATIO_THRESHOLD or snapshot_positive:
            return "moderate"
        return "low"

    @staticmethod
    def _recommendation_key(level: str, trend: str) -> str:
        if level == "urgent":
            return "rec_urgent"
        if level == "high":
            return "rec_high"
        if level == "moderate":
            return "rec_moderate"
        if trend == "worsening":
            return "rec_worsening_low"
        return "rec_low"

    def screen(
        self,
        patient_id: Optional[str],
        entries: list[JournalEntry],
        language: str = "en",
    ) -> PPDScreeningResult:
        lang = language if language in STRINGS else "en"

        if not entries:
            return PPDScreeningResult(
                screening_level="low",
                negative_ratio=0.0,
                total_entries=0,
                negative_count=0,
                positive_count=0,
                neutral_count=0,
                trend="insufficient_data",
                safety_flags_count=0,
                ppd_snapshot_label=None,
                ppd_snapshot_probability=None,
                recommendation=_s(lang, "recommendation_empty"),
                message=_s(lang, "message_empty"),
                model_versions={"mood": None, "ppd": None},
            )

        # 1. Analyze each entry with the mood model.
        labels_in_order: list[str] = []
        evidence: list[dict[str, Any]] = []
        safety_hits = 0
        model_versions: dict[str, Optional[str]] = {"mood": None, "ppd": None}

        for i, entry in enumerate(entries):
            mood_result = self.mood.analyze(entry.text, language=lang)
            label = self._classify_entry(mood_result)
            labels_in_order.append(label)
            if mood_result.get("safety_flag"):
                safety_hits += 1
            if model_versions["mood"] is None:
                model_versions["mood"] = mood_result.get("model_version")
            evidence.append(
                {
                    "index": i,
                    "recorded_at": entry.recorded_at,
                    "sentiment": label,
                    "sentiment_score": mood_result.get("sentiment_score"),
                    "safety_flag": bool(mood_result.get("safety_flag")),
                    "safety_keywords": mood_result.get("safety_keywords", []),
                }
            )

        total = len(labels_in_order)
        negative_count = sum(1 for x in labels_in_order if x == "negative")
        positive_count = sum(1 for x in labels_in_order if x == "positive")
        neutral_count = sum(1 for x in labels_in_order if x == "neutral")
        negative_ratio = negative_count / total if total else 0.0
        trend = self._compute_trend(labels_in_order)

        # 2. PPD classifier on the latest entry.
        latest_text = entries[-1].text
        snapshot_label: Optional[str] = None
        snapshot_prob: Optional[float] = None
        try:
            from app.schemas.schemas import PPDScreeningInput

            ppd_input = PPDScreeningInput(text=latest_text, language=lang)
            ppd_result = self.ppd.predict(ppd_input)
            if ppd_result.get("model_status") == "MODEL_AVAILABLE":
                snapshot_label = ppd_result.get("prediction")
                snapshot_prob = ppd_result.get("probability")
                model_versions["ppd"] = ppd_result.get("model_version")
        except Exception as exc:  # pragma: no cover - defensive
            logger.warning("PPD snapshot inference failed: %s", exc)
            snapshot_label = None
            snapshot_prob = None

        # 3. Apply screening rule.
        level = self._screen_level(
            negative_ratio=negative_ratio,
            snapshot_label=snapshot_label,
            safety_triggered=safety_hits > 0,
        )

        # 4. Localized recommendation + message.
        rec_key = self._recommendation_key(level, trend)

        return PPDScreeningResult(
            screening_level=level,
            negative_ratio=round(negative_ratio, 4),
            total_entries=total,
            negative_count=negative_count,
            positive_count=positive_count,
            neutral_count=neutral_count,
            trend=trend,
            safety_flags_count=safety_hits,
            ppd_snapshot_label=snapshot_label,
            ppd_snapshot_probability=snapshot_prob,
            evidence=evidence,
            recommendation=_s(lang, rec_key),
            message=_s(lang, "message_completed"),
            model_versions=model_versions,
        )


# Module-level singleton for reuse from routers.
ppd_screening_service = PPDScreeningService()