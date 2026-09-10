"""NLP (ppd/mood) service behaviour, incl. loaded-artifact path via a fake
transformers backend so the code path is exercised without downloading a
DistilBERT model or needing real torch.
"""

import json
import sys
from pathlib import Path

import pytest

from app.ml import paths
from app.models.mood_analyzer import MoodAnalysisService
from app.models.ppd import PPDPredictor


class _Input:
    def __init__(self, data):
        self.data = data

    def model_dump(self):
        return dict(self.data)

    @property
    def text(self):
        return self.data["text"]


class _StubLoader:
    @classmethod
    def from_pretrained(cls, *args, **kwargs):
        return object()


class _FakePipeline:
    def __init__(self, results):
        self.results = results

    def __call__(self, text, **kwargs):
        return self.results


class _FakeTransformers:
    def __init__(self, results):
        self._results = results
        self.AutoTokenizer = _StubLoader
        self.AutoModelForSequenceClassification = _StubLoader
        self.TextClassificationPipeline = lambda model, tokenizer, top_k=None, truncation=True: _FakePipeline(self._results)


def _write_nlp_artifact(category: str, root: Path, labels: list[str]) -> None:
    model_dir = Path(root) / category / "model"
    model_dir.mkdir(parents=True, exist_ok=True)
    (model_dir / "config.json").write_text("{}", encoding="utf-8")
    metadata = {
        "category": category,
        "version": "nlp-fixture-v1",
        "model_name": "distilbert-base-uncased",
        "artifact_type": "hf-text-classifier",
        "trained_at": "2026-01-01T00:00:00Z",
        "metrics": {"test": {"f1": 0.9}},
        "labels": labels,
    }
    (Path(root) / category / "metadata.json").write_text(json.dumps(metadata), encoding="utf-8")


def _patch_transformers(monkeypatch, results):
    monkeypatch.setitem(sys.modules, "transformers", _FakeTransformers(results))


def test_ppd_service_available_with_artifact(tmp_path, monkeypatch):
    _write_nlp_artifact("ppd", tmp_path, ["none", "mild", "moderate", "severe"])
    _patch_transformers(
        monkeypatch,
        [
            {"label": "severe", "score": 0.81},
            {"label": "moderate", "score": 0.10},
            {"label": "mild", "score": 0.05},
            {"label": "none", "score": 0.04},
        ],
    )
    monkeypatch.setattr(paths, "artifacts_root", lambda: tmp_path)
    result = PPDPredictor().predict(_Input({"text": "I cannot stop crying", "language": "en"}))
    assert result["model_status"] == "MODEL_AVAILABLE"
    assert result["prediction"] == "severe"
    assert result["probability"] == pytest.approx(0.81)
    assert result["model_version"] == "nlp-fixture-v1"


def test_ppd_service_unavailable(monkeypatch, tmp_path):
    monkeypatch.setattr(paths, "artifacts_root", lambda: tmp_path)
    result = PPDPredictor().predict(_Input({"text": "I cannot stop crying", "language": "en"}))
    assert result["model_status"] == "MODEL_UNAVAILABLE"
    assert result["probability"] is None


def test_mood_service_available_with_artifact(tmp_path, monkeypatch):
    _write_nlp_artifact("mood", tmp_path, ["negative", "neutral", "positive"])
    _patch_transformers(
        monkeypatch,
        [
            {"label": "positive", "score": 0.72},
            {"label": "neutral", "score": 0.20},
            {"label": "negative", "score": 0.08},
        ],
    )
    monkeypatch.setattr(paths, "artifacts_root", lambda: tmp_path)
    result = MoodAnalysisService().analyze("I feel wonderful and peaceful", "en")
    assert result["model_status"] == "MODEL_AVAILABLE"
    assert result["sentiment"] == "positive"
    assert result["safety_flag"] is False


def test_mood_service_crisis_flagged_even_when_model_available(tmp_path, monkeypatch):
    _write_nlp_artifact("mood", tmp_path, ["negative", "neutral", "positive"])
    _patch_transformers(
        monkeypatch,
        [
            {"label": "negative", "score": 0.90},
            {"label": "neutral", "score": 0.07},
            {"label": "positive", "score": 0.03},
        ],
    )
    monkeypatch.setattr(paths, "artifacts_root", lambda: tmp_path)
    result = MoodAnalysisService().analyze("I want to end my life tonight", "en")
    assert result["model_status"] == "MODEL_AVAILABLE"
    assert result["safety_flag"] is True


def test_mood_service_rule_based_fallback(tmp_path, monkeypatch):
    monkeypatch.setattr(paths, "artifacts_root", lambda: tmp_path)
    result = MoodAnalysisService().analyze("I am very anxious and worried", "en")
    assert result["model_status"] == "RULE_BASED"
    assert result["safety_flag"] is False
    assert result["model_version"] is None