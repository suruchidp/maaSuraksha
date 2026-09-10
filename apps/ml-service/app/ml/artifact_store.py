"""Artifact store: discovery, integrity checks and status of trained model artifacts.

The service never trains. It only works with artifacts produced by the
training scripts under `scripts/`. An artifact counts as AVAILABLE only when
ALL of the following hold:

* the artifact directory for the category exists,
* the model payload exists (model.xgb for tabular models, a Hugging Face
  model dir for NLP models),
* a valid metadata.json exists with a real training run's fields.

Anything else -> MODEL_UNAVAILABLE. This is the single source of truth for
the ML-honesty guarantees of the service: we never invent an availability
state or a score.
"""

import json
from pathlib import Path
from typing import Any

from app.ml import paths

REQUIRED_METADATA_KEYS = (
    "version",
    "trained_at",
    "model_name",
    "metrics",
    "artifact_type",
)

TABULAR_EXTRA_KEYS = ("features", "defaults", "target", "data_fingerprint")
NLP_MODEL_FILE = "config.json"


def _safe_json(path: Path) -> dict[str, Any] | None:
    if not path.exists():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None
    return data if isinstance(data, dict) else None


def read_metadata(category: str) -> dict[str, Any] | None:
    return _safe_json(paths.metadata_path(category))


def _model_payload_exists(category: str) -> bool:
    if paths.is_tabular(category):
        return paths.model_file(category).exists()
    return (paths.nlp_model_dir(category) / NLP_MODEL_FILE).exists()


def artifact_status(category: str) -> tuple[bool, str]:
    """Return (available, reason). Reason is empty when available."""
    try:
        md = _safe_json(paths.metadata_path(category))
    except OSError:
        md = None
    if md is None:
        return False, "model artifact metadata missing"
    if not _model_payload_exists(category):
        return False, "model artifact payload missing"
    missing = [k for k in REQUIRED_METADATA_KEYS if k not in md]
    if paths.is_tabular(category):
        missing += [k for k in TABULAR_EXTRA_KEYS if k not in md]
    if missing:
        return False, f"model artifact metadata incomplete (missing: {', '.join(sorted(missing))})"
    if not isinstance(md.get("metrics"), dict):
        return False, "model artifact metrics missing or invalid"
    return True, ""


def is_available(category: str) -> bool:
    return artifact_status(category)[0]


def all_statuses() -> dict[str, dict[str, Any]]:
    out: dict[str, dict[str, Any]] = {}
    for name in paths.CATEGORIES:
        available, reason = artifact_status(name)
        md = read_metadata(name)
        out[name] = {
            "model_status": "MODEL_AVAILABLE" if available else "MODEL_UNAVAILABLE",
            "reason": reason or None,
            "version": (md or {}).get("version"),
            "artifact_type": (md or {}).get("artifact_type"),
            "trained_at": (md or {}).get("trained_at"),
        }
    return out


def ensure_available(category: str) -> None:
    """Raise ModelUnavailableError unless the artifact is genuinely ready."""
    from app.ml.exceptions import ModelUnavailableError

    available, reason = artifact_status(category)
    if not available:
        raise ModelUnavailableError(reason)