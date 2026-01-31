"use client";

import { useState } from "react";
import Link from "next/link";
import { fetchTrendingPosts, fetchRecentPosts } from "@/lib/reddit-fetch";
import {
  scoreAndSortGeneric,
  computeKeywordSpikesGeneric,
  computeKeywordSpikesForWindowGeneric,
  getTimeWindowKeys,
  generateKeyPointsSummaryGeneric,
  TIME_WINDOW_SECONDS,
  REALESTATE_KEYWORDS,
} from "@/lib/legitimacy-scoring";
import type { ScoredPost, KeywordSpike, TimeWindow } from "@/lib/explore-types";
import type { RedditPostItem } from "@/lib/explore-types";

const SUBREDDITS = [
  { id: "realestate", label: "Real Estate", subreddit: "realestate" },
  { id: "realestateinvesting", label: "Real Estate Investing", subreddit: "realestateinvesting" },
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
  if (self.length > 0) return self.length <= maxChars ? self : self.slice(0, maxChars) + "...";
  const comments = post.comments.map((c) => c.body).join(" ");
  if (comments.length > 0) return comments.length <= maxChars ? comments : comments.slice(0, maxChars) + "...";
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
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[s]}`}>{labels[s]}</span>;
}

export default function ExploreRealEstatePage() {
  const [subreddit, setSubreddit] = useState(SUBREDDITS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scoredPosts, setScoredPosts] = useState<ScoredPost[] | null>(null);
  const [spikes, setSpikes] = useState<KeywordSpike[] | null>(null);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("24h");
  const [spikesByWindow, setSpikesByWindow] = useState<Record<TimeWindow, KeywordSpike[]> | null>(null);
  const [keyPoints, setKeyPoints] = useState<string[] | null>(null);
  const [expandedSpike, setExpandedSpike] = useState<string | null>(null);
  const [showLegitimacyModal, setShowLegitimacyModal] = useState(false);
  const [showAllNews, setShowAllNews] = useState(false);

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
    setKeyPoints(null);
    setShowAllNews(false);
    try {
      const [hotPosts, recent] = await Promise.all([
        fetchTrendingPosts(subreddit.subreddit, 18),
        fetchRecentPosts(subreddit.subreddit, 100),
      ]);
      if (!hotPosts.length) throw new Error("No items returned from sources");

      const scored = scoreAndSortGeneric(hotPosts, REALESTATE_KEYWORDS);
      const mainSpikes = computeKeywordSpikesGeneric(hotPosts, REALESTATE_KEYWORDS);
      setScoredPosts(scored);
      setSpikes(mainSpikes);
      setKeyPoints(generateKeyPointsSummaryGeneric(hotPosts, REALESTATE_KEYWORDS));

      const nowSeconds = Math.floor(Date.now() / 1000);
      const byWindow: Record<TimeWindow, KeywordSpike[]> = {} as Record<TimeWindow, KeywordSpike[]>;
      for (const w of timeWindowKeys) {
        byWindow[w] = computeKeywordSpikesForWindowGeneric(recent, REALESTATE_KEYWORDS, w, nowSeconds);
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
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/categories" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
            ← Choose a category
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">Real Estate</h1>

        <div className="rounded-xl border border-slate-200 bg-white p-6 mb-6 shadow-sm">
          <label className="block text-sm font-medium text-slate-700 mb-3">Source</label>
          <div className="flex flex-wrap gap-3 mb-4">
            {SUBREDDITS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSubreddit(s)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                  subreddit.id === s.id ? "border-blue-500 bg-blue-600 text-white" : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {s.label}
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

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 text-sm mb-6">
            {error}
          </div>
        )}

        {scoredPosts && (spikes !== null || spikesByWindow !== null) && (
          <>
            {keyPoints && keyPoints.length > 0 && (
              <section className="rounded-xl border border-blue-200 bg-blue-50 p-5 mb-6 shadow-sm">
                <h2 className="text-sm font-semibold text-blue-800 mb-3 uppercase tracking-wide">Key points</h2>
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

            <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                <h2 className="text-lg font-semibold text-slate-900">Keyword spikes</h2>
                <button type="button" onClick={() => setShowLegitimacyModal(true)} className="text-xs text-slate-500 hover:text-blue-600 transition-colors">
                  How legitimacy is calculated
                </button>
              </div>
              <p className="text-sm text-slate-600 mb-3">Ranked by discussion quality and consistency, not hype or upvotes.</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {timeWindowKeys.map((w) => (
                  <button
                    key={w}
                    onClick={() => setTimeWindow(w)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                      timeWindow === w ? "border-blue-500 bg-blue-600 text-white" : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {TIME_WINDOW_LABELS[w]}
                  </button>
                ))}
              </div>
              <div className={`flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory spike-scroll px-1`}>
                {displaySpikes.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4">No spike data for this time window.</p>
                ) : (
                  displaySpikes.map((s) => (
                    <div key={s.keyword} className="flex-shrink-0 w-[200px] snap-start rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-medium text-blue-700 capitalize">{s.keyword}</span>
                        <span className="text-sm font-semibold text-emerald-600">+{s.spikePercent}%</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <SentimentTag sentiment={s.sentiment} />
                      </div>
                      <button
                        type="button"
                        onClick={() => setExpandedSpike(expandedSpike === s.keyword ? null : s.keyword)}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 transition-colors"
                        aria-expanded={expandedSpike === s.keyword}
                      >
                        {expandedSpike === s.keyword ? "▼" : "▶"} Why trending
                      </button>
                      {expandedSpike === s.keyword && s.expandableSummary && (
                        <p className="mt-2 text-xs text-slate-700 leading-relaxed border-t border-slate-200 pt-2 whitespace-pre-line">{s.expandableSummary}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">News</h2>
              <p className="text-sm text-slate-600 mb-4">Showing posts from the selected time window ({TIME_WINDOW_LABELS[timeWindow]}). Community discussions. Sorted by legitimacy.</p>
              <ul className="space-y-4">
                {visiblePosts.map((item) => {
                  const snippet = getReadableSnippet(item.post);
                  return (
                    <li key={item.post.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 hover:bg-slate-50 transition-colors">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-slate-900 mb-1 leading-snug">{item.post.title}</h3>
                          <p className="text-xs text-slate-500 mb-2">
                            r/{item.post.subreddit} · u/{item.post.author} · {formatDate(item.post.created_utc)}
                          </p>
                          {snippet && <p className="text-sm text-slate-700 leading-relaxed mb-2">{snippet}</p>}
                          <p className="text-sm text-slate-600 mb-2">{item.viabilitySummary}</p>
                          {item.keywordMatches.length > 0 && (
                            <p className="text-xs text-slate-500">Keywords: {item.keywordMatches.join(", ")}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                              item.legitimacyScore >= 70 ? "bg-emerald-100 text-emerald-800" : item.legitimacyScore >= 50 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                            }`}
                          >
                            {item.legitimacyScore} — legitimacy
                          </span>
                          <a href={item.post.permalink} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
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
                  <button type="button" onClick={() => setShowAllNews(true)} className="rounded-lg border border-slate-200 bg-white px-6 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-colors">
                    Show all {postsInWindow.length} items in this window
                  </button>
                </div>
              )}
            </section>
          </>
        )}

        {showLegitimacyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50" onClick={() => setShowLegitimacyModal(false)} role="dialog" aria-modal="true" aria-label="How legitimacy is calculated">
            <div className="rounded-xl border border-slate-200 bg-white p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">How legitimacy is calculated</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Each post is scored using: keyword relevance, engagement (score and comment count), comment diversity (unique authors), and sentiment consistency. Anomalies are penalized. Scores are 0–100; higher means more discussion quality and consistency.
              </p>
              <p className="text-xs text-slate-500 italic mb-4">Not financial advice. For research and education only.</p>
              <button type="button" onClick={() => setShowLegitimacyModal(false)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
                Close
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
