from langdetect import detect, DetectorFactory
from langdetect.lang_detect_exception import LangDetectException

# For consistent results
DetectorFactory.seed = 0

def detect_language(text: str) -> str:
    """
    Detects the language of the given text.
    Returns 'unknown' if detection fails or text is empty.
    """
    if not text or not text.strip():
        return "unknown"
    
    try:
        # Detect using a sample of the text to improve performance on large texts
        sample_text = text[:1000]
        return detect(sample_text)
    except LangDetectException:
        return "unknown"
