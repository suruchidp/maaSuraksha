"""PPD Screening via fine-tuned DistilBERT text classifier.

Loads a real Hugging Face `AutoModelForSequenceClassification` artifact from
artifacts/ppd/model plus its tokenizer. Confidence = softmax over logits.
Severity labels come from the artifact's metadata.json (trained label order).

When the artifact is missing, the service reports MODEL_UNAVAILABLE. DistilBERT
is loaded lazily per request-group; the underlying model is never replaced by
a keyword heuristic or fabricated probabilities.

IMPORTANT — scope of this model:
    Trained on the Zenodo 'Multi-Class Depression Detection Dataset'
    (https://zenodo.org/records/14233292, CC BY 4.0). Labels were assigned via
    psychiatrist-verified lexicons. Post-hoc analysis showed the dataset's
    two classes differ on non-semantic features (@-mention rate 12.25% vs
    0.45%, mean length 162.7 vs 139.5 chars). The reported accuracy of ~0.99
    therefore reflects dataset separability, NOT clinical PPD detection
    performance. This model is a demonstration artifact only. See
    docs/PHASE4_TRAINING_REPORT.md for the full leakage investigation.
"""

import logging
from typing import Any

from app.ml import paths
from app.ml.exceptions import ModelUnavailableError
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
    """Map 'LABEL_N' (the HF numeric head id) to the human-readable label
    recorded in metadata.json['labels'][N]. If metadata is absent, identity."""
    md = metadata or {}
    human_labels = [str(x) for x in (md.get("labels") or [])]
    if not human_labels:
        return {}
    return {f"LABEL_{i}": label for i, label in enumerate(human_labels)}


class PPDPredictor(BaseModelService):
    def __init__(self) -> None:
        super().__init__("ppd")
        self._pipeline: Any | None = None
        self._labels: list[str] = ["no", "postpartum"]
        self._label_map: dict[str, str] = {}

    def _load(self) -> Any:
        if self._pipeline is not None:
            return self._pipeline
        md = self.ensure_available()
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

        try:
            raw = pipeline(text, truncation=True)
        except Exception as exc:  # pragma: no cover - defensive
            logger.error("PPD model inference failed: %s", exc)
            return self.unavailable_payload(f"PPD model inference failed: {exc}")

        scored_items = _normalize_pipeline_output(raw)
        if not scored_items:
            return {
                "model_status": "MODEL_UNAVAILABLE",
                "prediction": None,
                "probability": None,
                "risk_level": None,
                "shap_values": None,
                "model_version": None,
                "message": "PPD model returned no valid scores; refusing to guess.",
            }

        # Translate LABEL_N -> human label using metadata.
        translated: list[tuple[str, float]] = []
        for item in scored_items:
            raw_label = str(item.get("label", ""))
            human_label = self._label_map.get(raw_label, raw_label)
            translated.append((human_label, float(item.get("score", 0.0))))

        # Ensure every expected label is represented (defensive 0 fill).
        present = {lbl: sc for lbl, sc in translated}
        scored: list[tuple[str, float]] = [
            (label, present.get(label, 0.0)) for label in self._labels
        ]
        scored.sort(key=lambda pair: pair[1], reverse=True)
        top_label, top_score = scored[0]

        # For a binary PPD screen, present the positive-class probability.
        prob_postpartum = next((sc for lbl, sc in scored if lbl == "postpartum"), top_score)
        prediction = "positive_screen" if top_label == "postpartum" else "negative_screen"

        # RiskLevel enum in app/schemas/schemas.py permits only:
        # low | medium | high | critical
        # So we map "postpartum detected" -> "high", otherwise "low".
        risk_level = "high" if top_label == "postpartum" else "low"

        return {
            "model_status": "MODEL_AVAILABLE",
            "prediction": prediction,
            "probability": round(prob_postpartum, 6),
            "risk_level": risk_level,
            "shap_values": None,
            "model_version": self.model_version,
            "probabilities": {label: round(float(score), 6) for label, score in scored},
            "message": (
                f"PPD screen completed (model {self.model_version}). "
                "Demonstration model only — trained on lexicon-labelled tweets, "
                "not clinically validated. A positive screen is not a diagnosis."
            ),
        }