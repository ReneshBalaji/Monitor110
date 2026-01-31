# Software Explanation — Portfolio Intelligence (Monitor110 Frontend)

This document explains the **entire software**: purpose, user flow, file structure, data flow, and core logic.

---

## 1. What the software is

**Portfolio Intelligence** is a web app that:

- Lets users choose an asset class (Crypto, Stocks, Real Estate).
- For **Crypto**, fetches **trending Reddit posts** for a chosen coin (Bitcoin, Ethereum, etc.).
- **Scores each post for legitimacy** (keywords, comments, sentiment, engagement, anomaly detection).
- **Detects keyword spikes** (which themes are trending vs baseline) and summarizes **feedback from comments**.
- **Sorts news by legitimacy** (descending) and shows an easy-to-read list with links to Reddit.

It does **not** give buy/sell signals or price predictions. It surfaces **information awareness** from public Reddit discussions.

---

## 2. User flow (main path)

```
Landing (/) 
    → "Get Started" 
        → Categories (/categories)
            → Crypto | Stocks | Real Estate
                → Explore Crypto (/explore/crypto)
                    → Select coin (Bitcoin, Ethereum, Solana, Cardano, XRP)
                    → "Fetch trending news"
                        → Reddit fetch + legitimacy scoring + keyword spikes
                        → UI: Keyword spikes header + News list (sorted by legitimacy) + "Open on Reddit"
```

- **Landing**: Hero + “Get Started” → `/categories`.
- **Categories**: Three sections. Only **Crypto** is active; **Stocks** and **Real Estate** are “Coming soon”.
- **Explore Crypto**: User picks a coin and clicks **Fetch trending news**. The app fetches hot Reddit posts + comments, runs legitimacy scoring and keyword-spike logic, then shows:
  - **Keyword spikes** (keyword, spike %, feedback from comments).
  - **News list** sorted by legitimacy score, each with “Open on Reddit”.

---

## 3. File structure

```
frontend/
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── layout.tsx                # Root layout, Inter font, metadata
│   │   ├── page.tsx                  # Landing: hero + "Get Started"
│   │   ├── globals.css               # Tailwind + CSS variables
│   │   ├── categories/
│   │   │   └── page.tsx              # Crypto / Stocks / Real Estate
│   │   ├── explore/
│   │   │   ├── crypto/page.tsx       # Coin select, Fetch, spikes + news list
│   │   │   ├── stocks/page.tsx       # Placeholder "Coming soon"
│   │   │   └── real-estate/page.tsx  # Placeholder "Coming soon"
│   │   ├── dashboard/page.tsx        # (Legacy) Dashboard overview
│   │   ├── live-sample/page.tsx      # (Legacy) Single Reddit post fetch
│   │   ├── demo-scenarios/page.tsx   # (Legacy) 5-day replay + charts
│   │   ├── about/page.tsx            # (Legacy) Architecture + ethics
│   │   ├── home/page.tsx             # (Legacy) Overview
│   │   └── quick-insights/page.tsx   # (Legacy) Insights list
│   ├── components/
│   │   ├── CryptoNav.tsx             # Nav for legacy dashboard/live/demo/about
│   │   └── AppNav.tsx                # Nav for legacy home/dashboard/quick-insights
│   └── lib/                          # Types, data fetching, scoring
│       ├── explore-types.ts          # CoinId, RedditPostItem, KeywordSpike, ScoredPost
│       ├── reddit-fetch.ts           # fetchTrendingPosts(subreddit, limit)
│       ├── legitimacy-scoring.ts     # scorePost, scoreAndSort, computeKeywordSpikes
│       ├── api.ts                    # (Legacy) Backend API stub
│       ├── types.ts                  # (Legacy) Insight, DashboardMetrics
│       ├── mock-data.ts              # (Legacy) Mock insights + dashboard
│       ├── crypto-types.ts           # (Legacy) Scenario/Reddit types for demo
│       ├── scenario-data.ts          # (Legacy) Pre-stored 5-day scenario data
│       └── analysis.ts               # (Legacy) Demo scenario analysis
├── package.json
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

**Main path** uses: `page.tsx` (landing), `categories/page.tsx`, `explore/crypto/page.tsx`, plus `lib/explore-types.ts`, `lib/reddit-fetch.ts`, `lib/legitimacy-scoring.ts`.

**Legacy** routes (dashboard, live-sample, demo-scenarios, about, home, quick-insights) still exist and use the other components and lib files.

---

## 4. Data flow (Explore Crypto)

When the user clicks **Fetch trending news** on `/explore/crypto`:

1. **Fetch Reddit** (`reddit-fetch.ts`)
   - `fetchTrendingPosts(subreddit, limit)`:
     - GET `https://www.reddit.com/r/{subreddit}/hot.json?limit=…`
     - For each post (up to 15), GET `https://www.reddit.com/r/{subreddit}/comments/{postId}.json?limit=8`
   - Returns an array of `RedditPostItem`: id, title, subreddit, author, selftext, created_utc, score, num_comments, permalink, url, and `comments[]` (body, author, score).

2. **Legitimacy scoring** (`legitimacy-scoring.ts`)
   - `scoreAndSort(posts, coinId)`:
     - For each post, `scorePost(post, coinId)` computes:
       - **Keyword relevance**: coin-specific keywords (e.g. etf, btc, regulation) in title + selftext + comments → up to 25 pts.
       - **Engagement**: score and num_comments (capped) → up to 30 pts.
       - **Comment diversity**: unique comment authors → up to 20 pts.
       - **Sentiment consistency**: variance of sentiment across title/selftext/comments → up to 15 pts.
       - **Anomaly penalty**: very high score with few comments, no comments + short text, deleted/AutoMod author → subtracts.
     - `legitimacyScore` = sum of the above, clamped 0–100.
     - `viabilitySummary`: short text (positive / cautious / neutral) based on sentiment and matched keywords.
   - Sorts by `legitimacyScore` descending.

3. **Keyword spikes** (`legitimacy-scoring.ts`)
   - `computeKeywordSpikes(posts, coinId)`:
     - Counts how many posts mention each coin keyword.
     - **Spike %** = (keyword rate − average rate) / average rate × 100 (so “how much above average”).
     - **Feedback summary** = first ~120 chars of comments from a post that contains that keyword.
   - Returns top 8 keywords by spike %, each with keyword, spikePercent, feedbackSummary.

4. **UI** (`explore/crypto/page.tsx`)
   - Renders **Keyword spikes** section: for each spike, “Keyword: X”, “Spike: +Y%”, “Feedback (from comments): …”.
   - Renders **News list**: each item = title, subreddit, author, date, viability summary, matched keywords, legitimacy score (color-coded), and “Open on Reddit” (permalink).

So: **Reddit → fetch posts + comments → score each post → compute keyword spikes → sort by legitimacy → display spikes + list.**

---

## 5. Core logic (legitimacy and NLP-style rules)

- **Keywords**: Per-coin lists (e.g. bitcoin: etf, btc, halving, regulation, sec, exchange, hack, …). More matches in post + comments → higher keyword score.
- **Sentiment**: Simple bag-of-words (positive vs negative word lists). Used for:
  - **Consistency**: low variance across title/selftext/comments → higher score (coherent discussion).
  - **Viability summary**: “Positive sentiment around …”, “Cautious or negative …”, “Neutral discussion …”.
- **Anomaly-style penalties**: Very high score with very few comments, or no comments and short text, or author [deleted]/AutoModerator → reduces legitimacy (possible spam/bots).
- **Spike**: Keyword appears in more posts than “average” (1 / num_keywords) → positive spike %; feedback is a short comment snippet from a post containing that keyword.

No external ML model is used; everything is rule-based (keyword + sentiment + engagement + diversity + penalties).

---

## 6. Other routes (legacy / alternate)

- **Dashboard** (`/dashboard`): Dark overview with cards to Live Sample, Demo Scenarios, About.
- **Live Sample** (`/live-sample`): One Reddit post + top comments for Bitcoin or Ethereum (proof of Reddit connectivity).
- **Demo Scenarios** (`/demo-scenarios`): Five pre-stored “days” (normal → spike → cooling, etc.), sentiment analysis, volume + sentiment charts.
- **About** (`/about`): Architecture (data source, processing, storage, output) and ethics (read-only, no tracking, no financial advice, academic).
- **Home** (`/home`): Alternate overview; logo links here from legacy nav.
- **Quick Insights** (`/quick-insights`): List of short insights (mock data).

The **primary flow** for “Portfolio Intelligence” is: **Landing → Get Started → Categories → Crypto → Explore Crypto** (coin → Fetch → spikes + news by legitimacy). The rest are either legacy or placeholders (Stocks, Real Estate).

---

## 7. Tech stack

- **Next.js 14** (App Router), **TypeScript**, **Tailwind CSS**.
- **Reddit**: Public JSON API, no auth (`reddit.com/r/…/hot.json`, `…/comments/… .json`).
- **Recharts**: Used on Demo Scenarios (bar/pie); not used on main Explore Crypto flow.

---

## 8. One-line summary

**Portfolio Intelligence** lets users pick Crypto (then a coin), fetch trending Reddit posts and comments, score each post for legitimacy (keywords, comments, sentiment, engagement, anomaly-style rules), compute keyword spikes with comment feedback, and display everything sorted by legitimacy with links to Reddit—all without giving trading or price advice.
