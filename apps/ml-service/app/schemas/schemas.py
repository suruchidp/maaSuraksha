from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class PredictionResult(BaseModel):
    model_status: str = Field(
        description="MODEL_AVAILABLE or MODEL_UNAVAILABLE"
    )
    prediction: str | None = None
    probability: float | None = None
    risk_level: RiskLevel | None = None
    shap_values: dict[str, float] | None = None
    model_version: str | None = None
    probabilities: dict[str, float] | None = None
    message: str = ""


class MaternalRiskInput(BaseModel):
    """Maternal Health Risk inputs — EXTERNAL / APPLICATION units.

    The user-facing contract expresses blood glucose in mg/dL and body
    temperature in degrees Celsius (all bounds below are in those EXTERNAL
    units). The saved UCI model was trained in INTERNAL units (blood_sugar in
    mmol/L, body_temp in °F); MaternalRiskService.predict converts mg/dL ->
    mmol/L and °C -> °F exactly once at the model-input boundary (see
    app/ml/unit_conversion.py). bmi/gestational_week/hemoglobin are recorded
    in patient records but are NOT model features.
    """

    age: float = Field(ge=10, le=100, description="Maternal age (years)")
    systolic_bp: float = Field(
        ge=50, le=300, description="Systolic blood pressure (mmHg)"
    )
    diastolic_bp: float = Field(
        ge=20, le=200, description="Diastolic blood pressure (mmHg)"
    )
    blood_sugar: float = Field(
        ge=20,
        le=500,
        description="Blood glucose (mg/dL, external) — converted to mmol/L before inference",
    )
    body_temp: float = Field(
        ge=35,
        le=42,
        description="Body temperature (°C, external) — converted to °F before inference",
    )
    heart_rate: float = Field(ge=30, le=250, description="Heart rate (bpm)")
    bmi: float = Field(ge=10, le=60, description="BMI — recorded, NOT a model feature")
    gestational_week: float = Field(
        ge=1, le=42, description="Gestational week — recorded, NOT a model feature"
    )
    hemoglobin: float | None = Field(
        default=None, ge=2, le=25, description="Hemoglobin (g/dL) — recorded, NOT a model feature"
    )


class GDMInput(BaseModel):
    """Early GDM risk assessment inputs (Stage 1, decision support, NOT a diagnosis).

    Only variables available BEFORE diagnostic glucose testing are accepted.
    Fasting/postprandial glucose and HbA1c are Stage 2 clinical measurements
    and are deliberately NOT part of this model input. bmi/hdl/systolic_bp/
    hemoglobin are optional: when absent, the serving layer imputes the
    median value learned on the training split (metadata `defaults`).
    """

    age: float = Field(ge=10, le=100)
    bmi: float | None = Field(default=None, ge=10, le=60)
    hdl: float | None = Field(default=None, ge=5, le=150)
    pregnancy_count: float = Field(ge=1, le=10)
    previous_pregnancy_gestation: float = Field(ge=0, le=10)
    family_history: bool = False
    unexplained_prenatal_loss: bool = False
    large_child_or_birth_defect: bool = False
    pcos: bool = False
    systolic_bp: float | None = Field(default=None, ge=50, le=300)
    diastolic_bp: float = Field(ge=20, le=200)
    hemoglobin: float | None = Field(default=None, ge=2, le=25)
    sedentary_lifestyle: bool = False


class PPDScreeningInput(BaseModel):
    text: str = Field(min_length=1, max_length=5000)
    language: str = Field(default="en", pattern="^(en|hi|kn)$")


class MoodAnalysisInput(BaseModel):
    text: str = Field(min_length=1, max_length=2000)
    language: str = Field(default="en", pattern="^(en|hi|kn)$")


class MoodAnalysisResult(BaseModel):
    model_status: str
    sentiment: str | None = None
    sentiment_score: float | None = None
    safety_flag: bool
    safety_keywords: list[str] = Field(default_factory=list)
    safety_message: str = ""
    positive_signals: int = 0
    negative_signals: int = 0
    model_version: str | None = None
    message: str = ""


class HealthCheckResponse(BaseModel):
    status: str
    service: str
    version: str
    models: dict[str, dict[str, Any]]


class ModelStatusEntry(BaseModel):
    model_status: str
    reason: str | None = None
    version: str | None = None
    artifact_type: str | None = None
    model_name: str | None = None
    trained_at: str | None = None


class ModelsStatusResponse(BaseModel):
    models: dict[str, ModelStatusEntry]