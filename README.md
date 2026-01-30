# Modern Monitor 110 – Reddit Signal Engine

This project rebuilds the failed Monitor 110 concept using:
- A single trusted data source (Reddit)
- Modern NLP for deduplication
- Signal-based intelligence instead of raw data

## Run
1. Set Reddit API keys in `.env`
2. Install dependencies
3. Run:
   uvicorn app.main:app --reload

## Endpoint
GET /signals
