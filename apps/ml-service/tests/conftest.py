import os
import sys
import tempfile
from pathlib import Path

TEST_ROOT = Path(tempfile.mkdtemp(prefix="maasuraksha-ml-test-"))
os.environ["ARTIFACTS_DIR"] = str(TEST_ROOT / "artifacts")  # stays EMPTY for API tests
os.environ["DATA_DIR"] = str(TEST_ROOT / "data")
os.environ["MODEL_DIR"] = str(TEST_ROOT / "models")
os.makedirs(os.environ["ARTIFACTS_DIR"], exist_ok=True)
os.makedirs(os.environ["DATA_DIR"], exist_ok=True)

_module_dir = Path(__file__).resolve().parent.parent
if str(_module_dir) not in sys.path:
    sys.path.insert(0, str(_module_dir))

import pytest  # noqa: E402

TOY_ROOT = TEST_ROOT / "toy_artifacts"

# Plausible clinical ranges so the synthetic model is fit on clinical-scale
# values. Realistic inputs (e.g. systolic 120 vs 190) then land in DIFFERENT
# regions of the trained model, so SHAP values genuinely vary between inputs.
# IMPORTANT: for `maternal_risk` the ranges are the MODEL-INTERNAL units the
# service feeds XGBoost AFTER boundary conversion — blood_sugar in mmol/L and
# body_temp in °F (the user-facing contract is mg/dL and °C; see
# app/ml/unit_conversion.py). The toy model must be trained in the same units
# it is served, otherwise synthetic SHAP/probability tests would be meaningless.
_CLINICAL_RANGES: dict[str, dict[str, tuple[float, float]]] = {
    "maternal_risk": {
        "age": (15.0, 45.0),
        "systolic_bp": (90.0, 185.0),
        "diastolic_bp": (60.0, 120.0),
        "blood_sugar": (4.0, 20.0),  # mmol/L (model internal; external is mg/dL)
        "body_temp": (95.0, 104.0),  # °F (model internal; external is °C)
        "heart_rate": (55.0, 115.0),
    },
    "gdm": {
        "age": (15.0, 45.0),
        "bmi": (17.0, 35.0),
        "hdl": (25.0, 70.0),
        "pregnancy_count": (1.0, 4.0),
        "previous_pregnancy_gestation": (0.0, 2.0),
        "family_history": (0.0, 1.0),
        "unexplained_prenatal_loss": (0.0, 1.0),
        "large_child_or_birth_defect": (0.0, 1.0),
        "pcos": (0.0, 1.0),
        "systolic_bp": (90.0, 185.0),
        "diastolic_bp": (60.0, 124.0),
        "hemoglobin": (8.8, 16.0),
        "sedentary_lifestyle": (0.0, 1.0),
    },
}


def _toy_tabular(category: str, n_samples: int = 600, seed: int = 7) -> None:
    """Fit a tiny real XGBoost on synthetic data and write a valid artifact.

    This is a TEST fixture (clearly marked synthetic), not a production model.
    It exists only to exercise loading / inference / SHAP code paths.
    Heavy imports (numpy/xgboost) are deferred so tests that do not need them
    can run even on machines where native wheels are blocked.
    """
    import numpy as np
    from xgboost import XGBClassifier

    from app.ml import tabular
    from scripts import common

    rng = np.random.default_rng(seed)
    names = tabular.feature_names(category)
    ranges = _CLINICAL_RANGES[category]
    spec = {f.name: f for f in tabular.FEATURE_SPECS[category]}
    X = np.empty((n_samples, len(names)), dtype=np.float32)
    for i, name in enumerate(names):
        lo, hi = ranges[name]
        if spec[name].kind == "bool":
            X[:, i] = (rng.uniform(lo, hi, size=n_samples) > 0.5).astype(float)
        else:
            X[:, i] = rng.uniform(lo, hi, size=n_samples)

    # Signal drawn from standardized features so thresholds are scale-free.
    mu = X.mean(axis=0)
    sd = X.std(axis=0)
    sd[sd == 0] = 1.0
    Xz = (X - mu) / sd
    y = (Xz[:, 0] + Xz[:, 1] * 0.5 + rng.normal(0, 0.5, size=n_samples) > 0.2).astype(int)

    defaults = tabular.compute_defaults(X, category)
    clf = XGBClassifier(
        n_estimators=30, max_depth=3, learning_rate=0.1, random_state=seed
    )
    clf.fit(X, y)

    target = "risk" if category == "maternal_risk" else "gdm"
    out_dir = TOY_ROOT
    model_path = out_dir / category / "model.xgb"
    model_path.parent.mkdir(parents=True, exist_ok=True)
    clf.save_model(str(model_path))

    prob_val = clf.predict_proba(X)[:, 1]
    pred = (prob_val >= 0.5).astype(int)
    metrics = {
        "validation": common.classification_scores(y, pred, prob_val),
        "test": common.classification_scores(y, pred, prob_val),
    }
    metadata = common.compose_tabular_metadata(
        category=category,
        version="test-fixture-v1",
        model_name="XGBClassifier",
        metrics=metrics,
        features=names,
        defaults=defaults,
        target=target,
        thresholds={"positive" if category == "gdm" else "high_risk": 0.5},
        params={"note": "synthetic test fixture"},
        data_fingerprint="synthetic-test-fixture",
        note="Synthetic test fixture. NOT a production model.",
    )
    common.write_metadata(category, out_dir, metadata)


@pytest.fixture(scope="session")
def toy_root() -> Path:
    return TOY_ROOT


@pytest.fixture(scope="session")
def toy_maternal_risk():
    _toy_tabular("maternal_risk")
    return TOY_ROOT


@pytest.fixture(scope="session")
def toy_gdm():
    _toy_tabular("gdm")
    return TOY_ROOT


@pytest.fixture(scope="session")
def fastapi_client():
    from fastapi.testclient import TestClient

    from app.main import app

    with TestClient(app) as client:
        yield client