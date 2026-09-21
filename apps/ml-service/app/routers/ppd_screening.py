"""Router for the longitudinal PPD screening endpoint.

POST /api/v1/ppd/screen
"""

from typing import List, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from ..services.ppd_screening import (
    JournalEntry,
    ppd_screening_service,
)

router = APIRouter()


class JournalEntryIn(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    recorded_at: Optional[str] = Field(default=None)


class PPDScreenRequest(BaseModel):
    patientId: Optional[str] = None
    language: str = Field(default="en", pattern="^(en|hi|kn)$")
    entries: List[JournalEntryIn] = Field(..., min_length=1)


class PPDScreenResponse(BaseModel):
    screening_level: str
    negative_ratio: float
    total_entries: int
    negative_count: int
    positive_count: int
    neutral_count: int
    trend: str
    safety_flags_count: int
    ppd_snapshot_label: Optional[str] = None
    ppd_snapshot_probability: Optional[float] = None
    evidence: List[dict]
    recommendation: str
    message: str
    model_versions: dict


@router.post("/screen", response_model=PPDScreenResponse)
async def ppd_screen(request: PPDScreenRequest) -> PPDScreenResponse:
    entries = [JournalEntry(text=e.text, recorded_at=e.recorded_at) for e in request.entries]
    result = ppd_screening_service.screen(
        patient_id=request.patientId,
        entries=entries,
        language=request.language,
    )
    return PPDScreenResponse(
        screening_level=result.screening_level,
        negative_ratio=result.negative_ratio,
        total_entries=result.total_entries,
        negative_count=result.negative_count,
        positive_count=result.positive_count,
        neutral_count=result.neutral_count,
        trend=result.trend,
        safety_flags_count=result.safety_flags_count,
        ppd_snapshot_label=result.ppd_snapshot_label,
        ppd_snapshot_probability=result.ppd_snapshot_probability,
        evidence=result.evidence,
        recommendation=result.recommendation,
        message=result.message,
        model_versions=result.model_versions,
    )