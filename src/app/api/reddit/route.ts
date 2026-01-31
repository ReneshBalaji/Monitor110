import { NextRequest, NextResponse } from "next/server";

const REDDIT_BASE = "https://www.reddit.com";
const USER_AGENT = "Monitor110/1.0 (Portfolio Intelligence App)";

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

interface RedditPost {
  id: string;
  title: string;
  subreddit: string;
  author: string;
  selftext: string;
  created_utc: number;
  score: number;
  num_comments: number;
  permalink: string;
  url: string;
  comments: { body: string; author: string; score: number }[];
  source: "reddit";
}

async function fetchWithRetry(
  url: string,
  retries = 3,
  delay = 1000
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "application/json",
        },
        next: { revalidate: 60 }, // Cache for 60 seconds
      });
      if (res.ok) return res;
      if (res.status === 429) {
        // Rate limited, wait longer
        await new Promise((r) => setTimeout(r, delay * (i + 2)));
        continue;
      }
      if (res.status >= 500) {
        // Server error, retry
        await new Promise((r) => setTimeout(r, delay * (i + 1)));
        continue;
      }
      // Client error, don't retry
      throw new Error(`Reddit API error: ${res.status}`);
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, delay * (i + 1)));
    }
  }
  throw new Error("Failed to fetch after retries");
}

async function fetchComments(
  subreddit: string,
  postId: string
): Promise<{ body: string; author: string; score: number }[]> {
  try {
    const res = await fetchWithRetry(
      `${REDDIT_BASE}/r/${subreddit}/comments/${postId}.json?limit=8&sort=top`,
      2,
      500
    );
    const json = await res.json();
    const commentList = json?.[1]?.data?.children ?? [];
    return commentList
      .filter((c: CommentChild) => c?.data?.body && c.data.body !== "[deleted]")
      .slice(0, 6)
      .map((c: CommentChild) => ({
        body: c.data?.body ?? "",
        author: c.data?.author ?? "[deleted]",
        score: c.data?.score ?? 0,
      }));
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const subreddit = searchParams.get("subreddit");
  const type = searchParams.get("type") || "hot"; // "hot" or "new"
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
  const includeComments = searchParams.get("comments") !== "false";

  if (!subreddit) {
    return NextResponse.json({ error: "Missing subreddit" }, { status: 400 });
  }

  try {
    const endpoint = type === "new" ? "new" : "hot";
    const res = await fetchWithRetry(
      `${REDDIT_BASE}/r/${subreddit}/${endpoint}.json?limit=${limit}`
    );
    const json: { data?: { children?: ListingChild[] } } = await res.json();
    const children = json?.data?.children ?? [];

    if (children.length === 0) {
      return NextResponse.json({ posts: [], message: "No posts found" });
    }

    const posts: RedditPost[] = [];
    const postsToProcess = includeComments ? children.slice(0, 15) : children;

    // Fetch comments in parallel for efficiency (only for hot posts)
    if (includeComments && type === "hot") {
      const commentPromises = postsToProcess.map((child) => {
        const d = child?.data;
        if (!d?.id) return Promise.resolve([]);
        return fetchComments(subreddit, d.id);
      });
      const allComments = await Promise.all(commentPromises);

      postsToProcess.forEach((child, index) => {
        const d = child?.data;
        if (!d?.id || !d.title) return;
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
          comments: allComments[index] || [],
          source: "reddit",
        });
      });
    } else {
      // No comments needed (for "new" posts)
      for (const child of postsToProcess) {
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
    }

    return NextResponse.json({ posts });
  } catch (err) {
    console.error("Reddit fetch error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch Reddit data" },
      { status: 500 }
    );
  }
}
