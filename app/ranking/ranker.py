def rank_signals(signals):
    ranked = []

    for s in signals:
        score = 1

        if s["type"] == "risk_signal":
            score += 2
        if s["type"] == "earnings_signal":
            score += 1

        score += min(s["reddit_score"] / 1000, 1)

        ranked.append({**s, "score": round(score, 2)})

    return sorted(ranked, key=lambda x: x["score"], reverse=True)
