"""ML-honesty regression tests.

The guarantees under test:
1. No prediction endpoints fabricate values when artifacts are absent.
2. Metadata claiming a model does NOT make an artifact servable (integrity).
3. Rule-based mood analysis is never presented as a trained model.
"""

import json
from pathlib import Path

from app.ml import paths
from app.models.maternal_risk import MaternalRiskService

VALID_MATERNAL = {
    "age": 28.0,
    "systolic_bp": 120.0,
    "diastolic_bp": 80.0,
    "blood_sugar": 90.0,
    "body_temp": 36.5,
    "heart_rate": 72.0,
    "bmi": 23.5,
    "gestational_week": 20.0,
    "hemoglobin": 11.5,
}


class _Input:
    def __init__(self, data):
        self.data = data

    def model_dump(self):
        return dict(self.data)


def test_no_fabricated_inference_when_artifacts_absent(fastapi_client):
    payloads = {
        "/api/v1/maternal-risk/predict": VALID_MATERNAL,
        "/api/v1/gdm/predict": {
            "age": 30.0, "bmi": 24.5, "fasting_glucose": 90.0,
            "gestational_week": 24.0, "family_history_diabetes": False,
            "previous_gdm": False,
        },
        "/api/v1/ppd/predict": {"text": "I feel down lately", "language": "en"},
    }
    for url, payload in payloads.items():
        body = fastapi_client.post(url, json=payload).json()
        assert body["model_status"] == "MODEL_UNAVAILABLE", url
        assert body["prediction"] is None, url
        assert body["probability"] is None, url
        assert body["shap_values"] is None, url
        assert body["model_version"] is None, url
        assert "not available" in body["message"], url


def test_metadata_alone_does_not_activate_model(tmp_path, monkeypatch):
    """A metadata.json that claims metrics must NOT fake availability."""
    meta = {
        "category": "maternal_risk",
        "version": "fake-v9",
        "trained_at": "2026-01-01T00:00:00Z",
        "model_name": "XGBClassifier",
        "artifact_type": "xgboost-classifier",
        "metrics": {"test": {"f1": 0.999}},
        "features": ["age"],
        "defaults": {"age": 28.0},
        "target": "risk",
        "data_fingerprint": "sha",
    }
    meta_dir = Path(tmp_path) / "maternal_risk"
    meta_dir.mkdir(parents=True, exist_ok=True)
    (meta_dir / "metadata.json").write_text(json.dumps(meta), encoding="utf-8")

    monkeypatch.setattr(paths, "artifacts_root", lambda: tmp_path)
    result = MaternalRiskService().predict(_Input(VALID_MATERNAL))
    assert result["model_status"] == "MODEL_UNAVAILABLE"
    assert result["probability"] is None
    assert "payload missing" in result["message"]


def test_mood_rule_based_is_never_mislabeled(fastapi_client):
    resp = fastapi_client.post(
        "/api/v1/mood/analyze", json={"text": "I am tired", "language": "en"}
    )
    body = resp.json()
    assert body["model_status"] == "RULE_BASED"
    assert body["model_version"] is None
    # Rule-based messages must disclose the lack of a trained model.
    assert "No trained mood model artifact" in body["message"]


def test_models_status_reports_honest_reasons(fastapi_client):
    body = fastapi_client.get("/api/v1/models/status").json()
    for entry in body["models"].values():
        assert entry["model_status"] in ("MODEL_AVAILABLE", "MODEL_UNAVAILABLE")
        if entry["model_status"] == "MODEL_UNAVAILABLE":
            assert entry["reason"] is not None