from fastapi import APIRouter

from ..schemas.schemas import MoodAnalysisInput, MoodAnalysisResult
from ..main import model_registry

router = APIRouter()


@router.post("/analyze", response_model=MoodAnalysisResult)
async def analyze_mood(input_data: MoodAnalysisInput):
    return model_registry["mood"].analyze(input_data.text, input_data.language)