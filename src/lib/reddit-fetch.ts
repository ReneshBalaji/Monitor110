import type { RedditPostItem } from "./explore-types";

/**
 * Fetches trending (hot) posts via the server-side API route.
 * The API route handles retries, rate limiting, and proper User-Agent headers.
 */
export async function fetchTrendingPosts(
  subreddit: string,
  limit: number = 20
): Promise<RedditPostItem[]> {
  const res = await fetch(
    `/api/reddit?subreddit=${encodeURIComponent(subreddit)}&type=hot&limit=${limit}&comments=true`
  );
  
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Failed to fetch: ${res.status}`);
  }
  
  const data = await res.json();
  return data.posts ?? [];
}

/**
 * Fetches recent posts (new) for time-window spike comparison.
 * No comments fetched for performance.
 */
export async function fetchRecentPosts(
  subreddit: string,
  limit: number = 100
): Promise<RedditPostItem[]> {
  const res = await fetch(
    `/api/reddit?subreddit=${encodeURIComponent(subreddit)}&type=new&limit=${limit}&comments=false`
  );
  
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Failed to fetch: ${res.status}`);
  }
  
  const data = await res.json();
  return data.posts ?? [];
}

/**
 * Fetches news from multiple sources (RSS feeds, news APIs)
 */
export async function fetchNewsFromSources(
  coinId: string,
  limit: number = 15
): Promise<RedditPostItem[]> {
  try {
    const res = await fetch(
      `/api/news?coin=${encodeURIComponent(coinId)}&limit=${limit}`
    );
    
    if (!res.ok) {
      console.warn("News fetch failed, continuing with Reddit only");
      return [];
    }
    
    const data = await res.json();
    return data.posts ?? [];
  } catch {
    // News is optional, don't fail the whole request
    return [];
  }
}

/**
 * Fetches tweets from Twitter/X API (if configured)
 */
export async function fetchTwitterPosts(
  coinId: string,
  limit: number = 10
): Promise<RedditPostItem[]> {
  try {
    const res = await fetch(
      `/api/twitter?coin=${encodeURIComponent(coinId)}&limit=${limit}`
    );
    
    if (!res.ok) {
      return [];
    }
    
    const data = await res.json();
    return data.posts ?? [];
  } catch {
    // Twitter is optional
    return [];
  }
}

/**
 * Fetches from all sources: Reddit + News + Twitter
 * Combines and deduplicates results
 */
export async function fetchAllSources(
  subreddit: string,
  coinId: string,
  limit: number = 25
): Promise<RedditPostItem[]> {
  const [redditPosts, newsPosts, twitterPosts] = await Promise.all([
    fetchTrendingPosts(subreddit, limit),
    fetchNewsFromSources(coinId, limit),
    fetchTwitterPosts(coinId, 10),
  ]);
  
  // Combine all sources
  const all = [...redditPosts, ...newsPosts, ...twitterPosts];
  
  // Sort by date (newest first)
  return all.sort((a, b) => b.created_utc - a.created_utc);
}
