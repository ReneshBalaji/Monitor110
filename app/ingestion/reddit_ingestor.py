import praw
from app.config import (
    REDDIT_CLIENT_ID,
    REDDIT_CLIENT_SECRET,
    REDDIT_USER_AGENT,
    SUBREDDITS,
    POST_LIMIT
)

def fetch_reddit_posts():
    reddit = praw.Reddit(
        client_id=REDDIT_CLIENT_ID,
        client_secret=REDDIT_CLIENT_SECRET,
        user_agent=REDDIT_USER_AGENT
    )

    posts = []

    for subreddit in SUBREDDITS:
        for submission in reddit.subreddit(subreddit).hot(limit=POST_LIMIT):
            if submission.selftext:
                posts.append({
                    "text": submission.title + " " + submission.selftext,
                    "subreddit": subreddit,
                    "score": submission.score
                })

    return posts
