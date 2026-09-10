import pandas as pd
import pytest

from scripts.common import DatasetError, load_dataset
from scripts.nlp_training import _load_text_dataset


def test_dataset_missing_raises(tmp_path, monkeypatch):
    from app.ml import paths

    monkeypatch.setattr(paths, "data_root", lambda: tmp_path)
    with pytest.raises(DatasetError, match="Dataset not found"):
        load_dataset(tmp_path / "dataset.csv", ["age"], "risk")


def test_dataset_missing_columns_raises(tmp_path):
    csv = tmp_path / "dataset.csv"
    pd.DataFrame({"age": [1, 2]}).to_csv(csv, index=False)
    with pytest.raises(DatasetError, match="missing required columns"):
        load_dataset(csv, ["age", "bmi"], "risk")


def test_dataset_valid(tmp_path):
    csv = tmp_path / "dataset.csv"
    pd.DataFrame({"age": [1, 2], "risk": [0, 1]}).to_csv(csv, index=False)
    df = load_dataset(csv, ["age"], "risk")
    assert len(df) == 2


def test_nlp_dataset_schema(tmp_path):
    csv = tmp_path / "data.csv"
    pd.DataFrame({"text": ["a", "b"], "label": ["none", "mild"]}).to_csv(csv, index=False)
    df, ordered, mapping = _load_text_dataset(csv)
    assert ordered == ["none", "mild"]
    assert mapping == {"none": 0, "mild": 1}
    assert "text" in df.columns and "_label_id" in df.columns