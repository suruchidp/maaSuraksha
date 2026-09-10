"""Mood Monitoring (DistilBERT emotion classifier + rule-based safety).

- Safety detection is ALWAYS run: it is a deterministic heuristic
  (app/ml/mood_safety.py) and is reported separately from any model output.
- Sentiment/emotion: when a real DistilBERT artifact exists in
  artifacts/mood/model, a MODEL_AVAILABLE analysis is returned. Otherwise we
  fall back to the transparent RULE_BASED heuristic and label it as such.

Nothing here claims a trained model unless the artifact genuinely exists.
"""

import logging
from typing import Any

from app.ml import paths
from app.ml.exceptions import ModelUnavailableError
from app.ml.mood_safety import analyze_safety
from app.models.base_model import BaseModelService

logger = logging.getLogger(__name__)


class MoodAnalysisService(BaseModelService):
    def __init__(self) -> None:
        super().__init__("mood")
        self._model: Any | None = None
        self._labels: list[str] = ["negative", "neutral", "positive"]

    def _load(self) -> Any | None:
        if not self.artifact_available():
            return None
        if self._model is not None:
            return self._model
        md = self.metadata or {}
        self._labels = [str(x) for x in (md.get("labels") or self._labels)]
        model_dir = paths.nlp_model_dir(self.name)
        try:
            from transformers import (
                AutoModelForSequenceClassification,
                AutoTokenizer,
                TextClassificationPipeline,
            )

            tokenizer = AutoTokenizer.from_pretrained(str(model_dir))
            model = AutoModelForSequenceClassification.from_pretrained(str(model_dir))
            pipeline = TextClassificationPipeline(
                model=model, tokenizer=tokenizer, top_k=None
            )
            self._model = pipeline
            logger.info(
                "Loaded mood DistilBERT model %s from %s", md.get("version"), model_dir
            )
            return pipeline
        except Exception as exc:  # pragma: no cover - defensive
            logger.error("Failed to load mood model: %s", exc)
            self._model = None
            raise ModelUnavailableError(f"failed to load mood artifact: {exc}")

    def analyze(self, text: str, language: str = "en") -> dict[str, Any]:
        safety = analyze_safety(text, language).to_dict()

        try:
            pipeline = self._load()
        except ModelUnavailableError:
            return self._rule_based_response(text, language, safety)

        if pipeline is None:
            return self._rule_based_response(text, language, safety)

        try:
            results = pipeline(text, truncation=True)
        except Exception as exc:  # pragma: no cover - defensive
            logger.error("Mood model inference failed: %s", exc)
            return self._rule_based_response(text, language, safety)

        scored: list[tuple[str, float]] = []
        label_to_score = {str(r["label"]): float(r["score"]) for r in results}
        for label in self._labels:
            score = label_to_score.get(label, 0.0)
            scored.append((label, score))
        scored.sort(key=lambda pair: pair[1], reverse=True)
        top_label, top_score = scored[0]

        return {
            "model_status": "MODEL_AVAILABLE",
            "sentiment": top_label,
            "sentiment_score": round(top_score, 6),
            "safety_flag": safety["safety_flag"],
            "safety_keywords": safety["safety_keywords"],
            "safety_message": safety["safety_message"],
            "positive_signals": safety["positive_signals"],
            "negative_signals": safety["negative_signals"],
            "model_version": self.model_version,
            "message": (
                "SAFETY ESCALATION: Distress content detected. If you or someone "
                "you know is in crisis, please seek immediate professional help."
                if safety["safety_flag"]
                else "Mood analysis completed by trained model."
            ),
        }

    def _rule_based_response(self, text: str, language: str, safety: dict) -> dict[str, Any]:
        return {
            "model_status": "RULE_BASED",
            "sentiment": safety["rule_based_sentiment"],
            "sentiment_score": safety["rule_based_score"],
            "safety_flag": safety["safety_flag"],
            "safety_keywords": safety["safety_keywords"],
            "safety_message": safety["safety_message"],
            "positive_signals": safety["positive_signals"],
            "negative_signals": safety["negative_signals"],
            "model_version": None,
            "message": (
                "SAFETY ESCALATION: Distress content detected. If you or someone "
                "you know is in crisis, please seek immediate professional help."
                if safety["safety_flag"]
                else (
                    "No trained mood model artifact found; keyword-based analysis "
                    "returned (labelled RULE_BASED). Train and deploy a model for "
                    "model-backed mood analysis."
                )
            ),
        }