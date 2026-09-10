"""FastAPI endpoint behaviour for the FastAPI service (no artifacts present)."""
import pytest

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


def test_health_endpoint(fastapi_client):
    resp = fastapi_client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert set(body["models"]) == {"maternal_risk", "gdm", "ppd", "mood"}


def test_models_status_endpoint(fastapi_client):
    resp = fastapi_client.get("/api/v1/models/status")
    assert resp.status_code == 200
    body = resp.json()
    for name, entry in body["models"].items():
        assert entry["model_status"] in ("MODEL_AVAILABLE", "MODEL_UNAVAILABLE")


def test_maternal_risk_unavailable_without_artifact(fastapi_client):
    resp = fastapi_client.post("/api/v1/maternal-risk/predict", json=VALID_MATERNAL)
    assert resp.status_code == 200
    body = resp.json()
    assert body["model_status"] == "MODEL_UNAVAILABLE"
    assert body["prediction"] is None
    assert body["probability"] is None
    assert body["shap_values"] is None


def test_gdm_unavailable_without_artifact(fastapi_client):
    resp = fastapi_client.post("/api/v1/gdm/predict", json=VALID_GDM)
    assert resp.status_code == 200
    assert resp.json()["model_status"] == "MODEL_UNAVAILABLE"


def test_ppd_unavailable_without_artifact(fastapi_client):
    resp = fastapi_client.post(
        "/api/v1/ppd/predict", json={"text": "I feel awful every day", "language": "en"}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["model_status"] == "MODEL_UNAVAILABLE"
    assert body["prediction"] is None


def test_mood_returns_rule_based_without_artifact(fastapi_client):
    resp = fastapi_client.post(
        "/api/v1/mood/analyze", json={"text": "I felt happy today", "language": "en"}
    )
    assert resp.status_code == 200
    body = resp.json()
    # Honest: rule-based labelled, never claims a trained model.
    assert body["model_status"] == "RULE_BASED"
    assert body["safety_flag"] is False
    assert body["model_version"] is None


def test_mood_crisis_flagged_rule_based_without_artifact(fastapi_client):
    resp = fastapi_client.post(
        "/api/v1/mood/analyze",
        json={"text": "I think about suicide every night", "language": "en"},
    )
    body = resp.json()
    assert body["model_status"] == "RULE_BASED"
    assert body["safety_flag"] is True
    assert body["safety_keywords"]


def test_invalid_input_returns_422(fastapi_client):
    payload = dict(VALID_MATERNAL)
    payload["bmi"] = 999  # out of range
    resp = fastapi_client.post("/api/v1/maternal-risk/predict", json=payload)
    assert resp.status_code == 422


def test_invalid_ppd_language_returns_422(fastapi_client):
    resp = fastapi_client.post(
        "/api/v1/ppd/predict", json={"text": "hello", "language": "fr"}
    )
    assert resp.status_code == 422