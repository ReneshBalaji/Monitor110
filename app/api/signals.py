from fastapi import APIRouter
from app.ingestion.reddit_ingestor import fetch_reddit_posts
from app.processing.cleaner import clean_text
from app.processing.spam_filter import is_spam
from app.processing.deduplicator import deduplicate
from app.processing.signal_extractor import extract_signal
from app.ranking.ranker import rank_signals

router = APIRouter(prefix="/signals", tags=["Signals"])

@router.get("/")
def get_signals():
    raw_posts = fetch_reddit_posts()

    cleaned_texts = []
    metadata = []

    for post in raw_posts:
        text = clean_text(post["text"])
        if not is_spam(text):
            cleaned_texts.append(text)
            metadata.append(post)

    unique_texts = deduplicate(cleaned_texts)

    signals = []
    for text in unique_texts:
        signal_type = extract_signal(text)
        if signal_type:
            original = next(p for p in metadata if clean_text(p["text"]) == text)
            signals.append({
                "text": text,
                "type": signal_type,
                "subreddit": original["subreddit"],
                "reddit_score": original["score"]
            })

    return rank_signals(signals)
