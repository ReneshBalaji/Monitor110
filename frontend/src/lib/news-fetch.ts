import type { RedditPostItem } from "./explore-types";
import type { CoinId } from "./explore-types";

const CRYPTOPANIC_CURRENCIES: Record<CoinId, string> = {
  bitcoin: "BTC",
  ethereum: "ETH",
  solana: "SOL",
  cardano: "ADA",
  xrp: "XRP",
};

/**
 * Fetches crypto news from CryptoPanic (articles from various outlets).
 * Set NEXT_PUBLIC_CRYPTOPANIC_API_KEY in .env for free tier access.
 * Returns items in same shape as feed posts so we can merge and display.
 */
export async function fetchCryptoPanicNews(
  coinId: CoinId,
  limit: number = 10
): Promise<RedditPostItem[]> {
  const key = typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_CRYPTOPANIC_API_KEY ?? "") : "";
  if (!key) return [];

  const currency = CRYPTOPANIC_CURRENCIES[coinId] ?? "BTC";
  try {
    const res = await fetch(
      `https://cryptopanic.com/api/v1/posts/?auth_token=${key}&currencies=${currency}&public=true&limit=${limit}`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { results?: Array<{
      id?: number;
      title?: string;
      url?: string;
      created_at?: string;
      source?: { title?: string };
      domain?: string;
    }> };
    const results = data.results ?? [];
    const now = Math.floor(Date.now() / 1000);
    return results.map((r, i) => ({
      id: `news-${r.id ?? i}`,
      title: r.title ?? "",
      subreddit: r.source?.title ?? r.domain ?? "News",
      author: r.source?.title ?? "Article",
      selftext: "",
      created_utc: r.created_at ? Math.floor(new Date(r.created_at).getTime() / 1000) : now,
      score: 0,
      num_comments: 0,
      permalink: r.url ?? "",
      url: r.url ?? "",
      comments: [],
      source: "news" as const,
    }));
  } catch {
    return [];
  }
}
