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


def _normalize_pipeline_output(results: Any) -> list[dict[str, Any]]:
    """Normalize a transformers TextClassificationPipeline output to a flat
    list of {'label': str, 'score': float} dicts.

    transformers 4.x returns [{'label':..., 'score':...}, ...] for a single
    input. transformers 5.x returns [[{'label':..., ...}, ...]] (one inner
    list per input). This handles both.
    """
    if results is None:
        return []
    if isinstance(results, dict):
        return [results]
    if isinstance(results, list):
        if not results:
            return []
        first = results[0]
        if isinstance(first, dict):
            return [r for r in results if isinstance(r, dict)]
        if isinstance(first, list):
            flat: list[dict[str, Any]] = []
            for item in first:
                if isinstance(item, dict):
                    flat.append(item)
            return flat
    return []


def _build_label_map(metadata: dict[str, Any] | None) -> dict[str, str]:
    """Build a pipeline-label -> human-label map.

    HuggingFace assigns numeric ids to the classification head. The pipeline
    exposes them as 'LABEL_0', 'LABEL_1', ... The metadata records the
    human-readable label order in `labels` (index == id). We build the
    translation table from that. If metadata is missing or incomplete, fall
    back to identity (i.e. the pipeline labels as-is).
    """
    md = metadata or {}
    human_labels = [str(x) for x in (md.get("labels") or [])]
    if not human_labels:
        return {}
    return {f"LABEL_{i}": label for i, label in enumerate(human_labels)}


class MoodAnalysisService(BaseModelService):
    def __init__(self) -> None:
        super().__init__("mood")
        self._model: Any | None = None
        # Populated at load time from metadata; fallback used only if artifact
        # metadata is missing (shouldn't happen when artifact_available()).
        self._labels: list[str] = ["negative", "neutral", "positive"]
        self._label_map: dict[str, str] = {}

    def _load(self) -> Any | None:
        if not self.artifact_available():
            return None
        if self._model is not None:
            return self._model
        md = self.metadata or {}
        self._labels = [str(x) for x in (md.get("labels") or self._labels)]
        self._label_map = _build_label_map(md)
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
            raw = pipeline(text, truncation=True)
        except Exception as exc:  # pragma: no cover - defensive
            logger.error("Mood model inference failed: %s", exc)
            return self._rule_based_response(text, language, safety)

        scored_items = _normalize_pipeline_output(raw)
        if not scored_items:
            return self._rule_based_response(text, language, safety)

        # Translate pipeline labels (LABEL_0, LABEL_1, ...) into human labels.
        # If metadata didn't provide a map, leave the label as-is.
        translated: list[tuple[str, float]] = []
        for item in scored_items:
            raw_label = str(item.get("label", ""))
            human_label = self._label_map.get(raw_label, raw_label)
            translated.append((human_label, float(item.get("score", 0.0))))

        # Ensure every expected label is represented (defensive fill with 0).
        present = {lbl: sc for lbl, sc in translated}
        scored: list[tuple[str, float]] = [
            (label, present.get(label, 0.0)) for label in self._labels
        ]
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