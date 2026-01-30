# Monitor110

Portfolio Intelligence is an online application that analyzes the discussion of crypto assets on Reddit and provides a ranking of posts based on the quality and authenticity of the discussion.

## Flow

1. **Landing** (`/`) — Hero and a **Get Started** button.
2. **Categories** (`/categories`) — Three sections: **Crypto**, **Stocks**, **Real Estate**. Click **Crypto** to continue.
3. **Explore Crypto** (`/explore/crypto`) — Select a coin (Bitcoin, Ethereum, Solana, Cardano, XRP), click **Fetch trending news**:
   - Fetches hot Reddit posts from that coin's subreddit and top comments.
   - **Legitimacy scoring** (classification / anomaly-style logic): keywords, comment sentiment, engagement, diversity, consistency. Higher score = more viable.
   - **Keyword spikes** (header): for each trending keyword — **Keyword**, **Spike %**, **Feedback (from comments)** summary.
   - Results **sorted by legitimacy** (descending). Each card: title, subreddit, author, date, viability summary, legitimacy score, **Open on Reddit** link.

Stocks and Real Estate are placeholders ("Coming soon").

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You land on the **Landing** page; click **Get Started** → **Crypto** → pick a coin → **Fetch trending news**.

## Tech

- Next.js 14 (App Router), TypeScript, Tailwind CSS
- Reddit: public JSON API (hot posts + comments), no auth
- Legitimacy: `src/lib/legitimacy-scoring.ts` — keyword relevance, sentiment (NLP-style), engagement, comment diversity, anomaly penalties
- Spike summary: keyword counts vs baseline → spike %, comment snippets as feedback
