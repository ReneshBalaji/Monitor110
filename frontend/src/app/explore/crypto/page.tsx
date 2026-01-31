"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  fetchTrendingPosts,
  fetchRecentPosts,
} from "@/lib/reddit-fetch";
import {
  scoreAndSort,
  computeKeywordSpikes,
  computeKeywordSpikesForWindow,
  getTimeWindowKeys,
  generateKeyPointsSummary,
  TIME_WINDOW_SECONDS,
} from "@/lib/legitimacy-scoring";
import { fetchCoingeckoCoin } from "@/lib/coingecko";
import type { CoingeckoCoinInfo } from "@/lib/coingecko";
import { fetchCryptoPanicNews } from "@/lib/news-fetch";
import type { CoinId } from "@/lib/explore-types";
import type { ScoredPost, KeywordSpike, TimeWindow } from "@/lib/explore-types";
import type { RedditPostItem } from "@/lib/explore-types";

const COINS: { id: CoinId; label: string; subreddit: string }[] = [
  { id: "bitcoin", label: "Bitcoin", subreddit: "bitcoin" },
  { id: "ethereum", label: "Ethereum", subreddit: "ethereum" },
  { id: "solana", label: "Solana", subreddit: "solana" },
  { id: "cardano", label: "Cardano", subreddit: "cardano" },
  { id: "xrp", label: "XRP", subreddit: "Ripple" },
];

const TIME_WINDOW_LABELS: Record<TimeWindow, string> = {
  "1h": "Current",
  "4h": "4hr",
  "12h": "12hr",
  "24h": "24h",
  "7d": "7d",
  "30d": "30d",
};

const INITIAL_NEWS_COUNT = 6;

function formatDate(utc: number): string {
  return new Date(utc * 1000).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getReadableSnippet(post: RedditPostItem, maxChars: number = 320): string {
  const self = (post.selftext || "").trim();
  if (self.length > 0) {
    return self.length <= maxChars ? self : self.slice(0, maxChars) + "...";
  }
  const comments = post.comments.map((c) => c.body).join(" ");
  if (comments.length > 0) {
    return comments.length <= maxChars ? comments : comments.slice(0, maxChars) + "...";
  }
  return "";
}

function SentimentTag({ sentiment }: { sentiment?: "positive" | "mixed" | "neutral" }) {
  const s = sentiment ?? "neutral";
  const styles = {
    positive: "bg-emerald-100 text-emerald-800",
    mixed: "bg-amber-100 text-amber-800",
    neutral: "bg-slate-100 text-slate-600",
  };
  const labels = { positive: "Positive", mixed: "Mixed", neutral: "Neutral" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[s]}`}>
      {labels[s]}
    </span>
  );
}

function SourceBadge({ source }: { source?: "reddit" | "news" }) {
  const s = source ?? "reddit";
  const styles = {
    reddit: "bg-orange-100 text-orange-800",
    news: "bg-sky-100 text-sky-800",
  };
  const labels = { reddit: "Community", news: "Article" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[s]}`}>
      {labels[s]}
    </span>
  );
}

export default function ExploreCryptoPage() {
  const [coin, setCoin] = useState<CoinId>("bitcoin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scoredPosts, setScoredPosts] = useState<ScoredPost[] | null>(null);
  const [spikes, setSpikes] = useState<KeywordSpike[] | null>(null);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("24h");
  const [spikesByWindow, setSpikesByWindow] = useState<Record<TimeWindow, KeywordSpike[]> | null>(null);
  const [recentPosts, setRecentPosts] = useState<RedditPostItem[] | null>(null);
  const [keyPoints, setKeyPoints] = useState<string[] | null>(null);
  const [expandedSpike, setExpandedSpike] = useState<string | null>(null);
  const [showLegitimacyModal, setShowLegitimacyModal] = useState(false);
  const [showAllNews, setShowAllNews] = useState(false);
  const [coingeckoData, setCoingeckoData] = useState<CoingeckoCoinInfo | null>(null);
  const [coingeckoLoading, setCoingeckoLoading] = useState(false);

  const currentCoin = COINS.find((c) => c.id === coin)!;

  useEffect(() => {
    let cancelled = false;
    setCoingeckoLoading(true);
    setCoingeckoData(null);
    fetchCoingeckoCoin(coin).then((data) => {
      if (!cancelled && data) setCoingeckoData(data);
      setCoingeckoLoading(false);
    }).catch(() => setCoingeckoLoading(false));
    return () => { cancelled = true; };
  }, [coin]);
  const timeWindowKeys = getTimeWindowKeys();
  const windowSpikes = spikesByWindow?.[timeWindow] ?? [];
  const displaySpikes = windowSpikes.length > 0 ? windowSpikes : (spikes ?? []);
  const nowSeconds = Math.floor(Date.now() / 1000);
  const sinceUtc = nowSeconds - TIME_WINDOW_SECONDS[timeWindow];
  const postsInWindow = (scoredPosts ?? []).filter((sp) => sp.post.created_utc >= sinceUtc);
  const visibleNewsCount = showAllNews ? postsInWindow.length : Math.min(postsInWindow.length, INITIAL_NEWS_COUNT);
  const visiblePosts = postsInWindow.slice(0, visibleNewsCount);
  const hasMoreNews = postsInWindow.length > INITIAL_NEWS_COUNT && !showAllNews;

  async function handleFetch() {
    setLoading(true);
    setError(null);
    setScoredPosts(null);
    setSpikes(null);
    setSpikesByWindow(null);
    setRecentPosts(null);
    setKeyPoints(null);
    setShowAllNews(false);
    try {
      const [hotPosts, recent, newsItems] = await Promise.all([
        fetchTrendingPosts(currentCoin.subreddit, 18),
        fetchRecentPosts(currentCoin.subreddit, 100),
        fetchCryptoPanicNews(coin, 10),
      ]);
      if (!hotPosts.length && !newsItems.length) throw new Error("No items returned from sources");

      const combined = [...hotPosts, ...newsItems];
      const scored = scoreAndSort(combined, coin);
      const mainSpikes = computeKeywordSpikes(hotPosts.length ? hotPosts : combined, coin);
      const summaryBullets = generateKeyPointsSummary(combined, coin);

      setScoredPosts(scored);
      setSpikes(mainSpikes);
      setRecentPosts(recent);
      setKeyPoints(summaryBullets);

      const nowSeconds = Math.floor(Date.now() / 1000);
      const byWindow: Record<TimeWindow, KeywordSpike[]> = {} as Record<TimeWindow, KeywordSpike[]>;
      for (const w of timeWindowKeys) {
        byWindow[w] = computeKeywordSpikesForWindow(recent, coin, w, nowSeconds);
      }
      setSpikesByWindow(byWindow);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-4">
          <Link
            href="/categories"
            className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
          >
            ← Choose a category
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">
          Crypto — {currentCoin.label}
        </h1>

        {/* Coin selector */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 mb-6 shadow-sm">
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Coin
          </label>
          <div className="flex flex-wrap gap-3 mb-4">
            {COINS.map((c) => (
              <button
                key={c.id}
                onClick={() => setCoin(c.id)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                  coin === c.id
                    ? "border-blue-500 bg-blue-600 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleFetch}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-button hover:bg-blue-500 disabled:opacity-50 disabled:pointer-events-none transition-colors"
          >
            {loading ? "Fetching & scoring…" : "Fetch trending news"}
          </button>
        </div>

        {/* Market data from Coingecko */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 mb-6 shadow-sm">
          <h2 className="text-sm font-semibold text-amber-800 mb-3 uppercase tracking-wide">
            Market data (Coingecko)
          </h2>
          {coingeckoLoading && (
            <p className="text-sm text-slate-600">Loading market data…</p>
          )}
          {!coingeckoLoading && coingeckoData && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-slate-500 uppercase text-xs">Price (USD)</p>
                <p className="font-semibold text-slate-900">
                  ${coingeckoData.marketData.currentPriceUsd >= 1
                    ? coingeckoData.marketData.currentPriceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : coingeckoData.marketData.currentPriceUsd.toFixed(6)}
                </p>
              </div>
              <div>
                <p className="text-slate-500 uppercase text-xs">24h change</p>
                <p className={`font-semibold ${coingeckoData.marketData.priceChangePercent24h >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {coingeckoData.marketData.priceChangePercent24h >= 0 ? "+" : ""}
                  {coingeckoData.marketData.priceChangePercent24h.toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-slate-500 uppercase text-xs">Market cap</p>
                <p className="font-semibold text-slate-900">
                  ${(coingeckoData.marketData.marketCapUsd / 1e9).toFixed(2)}B
                </p>
              </div>
              <div>
                <p className="text-slate-500 uppercase text-xs">24h volume</p>
                <p className="font-semibold text-slate-900">
                  ${(coingeckoData.marketData.totalVolumeUsd / 1e6).toFixed(2)}M
                </p>
              </div>
            </div>
          )}
          {!coingeckoLoading && !coingeckoData && (
            <p className="text-sm text-slate-500">Market data unavailable for this coin.</p>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 text-sm mb-6">
            {error}
          </div>
        )}

        {scoredPosts && (spikes !== null || spikesByWindow !== null) && (
          <>
            {/* 1. Summary panel — at top */}
            {keyPoints && keyPoints.length > 0 && (
              <section className="rounded-xl border border-blue-200 bg-blue-50 p-5 mb-6 animate-fade-in-up shadow-sm">
                <h2 className="text-sm font-semibold text-blue-800 mb-3 uppercase tracking-wide">
                  Key points
                </h2>
                <ul className="space-y-2">
                  {keyPoints.map((point, i) => (
                    <li key={i} className="text-sm text-slate-700 leading-relaxed flex gap-2">
                      <span className="text-blue-600 shrink-0" aria-hidden>•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 2. Keyword spikes — styled scroll */}
            <section className="mb-6 animate-fade-in-up rounded-xl border border-slate-200 bg-white p-5 shadow-sm" style={{ animationDelay: "50ms" }}>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                <h2 className="text-lg font-semibold text-slate-900">
                  Keyword spikes
                </h2>
                <button
                  type="button"
                  onClick={() => setShowLegitimacyModal(true)}
                  className="text-xs text-slate-500 hover:text-blue-600 transition-colors"
                >
                  How legitimacy is calculated
                </button>
              </div>
              <p className="text-sm text-slate-600 mb-3">
                Ranked by discussion quality and consistency, not hype or upvotes.
              </p>

              <div className="flex flex-wrap gap-2 mb-3">
                {timeWindowKeys.map((w) => (
                  <button
                    key={w}
                    onClick={() => setTimeWindow(w)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                      timeWindow === w
                        ? "border-blue-500 bg-blue-600 text-white"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {TIME_WINDOW_LABELS[w]}
                  </button>
                ))}
              </div>

              <div className={`flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory spike-scroll px-1`}>
                {displaySpikes.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4">
                    No spike data for this time window.
                  </p>
                ) : (
                  displaySpikes.map((s) => (
                    <div
                      key={s.keyword}
                      className="flex-shrink-0 w-[200px] snap-start rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-medium text-blue-700 capitalize">
                          {s.keyword}
                        </span>
                        <span className="text-sm font-semibold text-emerald-600">
                          +{s.spikePercent}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <SentimentTag sentiment={s.sentiment} />
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedSpike(expandedSpike === s.keyword ? null : s.keyword)
                        }
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 transition-colors"
                        aria-expanded={expandedSpike === s.keyword}
                      >
                        {expandedSpike === s.keyword ? "▼" : "▶"} Why trending
                      </button>
                      {expandedSpike === s.keyword && s.expandableSummary && (
                        <p className="mt-2 text-xs text-slate-700 leading-relaxed border-t border-slate-200 pt-2 whitespace-pre-line">
                          {s.expandableSummary}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* 3. News — source badge, link text, show more */}
            <section className="animate-fade-in-up rounded-xl border border-slate-200 bg-white p-5 shadow-sm" style={{ animationDelay: "100ms" }}>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">News</h2>
              <p className="text-sm text-slate-600 mb-4">
                Showing items from the selected time window ({TIME_WINDOW_LABELS[timeWindow]}). Community discussions and articles. Sorted by legitimacy.
              </p>
              <ul className="space-y-4">
                {visiblePosts.map((item) => {
                  const snippet = getReadableSnippet(item.post);
                  return (
                    <li
                      key={item.post.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <SourceBadge source={item.post.source} />
                          </div>
                          <h3 className="font-medium text-slate-900 mb-1 leading-snug">
                            {item.post.title}
                          </h3>
                          <p className="text-xs text-slate-500 mb-2">
                            {item.post.subreddit} · {item.post.author}
                            {" · "}
                            {formatDate(item.post.created_utc)}
                          </p>
                          {snippet && (
                            <p className="text-sm text-slate-700 leading-relaxed mb-2">
                              {snippet}
                            </p>
                          )}
                          <p className="text-sm text-slate-600 mb-2">
                            {item.viabilitySummary}
                          </p>
                          {item.keywordMatches.length > 0 && (
                            <p className="text-xs text-slate-500">
                              Keywords: {item.keywordMatches.join(", ")}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                              item.legitimacyScore >= 70
                                ? "bg-emerald-100 text-emerald-800"
                                : item.legitimacyScore >= 50
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {item.legitimacyScore} — legitimacy
                          </span>
                          <a
                            href={item.post.permalink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            Open from source →
                          </a>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
              {hasMoreNews && (
                    <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setShowAllNews(true)}
                    className="rounded-lg border border-slate-200 bg-white px-6 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
                  >
                    Show all {postsInWindow.length} items in this window
                  </button>
                </div>
              )}
            </section>
          </>
        )}

        {showLegitimacyModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50"
            onClick={() => setShowLegitimacyModal(false)}
            role="dialog"
            aria-modal="true"
            aria-label="How legitimacy is calculated"
          >
            <div
              className="rounded-xl border border-slate-200 bg-white p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                How legitimacy is calculated
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Each post is scored using: keyword relevance (coin-specific terms),
                engagement (score and comment count), comment diversity (unique
                authors), and sentiment consistency across title, body, and
                comments. Anomalies (e.g. very high score with few comments) are
                penalized. Scores are 0–100; higher means more discussion quality
                and consistency, not hype or upvotes.
              </p>
              <p className="text-xs text-slate-500 italic mb-4">
                Not financial advice. For research and education only.
              </p>
              <button
                type="button"
                onClick={() => setShowLegitimacyModal(false)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
