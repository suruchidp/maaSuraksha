import pytest

from app.ml import paths
from app.models.maternal_risk import MaternalRiskService
from app.models.gdm import GDMService

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

VALID_GDM = {
    "age": 30.0,
    "bmi": 24.5,
    "fasting_glucose": 90.0,
    "postprandial_glucose": 140.0,
    "hba1c": 5.2,
    "gestational_week": 24.0,
    "family_history_diabetes": False,
    "previous_gdm": False,
}


class _Input:
    def __init__(self, data):
        self.data = data

    def model_dump(self):
        return dict(self.data)


def test_maternal_risk_load_and_predict(toy_maternal_risk, monkeypatch):
    monkeypatch.setattr(paths, "artifacts_root", lambda: toy_maternal_risk)
    service = MaternalRiskService()
    result = service.predict(_Input(VALID_MATERNAL))
    assert result["model_status"] == "MODEL_AVAILABLE"
    assert result["model_version"] == "test-fixture-v1"
    assert result["prediction"] in ("high", "low")
    assert 0.0 <= result["probability"] <= 1.0
    assert result["risk_level"] in ("low", "high", "critical")
    assert result["shap_values"] is not None


def test_gdm_load_and_predict(toy_gdm, monkeypatch):
    monkeypatch.setattr(paths, "artifacts_root", lambda: toy_gdm)
    service = GDMService()
    result = service.predict(_Input(VALID_GDM))
    assert result["model_status"] == "MODEL_AVAILABLE"
    assert result["prediction"] in ("positive", "negative")
    assert 0.0 <= result["probability"] <= 1.0


def test_service_reports_unavailable_without_artifact(monkeypatch, tmp_path):
    """Regression: no availability is ever implied before a real artifact exists."""
    monkeypatch.setattr(paths, "artifacts_root", lambda: tmp_path)
    from app.models.gdm import GDMService

    service = GDMService()
    result = service.predict(_Input(VALID_GDM))
    assert result["model_status"] == "MODEL_UNAVAILABLE"
    assert result["prediction"] is None
    assert result["probability"] is None