"use client";

import { useState } from "react";
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
} from "@/lib/legitimacy-scoring";
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
    positive: "bg-emerald-500/20 text-emerald-400",
    mixed: "bg-amber-500/20 text-amber-400",
    neutral: "bg-white/10 text-white/70",
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
    reddit: "bg-orange-500/20 text-orange-400",
    news: "bg-sky-500/20 text-sky-400",
  };
  const labels = { reddit: "Reddit", news: "News" };
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

  const currentCoin = COINS.find((c) => c.id === coin)!;
  const timeWindowKeys = getTimeWindowKeys();
  const displaySpikes = spikesByWindow
    ? spikesByWindow[timeWindow] ?? []
    : spikes ?? [];
  const visibleNewsCount = showAllNews ? (scoredPosts?.length ?? 0) : INITIAL_NEWS_COUNT;
  const visiblePosts = scoredPosts?.slice(0, visibleNewsCount) ?? [];
  const hasMoreNews = (scoredPosts?.length ?? 0) > INITIAL_NEWS_COUNT && !showAllNews;

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
      const [hotPosts, recent] = await Promise.all([
        fetchTrendingPosts(currentCoin.subreddit, 18),
        fetchRecentPosts(currentCoin.subreddit, 100),
      ]);
      if (!hotPosts.length) throw new Error("No posts returned from Reddit");

      const scored = scoreAndSort(hotPosts, coin);
      const mainSpikes = computeKeywordSpikes(hotPosts, coin);
      const summaryBullets = generateKeyPointsSummary(hotPosts, coin);

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
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-4">
          <Link
            href="/categories"
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            ← Choose a category
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-semibold text-white mb-2">
          Crypto — {currentCoin.label}
        </h1>

        {/* Coin selector — unchanged */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 mb-6">
          <label className="block text-sm font-medium text-white/80 mb-3">
            Coin
          </label>
          <div className="flex flex-wrap gap-3 mb-4">
            {COINS.map((c) => (
              <button
                key={c.id}
                onClick={() => setCoin(c.id)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                  coin === c.id
                    ? "border-violet-500 bg-violet-600 text-white"
                    : "border-white/20 bg-white/5 text-white/90 hover:bg-white/10"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleFetch}
            disabled={loading}
            className="rounded-lg bg-violet-600 px-6 py-3 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50 disabled:pointer-events-none transition-colors"
          >
            {loading ? "Fetching & scoring…" : "Fetch trending news"}
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300 text-sm mb-6">
            {error}
          </div>
        )}

        {scoredPosts && (spikes !== null || spikesByWindow !== null) && (
          <>
            {/* 1. Summary panel — at top */}
            {keyPoints && keyPoints.length > 0 && (
              <section className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-5 mb-6 animate-fade-in-up">
                <h2 className="text-sm font-semibold text-violet-300 mb-3 uppercase tracking-wide">
                  Key points
                </h2>
                <ul className="space-y-2">
                  {keyPoints.map((point, i) => (
                    <li key={i} className="text-sm text-white/90 leading-relaxed flex gap-2">
                      <span className="text-violet-400 shrink-0" aria-hidden>•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 2. Keyword spikes — styled scroll */}
            <section className="mb-6 animate-fade-in-up" style={{ animationDelay: "50ms" }}>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                <h2 className="text-lg font-semibold text-white">
                  Keyword spikes
                </h2>
                <button
                  type="button"
                  onClick={() => setShowLegitimacyModal(true)}
                  className="text-xs text-white/50 hover:text-violet-400 transition-colors"
                >
                  How legitimacy is calculated
                </button>
              </div>
              <p className="text-sm text-white/60 mb-3">
                Ranked by discussion quality and consistency, not hype or upvotes.
              </p>

              <div className="flex flex-wrap gap-2 mb-3">
                {timeWindowKeys.map((w) => (
                  <button
                    key={w}
                    onClick={() => setTimeWindow(w)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                      timeWindow === w
                        ? "border-violet-500 bg-violet-600 text-white"
                        : "border-white/20 bg-white/5 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    {TIME_WINDOW_LABELS[w]}
                  </button>
                ))}
              </div>

              <div className={`flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory spike-scroll px-1`}>
                {displaySpikes.length === 0 ? (
                  <p className="text-sm text-white/50 py-4">
                    No spike data for this time window.
                  </p>
                ) : (
                  displaySpikes.map((s) => (
                    <div
                      key={s.keyword}
                      className="flex-shrink-0 w-[200px] snap-start rounded-xl border border-white/20 bg-white/[0.08] p-4 shadow-lg shadow-black/20"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-medium text-violet-300 capitalize">
                          {s.keyword}
                        </span>
                        <span className="text-sm font-semibold text-emerald-400">
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
                        className="flex items-center gap-1 text-xs text-white/50 hover:text-violet-400 transition-colors"
                        aria-expanded={expandedSpike === s.keyword}
                      >
                        {expandedSpike === s.keyword ? "▼" : "▶"} Why trending
                      </button>
                      {expandedSpike === s.keyword && s.expandableSummary && (
                        <p className="mt-2 text-xs text-white/80 leading-relaxed border-t border-white/10 pt-2">
                          {s.expandableSummary}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* 3. News — source badge, link text, show more */}
            <section className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
              <h2 className="text-lg font-semibold text-white mb-2">News</h2>
              <p className="text-sm text-white/60 mb-4">
                Sorted by discussion quality and consistency, not hype or upvotes. From Reddit.
              </p>
              <ul className="space-y-4">
                {visiblePosts.map((item) => {
                  const snippet = getReadableSnippet(item.post);
                  const isReddit = item.post.source !== "news";
                  return (
                    <li
                      key={item.post.id}
                      className="rounded-xl border border-white/10 bg-white/5 p-5 hover:bg-white/[0.08] transition-colors"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <SourceBadge source={item.post.source} />
                          </div>
                          <h3 className="font-medium text-white mb-1 leading-snug">
                            {item.post.title}
                          </h3>
                          <p className="text-xs text-white/50 mb-2">
                            {isReddit
                              ? `r/${item.post.subreddit} · u/${item.post.author}`
                              : item.post.subreddit + " · " + item.post.author}
                            {" · "}
                            {formatDate(item.post.created_utc)}
                          </p>
                          {snippet && (
                            <p className="text-sm text-white/80 leading-relaxed mb-2">
                              {snippet}
                            </p>
                          )}
                          <p className="text-sm text-white/70 mb-2">
                            {item.viabilitySummary}
                          </p>
                          {item.keywordMatches.length > 0 && (
                            <p className="text-xs text-white/50">
                              Keywords: {item.keywordMatches.join(", ")}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                              item.legitimacyScore >= 70
                                ? "bg-emerald-500/20 text-emerald-400"
                                : item.legitimacyScore >= 50
                                ? "bg-amber-500/20 text-amber-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {item.legitimacyScore} — legitimacy
                          </span>
                          <a
                            href={item.post.permalink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors"
                          >
                            {isReddit ? "Open on Reddit →" : "Open article →"}
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
                    className="rounded-lg border border-white/20 bg-white/5 px-6 py-2 text-sm font-medium text-white/90 hover:bg-white/10 transition-colors"
                  >
                    Show all {scoredPosts?.length ?? 0} items
                  </button>
                </div>
              )}
            </section>
          </>
        )}

        {showLegitimacyModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            onClick={() => setShowLegitimacyModal(false)}
            role="dialog"
            aria-modal="true"
            aria-label="How legitimacy is calculated"
          >
            <div
              className="rounded-xl border border-white/10 bg-black p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-white mb-3">
                How legitimacy is calculated
              </h3>
              <p className="text-sm text-white/80 leading-relaxed mb-4">
                Each post is scored using: keyword relevance (coin-specific terms),
                engagement (score and comment count), comment diversity (unique
                authors), and sentiment consistency across title, body, and
                comments. Anomalies (e.g. very high score with few comments) are
                penalized. Scores are 0–100; higher means more discussion quality
                and consistency, not hype or upvotes.
              </p>
              <button
                type="button"
                onClick={() => setShowLegitimacyModal(false)}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
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
