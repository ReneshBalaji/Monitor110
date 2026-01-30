import type { RedditPostItem } from "./explore-types";

const REDDIT_JSON = "https://www.reddit.com";

interface ListingChild {
  data?: {
    id?: string;
    title?: string;
    subreddit?: string;
    author?: string;
    selftext?: string;
    created_utc?: number;
    score?: number;
    num_comments?: number;
    permalink?: string;
    url?: string;
  };
}

interface CommentChild {
  data?: {
    body?: string;
    author?: string;
    score?: number;
  };
}

export async function fetchTrendingPosts(
  subreddit: string,
  limit: number = 20
): Promise<RedditPostItem[]> {
  const res = await fetch(
    `${REDDIT_JSON}/r/${subreddit}/hot.json?limit=${limit}`,
    { headers: { Accept: "application/json" } }
  );
  if (!res.ok) throw new Error("Failed to fetch from Reddit");
  const json: { data?: { children?: ListingChild[] } } = await res.json();
  const children = json?.data?.children ?? [];
  const posts: RedditPostItem[] = [];

  for (const child of children.slice(0, 15)) {
    const d = child?.data;
    if (!d?.id || !d.title) continue;

    let comments: { body: string; author: string; score: number }[] = [];
    try {
      const commentRes = await fetch(
        `${REDDIT_JSON}/r/${subreddit}/comments/${d.id}.json?limit=8`,
        { headers: { Accept: "application/json" } }
      );
      if (commentRes.ok) {
        const commentJson = await commentRes.json();
        const commentList = commentJson?.[1]?.data?.children ?? [];
        comments = commentList
          .filter((c: CommentChild) => c?.data?.body)
          .slice(0, 6)
          .map((c: CommentChild) => ({
            body: c.data?.body ?? "",
            author: c.data?.author ?? "[deleted]",
            score: c.data?.score ?? 0,
          }));
      }
    } catch {
      // skip comments on failure
    }

    posts.push({
      id: `reddit-${d.id}`,
      title: d.title,
      subreddit: d.subreddit ?? subreddit,
      author: d.author ?? "[deleted]",
      selftext: d.selftext ?? "",
      created_utc: d.created_utc ?? 0,
      score: d.score ?? 0,
      num_comments: d.num_comments ?? 0,
      permalink: d.permalink ? `https://www.reddit.com${d.permalink}` : "",
      url: d.url ?? "",
      comments,
      source: "reddit",
    });
  }

  return posts;
}

/** Fetches recent posts (new.json) for time-window spike comparison. No comments. */
export async function fetchRecentPosts(
  subreddit: string,
  limit: number = 100
): Promise<RedditPostItem[]> {
  const res = await fetch(
    `${REDDIT_JSON}/r/${subreddit}/new.json?limit=${limit}`,
    { headers: { Accept: "application/json" } }
  );
  if (!res.ok) throw new Error("Failed to fetch from Reddit");
  const json: { data?: { children?: ListingChild[] } } = await res.json();
  const children = json?.data?.children ?? [];
  const posts: RedditPostItem[] = [];

  for (const child of children) {
    const d = child?.data;
    if (!d?.id || !d.title) continue;
    posts.push({
      id: `reddit-${d.id}`,
      title: d.title,
      subreddit: d.subreddit ?? subreddit,
      author: d.author ?? "[deleted]",
      selftext: d.selftext ?? "",
      created_utc: d.created_utc ?? 0,
      score: d.score ?? 0,
      num_comments: d.num_comments ?? 0,
      permalink: d.permalink ? `https://www.reddit.com${d.permalink}` : "",
      url: d.url ?? "",
      comments: [],
      source: "reddit",
    });
  }

  return posts;
}
