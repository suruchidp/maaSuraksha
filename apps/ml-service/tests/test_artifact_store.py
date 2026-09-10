import json
from pathlib import Path

import pytest

from app.ml import artifact_store


@pytest.fixture()
def _clean_dir(tmp_path, monkeypatch):
    monkeypatch.setattr(artifact_store.paths, "artifacts_root", lambda: tmp_path)
    return tmp_path


def _write_metadata(category: str, root: Path, partial: bool = False) -> Path:
    meta = {
        "category": category,
        "version": "v1",
        "trained_at": "2026-01-01T00:00:00Z",
        "model_name": "XGBClassifier",
        "artifact_type": "xgboost-classifier",
        "metrics": {"test": {"f1": 0.8}},
        "features": ["age"],
        "defaults": {"age": 28.0},
        "target": "risk",
        "data_fingerprint": "abc",
    }
    if partial:
        for key in ("features", "defaults", "target"):
            meta.pop(key, None)
    path = root / category / "metadata.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(meta), encoding="utf-8")
    return path


def test_missing_artifact_unavailable(_clean_dir):
    assert artifact_store.is_available("maternal_risk") is False
    ok, reason = artifact_store.artifact_status("maternal_risk")
    assert ok is False
    assert reason


def test_metadata_without_payload_unavailable(_clean_dir):
    _write_metadata("maternal_risk", _clean_dir)
    ok, _ = artifact_store.artifact_status("maternal_risk")
    assert ok is False


def test_partial_metadata_unavailable(_clean_dir):
    _write_metadata("maternal_risk", _clean_dir, partial=True)
    (Path(_clean_dir) / "maternal_risk" / "model.xgb").write_bytes(b"fake")
    ok, reason = artifact_store.artifact_status("maternal_risk")
    assert ok is False
    assert "incomplete" in reason


def test_invalid_json_metadata_unavailable(_clean_dir):
    path = Path(_clean_dir) / "maternal_risk" / "metadata.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("{not json", encoding="utf-8")
    (Path(_clean_dir) / "maternal_risk" / "model.xgb").write_bytes(b"fake")
    assert artifact_store.is_available("maternal_risk") is False


def test_full_tabular_artifact_available(tmp_path, monkeypatch):
    monkeypatch.setattr(artifact_store.paths, "artifacts_root", lambda: tmp_path)
    _write_metadata("maternal_risk", tmp_path)
    (tmp_path / "maternal_risk" / "model.xgb").write_bytes(b"fake")
    assert artifact_store.is_available("maternal_risk") is True


def test_nlp_artifact_needs_hf_dir(_clean_dir):
    (Path(_clean_dir) / "ppd" / "model").mkdir(parents=True)
    (Path(_clean_dir) / "ppd" / "metadata.json").write_text(
        json.dumps({
            "category": "ppd",
            "version": "v1",
            "trained_at": "2026-01-01T00:00:00Z",
            "model_name": "distilbert-base-uncased",
            "artifact_type": "hf-text-classifier",
            "metrics": {"test": {"f1": 0.8}},
            "labels": ["none", "mild"],
        }),
        encoding="utf-8",
    )
    # no model/config.json => unavailable
    assert artifact_store.is_available("ppd") is False
    (Path(_clean_dir) / "ppd" / "model" / "config.json").write_text("{}", encoding="utf-8")
    assert artifact_store.is_available("ppd") is True


def test_all_statuses_shape():
    statuses = artifact_store.all_statuses()
    assert set(statuses) == {"maternal_risk", "gdm", "ppd", "mood"}
    assert statuses["ppd"]["model_status"] == "MODEL_UNAVAILABLE"