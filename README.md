# Monitor110

**Monitor110** is a research and education dashboard for serious investors. It aggregates discussion and news from multiple sources, scores content by legitimacy (quality and consistency, not hype), and surfaces keyword spikes and market context. It is **not financial advice**; it is for research and education only.

---

## Table of contents

- [Features](#features)
- [Technical architecture](#technical-architecture)
- [Run locally](#run-locally)
- [Testing and verification](#testing-and-verification)
- [Screenshots to take](#screenshots-to-take)
- [Environment variables](#environment-variables)
- [Project structure](#project-structure)
- [Disclaimer](#disclaimer)

---

## Features

### Implemented

| Feature | Description |
|--------|-------------|
| **Multi-asset categories** | Crypto, Stocks, Real Estate. Each category has its own explore page with source selection and time windows. |
| **Crypto explore** | Bitcoin, Ethereum, Solana, Cardano, XRP. Community discussions + optional CryptoPanic articles. Coingecko market data (price, 24h change, market cap, volume) per coin. |
| **Stocks explore** | r/stocks and r/investing. Time-window filtering and legitimacy-scored feed. |
| **Real estate explore** | r/realestate and r/realestateinvesting. Same time-window and scoring behavior. |
| **Legitimacy scoring** | Each item is scored 0–100 using: keyword relevance, engagement (score + comment count), comment diversity (unique authors), sentiment consistency. Anomalies (e.g. very high score with few comments) are penalized. Higher score = more discussion quality and consistency, not hype. |
| **Keyword spikes** | Per–time-window keyword spikes. Topic terms (e.g. etf, halving, regulation) are counted; the asset's own ticker is excluded from the spike list so spikes reflect what's driving discussion. Expandable "Why trending" with key details: spike %, related topics, sentiment, sample. |
| **Time windows** | Current (1h), 4hr, 12hr, 24h, 7d, 30d. Both keyword spikes and the news feed respect the selected window. |
| **Multiple sources** | Community discussions (forums) + articles (CryptoPanic for crypto when API key is set). Coingecko for crypto market data. All links use "Open from source" (no platform branding). |
| **Key points summary** | Top keywords and overall sentiment for the fetched set. |
| **Investor disclaimer** | "Not financial advice. For research and education only." in legitimacy modals. |

### Pages

- **Landing** (`/`) — Hero and "Get Started".
- **Categories** (`/categories`) — Crypto, Stocks, Real Estate cards with short descriptions.
- **Explore Crypto** (`/explore/crypto`) — Coin selector, Coingecko market card, "Fetch trending news", key points, keyword spikes (with time window), news list (community + articles), legitimacy modal.
- **Explore Stocks** (`/explore/stocks`) — Subreddit selector (Stocks, Investing), same spike + news + time-window behavior.
- **Explore Real Estate** (`/explore/real-estate`) — Subreddit selector, same behavior.
- **Home** (`/home`) — Overview cards and product description.
- **Dashboard** (`/dashboard`) — Links to Live Sample, Demo Scenarios, About.
- **Live Sample** (`/live-sample`) — Proof of source connectivity; fetch one latest post + comments for Bitcoin or Ethereum.
- **Demo Scenarios** (`/demo-scenarios`) — Discussion intelligence replay with selectable days.
- **About** (`/about`) — Architecture (data sources, processing, storage, output) and ethics (read-only, no tracking, no financial advice).

---

## Technical architecture

### Stack

- **Next.js 14** (App Router), **TypeScript**, **Tailwind CSS**, **Recharts** (demo scenarios).

### Data flow

1. **Community feed** — Public JSON API (hot + new posts, top comments). No auth. Fetched in `frontend/src/lib/reddit-fetch.ts`.
2. **Articles (crypto)** — Optional CryptoPanic API. Fetched in `frontend/src/lib/news-fetch.ts` when `NEXT_PUBLIC_CRYPTOPANIC_API_KEY` is set. Results are normalized to the same shape as feed items and merged.
3. **Market data (crypto)** — Coingecko public API. Fetched in `frontend/src/lib/coingecko.ts` per selected coin (price, 24h change, market cap, volume).

### Scoring and spikes

- **Legitimacy** — `frontend/src/lib/legitimacy-scoring.ts`: keyword matches, engagement score, comment diversity, sentiment consistency, anomaly penalties. Articles (no comments) are scored mainly on keyword relevance; they are not penalized for zero comments.
- **Keyword spikes** — Keyword counts per post set; baseline is average rate across keywords. Keywords with >20% above average are spikes. Coin ticker is excluded from displayed spikes. Time-window spikes use filtered posts by `created_utc`; if the selected window has no spike data, the main (full-window) spikes are shown as fallback.
- **Time windows** — `TIME_WINDOW_SECONDS` in legitimacy-scoring; news list and spikes both filter by selected window (1h, 4h, 12h, 24h, 7d, 30d).

### Types

- `RedditPostItem`, `ScoredPost`, `KeywordSpike`, `TimeWindow`, `CoinId`, `FeedSource` in `frontend/src/lib/explore-types.ts`.

---

## Run locally

### Prerequisites

- Node.js 18+ and npm (or yarn/pnpm).

### Steps

```bash
# From the project root
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Optional: articles for crypto

To include CryptoPanic articles on the crypto explore page:

1. Get a free API key from [CryptoPanic Developers](https://cryptopanic.com/developers).
2. In the `frontend` directory create or edit `.env.local`:
   ```env
   NEXT_PUBLIC_CRYPTOPANIC_API_KEY=your_key_here
   ```
3. Restart `npm run dev`. The crypto page will merge community + articles.

---

## Testing and verification

### Smoke test (happy path)

1. **Landing** — Open `/`. Click "Get Started"; you should go to `/categories`.
2. **Categories** — Click "Crypto"; you should go to `/explore/crypto`.
3. **Crypto** — Ensure a coin (e.g. Bitcoin) is selected. Confirm the Coingecko market card shows (price, 24h change, market cap, volume). Click "Fetch trending news".
4. **After fetch** — Key points section appears; Keyword spikes section shows topic terms (not the coin ticker) with time-window buttons; News section shows items (Community/Article badges, legitimacy score, "Open from source"). Change time window (e.g. 4hr, 12hr); news list and spikes should update. Click "Why trending" on a spike; key details (spike %, related topics, sentiment, sample) should expand.
5. **Legitimacy modal** — Click "How legitimacy is calculated"; modal should show scoring explanation and "Not financial advice. For research and education only."
6. **Stocks** — From categories go to Stocks. Select a subreddit, click "Fetch trending news". Verify keyword spikes, time windows, and news list behave as above.
7. **Real estate** — Same flow from Real Estate; verify behavior.

### Edge cases

- **No API key** — CryptoPanic key unset: crypto page still works with community feed only; no errors.
- **Empty window** — Select a very short time window (e.g. Current) after fetch; if that window has no posts, news list may be empty and spikes may fall back to main spikes.
- **Source failure** — If community fetch fails, error message is shown; no crash.

### Lint and build

```bash
cd frontend
npm run lint
npm run build
```

---


<img width="1918" height="1012" alt="Group 1" src="https://github.com/user-attachments/assets/65a9fdf8-52d6-4fe3-8927-ff348721dc9a" />
<img width="1918" height="1012" alt="Group 1 (1)" src="https://github.com/user-attachments/assets/4cf3301c-8979-4ebf-98ee-be0f7fa77ba4" />
<img width="1919" height="1012" alt="Group 1 (2)" src="https://github.com/user-attachments/assets/7ef51c35-65af-4c83-aa4c-c01b23f6aa5e" />
<img width="1893" height="1006" alt="image" src="https://github.com/user-attachments/assets/7185ea6a-8884-4836-9bbc-86e2e9d1a618" />


---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_CRYPTOPANIC_API_KEY` | No | CryptoPanic API key for crypto articles. If unset, crypto page uses community feed only. Add in `frontend/.env.local`. |

No other env vars are required for run or build.

---

## Project structure

```
Monitor110/
├── frontend/                 # Next.js app (Portfolio Intelligence UI)
│   ├── src/
│   │   ├── app/              # App Router: landing, categories, explore, etc.
│   │   ├── components/       # AppNav, CryptoNav
│   │   └── lib/              # legitimacy-scoring, reddit-fetch, news-fetch, coingecko, etc.
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   └── README.md
├── app/                      # Backend (Python/FastAPI)
├── models/
└── README.md                 # This file
```

---

## Disclaimer

Monitor110 is for **research and education only**. It does not provide financial, investment, legal, or tax advice. Scores and keyword spikes reflect discussion quality and topical emphasis, not future performance. Always do your own research and, where appropriate, consult qualified professionals before making investment decisions.
