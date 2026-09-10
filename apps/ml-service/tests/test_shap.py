from app.ml import paths, tabular
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


def test_shap_values_present_and_grounded_in_features(toy_maternal_risk, monkeypatch):
    monkeypatch.setattr(paths, "artifacts_root", lambda: toy_maternal_risk)
    service = MaternalRiskService()
    result = service.predict(_Input(VALID_MATERNAL))
    shap_values = result["shap_values"]
    assert shap_values is not None
    feature_set = set(tabular.feature_names("maternal_risk"))
    assert set(shap_values.keys()) <= feature_set
    assert all(isinstance(v, float) for v in shap_values.values())


def test_shap_absent_when_model_unavailable(tmp_path, monkeypatch):
    monkeypatch.setattr(paths, "artifacts_root", lambda: tmp_path)
    service = MaternalRiskService()
    result = service.predict(_Input(VALID_MATERNAL))
    assert result["model_status"] == "MODEL_UNAVAILABLE"
    assert result["shap_values"] is None


def test_shap_values_from_real_model_not_static(toy_maternal_risk, monkeypatch):
    """Different inputs produce different SHAP (values are computed, not canned)."""
    monkeypatch.setattr(paths, "artifacts_root", lambda: toy_maternal_risk)
    service = MaternalRiskService()
    a = service.predict(_Input(VALID_MATERNAL))["shap_values"]
    b = service.predict(_Input({**VALID_MATERNAL, "systolic_bp": 190.0, "blood_sugar": 300.0}))["shap_values"]
    assert a is not None and b is not None
    assert a != b