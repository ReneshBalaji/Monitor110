def extract_signal(text: str):
    if "earnings" in text or "results" in text:
        return "earnings_signal"

    if "supply chain" in text or "shortage" in text:
        return "risk_signal"

    if "acquisition" in text or "merger" in text:
        return "corporate_event"

    return None
