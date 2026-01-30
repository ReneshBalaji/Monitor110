import os
from dotenv import load_dotenv

load_dotenv()

REDDIT_CLIENT_ID = os.getenv("REDDIT_CLIENT_ID")
REDDIT_CLIENT_SECRET = os.getenv("REDDIT_CLIENT_SECRET")
REDDIT_USER_AGENT = "monitor110-research-app"

SUBREDDITS = ["stocks", "wallstreetbets", "investing"]
POST_LIMIT = 50

EMBEDDING_MODEL = "all-MiniLM-L6-v2"
