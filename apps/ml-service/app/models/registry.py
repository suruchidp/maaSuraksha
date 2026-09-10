"""Model registry: the set of model services served by this application.

Kept in its own module so routers can import the registry without creating a
circular import with app.main.
"""

from .gdm import GDMService
from .maternal_risk import MaternalRiskService
from .mood_analyzer import MoodAnalysisService
from .ppd import PPDPredictor

model_registry = {
    "maternal_risk": MaternalRiskService(),
    "gdm": GDMService(),
    "ppd": PPDPredictor(),
    "mood": MoodAnalysisService(),
}