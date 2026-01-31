"use client";

import { useState } from "react";
import CryptoNav from "@/components/CryptoNav";

type Topic = "Bitcoin" | "Ethereum";

interface RedditListing {
  data?: {
    children?: Array<{
      data?: {
        id?: string;
        title?: string;
        subreddit?: string;
        author?: string;
        selftext?: string;
        created_utc?: number;
        num_comments?: number;
        permalink?: string;
      };
    }>;
  };
}

interface RedditComment {
  data?: {
    body?: string;
    author?: string;
    score?: number;
    created_utc?: number;
  };
}

function formatTimestamp(utc: number): string {
  const d = new Date(utc * 1000);
  return d.toLocaleString();
}

export default function LiveSamplePage() {
  const [topic, setTopic] = useState<Topic>("Bitcoin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [post, setPost] = useState<{
    title: string;
    subreddit: string;
    author: string;
    selftext: string;
    created_utc: number;
    comments: { body: string; author: string; score: number; created_utc: number }[];
  } | null>(null);

  const subreddit = topic === "Bitcoin" ? "bitcoin" : "ethereum";

  async function fetchLiveSample() {
    setLoading(true);
    setError(null);
    setPost(null);
    try {
      const listingRes = await fetch(
        `https://www.reddit.com/r/${subreddit}/new.json?limit=1`,
        { headers: { Accept: "application/json" } }
      );
      if (!listingRes.ok) throw new Error("Failed to fetch from Reddit");
      const listing: RedditListing = await listingRes.json();
      const first = listing?.data?.children?.[0]?.data;
      if (!first?.id) throw new Error("No post found");

      const commentsRes = await fetch(
        `https://www.reddit.com/r/${subreddit}/comments/${first.id}.json?limit=6`,
        { headers: { Accept: "application/json" } }
      );
      if (!commentsRes.ok) throw new Error("Failed to fetch comments");
      const commentsPayload = await commentsRes.json();
      const commentList = commentsPayload?.[1]?.data?.children ?? [];
      const topComments = commentList
        .filter((c: { data?: { body?: string } }) => c?.data?.body)
        .slice(0, 5)
        .map((c: RedditComment) => ({
          body: c.data?.body ?? "",
          author: c.data?.author ?? "[deleted]",
          score: c.data?.score ?? 0,
          created_utc: c.data?.created_utc ?? 0,
        }));

      setPost({
        title: first.title ?? "",
        subreddit: first.subreddit ?? subreddit,
        author: first.author ?? "[deleted]",
        selftext: first.selftext ?? "",
        created_utc: first.created_utc ?? 0,
        comments: topComments,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <CryptoNav />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-2xl font-semibold text-white mb-2">
          Live Sample
        </h1>
        <p className="text-sm text-white/70 mb-6">
          Proof of Reddit connectivity. Read-only public data.
        </p>

        <div className="rounded-xl border border-white/10 bg-white/5 p-6 mb-6">
          <p className="text-xs font-medium text-amber-400/90 mb-4 uppercase tracking-wide">
            Live public Reddit data (read-only)
          </p>
          <div className="flex flex-wrap gap-4 items-center">
            <label className="flex items-center gap-2">
              <span className="text-sm text-white/80">Topic:</span>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value as Topic)}
                className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="Bitcoin">Bitcoin</option>
                <option value="Ethereum">Ethereum</option>
              </select>
            </label>
            <button
              onClick={fetchLiveSample}
              disabled={loading}
              className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              {loading ? "Fetching…" : "Fetch Live Reddit Sample"}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300 text-sm mb-6">
            {error}
          </div>
        )}

        {post && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">
                {post.title}
              </h2>
              <p className="text-sm text-white/60">
                r/{post.subreddit} · u/{post.author} · {formatTimestamp(post.created_utc)}
              </p>
            </div>
            {post.selftext && (
              <p className="text-sm text-white/80 whitespace-pre-wrap">
                {post.selftext}
              </p>
            )}
            <div>
              <h3 className="text-sm font-medium text-white/90 mb-3">
                Top comments (up to 5)
              </h3>
              <ul className="space-y-3">
                {post.comments.map((c, i) => (
                  <li
                    key={i}
                    className="rounded-lg border border-white/10 bg-black/40 p-3 text-sm text-white/80"
                  >
                    <span className="text-white/50">u/{c.author}</span> · {c.score} pts
                    <p className="mt-1 text-white/90">{c.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
