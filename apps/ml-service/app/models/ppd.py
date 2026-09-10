"""PPD Screening via fine-tuned DistilBERT text classifier.

Loads a real Hugging Face `AutoModelForSequenceClassification` artifact from
artifacts/ppd/model plus its tokenizer. Confidence = softmax over logits.
Severity labels come from the artifact's metadata.json (trained label order).

When the artifact is missing, the service reports MODEL_UNAVAILABLE. DistilBERT
is loaded lazily per request-group; the underlying model is never replaced by
a keyword heuristic or fabricated probabilities.
"""

import logging
from typing import Any

from app.ml import paths
from app.ml.exceptions import ModelUnavailableError
from app.models.base_model import BaseModelService

logger = logging.getLogger(__name__)


class PPDPredictor(BaseModelService):
    def __init__(self) -> None:
        super().__init__("ppd")
        self._pipeline: Any | None = None
        self._labels: list[str] = ["none", "mild", "moderate", "severe"]

    def _load(self) -> Any:
        if self._pipeline is not None:
            return self._pipeline
        md = self.ensure_available()
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
            self._pipeline = pipeline
            logger.info(
                "Loaded ppd DistilBERT model %s from %s", md.get("version"), model_dir
            )
            return pipeline
        except Exception as exc:  # pragma: no cover - defensive
            logger.error("Failed to load ppd model: %s", exc)
            self._pipeline = None
            raise ModelUnavailableError(f"failed to load ppd artifact: {exc}")

    def predict(self, input_data: Any) -> dict[str, Any]:
        try:
            pipeline = self._load()
        except ModelUnavailableError:
            return self.unavailable_payload()

        text = input_data.text.strip()
        if not text:
            return self.unavailable_payload("No screening text provided for PPD analysis.")

        results = pipeline(text, truncation=True)
        label_to_score: dict[str, float] = {
            str(item["label"]): float(item["score"]) for item in results
        }
        # Map raw model labels onto the severity vocabulary documented in
        # the artifact metadata (fall back to index-based mapping).
        scored: list[tuple[str, float]] = []
        for idx, label in enumerate(self._labels):
            score = label_to_score.get(label)
            if score is None:
                score = label_to_score.get(str(idx), 0.0)
            scored.append((label, score))
        if not scored:
            return {
                "model_status": "MODEL_UNAVAILABLE",
                "prediction": None,
                "probability": None,
                "risk_level": None,
                "shap_values": None,
                "model_version": None,
                "message": "PPD model returned no valid labels; refusing to guess.",
            }
        scored.sort(key=lambda pair: pair[1], reverse=True)
        top_label, top_score = scored[0]

        return {
            "model_status": "MODEL_AVAILABLE",
            "prediction": top_label,
            "probability": round(top_score, 6),
            "risk_level": top_label,
            "shap_values": None,
            "model_version": self.model_version,
            "probabilities": {label: round(float(score), 6) for label, score in scored},
            "message": (
                f"PPD screening completed (model {self.model_version}). A positive "
                "screen is not a diagnosis; consult a qualified professional."
            ),
        }