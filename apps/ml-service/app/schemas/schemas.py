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
    age: float = Field(ge=10, le=100)
    systolic_bp: float = Field(ge=50, le=300)
    diastolic_bp: float = Field(ge=20, le=200)
    blood_sugar: float = Field(ge=20, le=500)
    body_temp: float = Field(ge=35, le=42)
    heart_rate: float = Field(ge=30, le=250)
    bmi: float = Field(ge=10, le=60)
    gestational_week: float = Field(ge=1, le=42)
    hemoglobin: float | None = Field(default=None, ge=2, le=25)


class GDMInput(BaseModel):
    age: float = Field(ge=10, le=100)
    bmi: float = Field(ge=10, le=60)
    fasting_glucose: float = Field(ge=20, le=500)
    postprandial_glucose: float | None = Field(default=None, ge=20, le=700)
    hba1c: float | None = Field(default=None, ge=3, le=15)
    gestational_week: float = Field(ge=1, le=42)
    family_history_diabetes: bool = False
    previous_gdm: bool = False


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