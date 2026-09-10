from app.ml.mood_safety import analyze_safety


def test_english_crisis_detected():
    result = analyze_safety("I have been thinking about suicide and self-harm.", "en")
    assert result.safety_flag is True
    assert "suicide" in result.safety_keywords
    assert "SAFETY ESCALATION" in result.safety_message


def test_hindi_crisis_detected():
    result = analyze_safety("मैं आत्महत्या करना चाहती हूं।", "hi")
    assert result.safety_flag is True
    assert result.safety_keywords


def test_kannada_crisis_detected():
    result = analyze_safety("ನನಗೆ ಆತ್ಮಹತ್ಯೆ ಮಾಡಬೇಕು.", "kn")
    assert result.safety_flag is True


def test_positive_entry_not_flagged():
    result = analyze_safety("I feel happy and grateful today.", "en")
    assert result.safety_flag is False
    assert result.rule_based_sentiment == "positive"


def test_neutral_entry_not_flagged():
    result = analyze_safety("I drank a cup of tea this morning.", "en")
    assert result.safety_flag is False
    assert result.rule_based_sentiment == "neutral"


def test_unknown_language_falls_back_to_english():
    result = analyze_safety("I want to kill myself.", "fr")
    assert result.safety_flag is True


def test_output_contract():
    result = analyze_safety("content", "en").to_dict()
    assert set(result) == {
        "safety_flag", "safety_keywords", "safety_message", "positive_signals",
        "negative_signals", "rule_based_sentiment", "rule_based_score",
    }