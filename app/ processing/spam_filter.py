SPAM_KEYWORDS = ["buy now", "free money", "pump", "scam"]

def is_spam(text: str) -> bool:
    return any(word in text for word in SPAM_KEYWORDS)
