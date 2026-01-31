import type { RedditPostItem } from "./explore-types";

/**
 * Twitter/X API v2 Integration
 * 
 * To enable Twitter, add these to your .env.local:
 *   TWITTER_BEARER_TOKEN=your_bearer_token
 * 
 * Get your API keys at: https://developer.twitter.com/en/portal/dashboard
 * Free tier: 1500 tweets/month read access
 */

const TWITTER_API_BASE = "https://api.twitter.com/2";

// Crypto-related Twitter accounts to follow for each coin
const CRYPTO_TWITTER_ACCOUNTS: Record<string, string[]> = {
  bitcoin: ["bitcoin", "saborbitcoin", "DocumentingBTC", "BitcoinMagazine", "whale_alert"],
  ethereum: ["ethereum", "VitalikButerin", "sassal0x", "EthereumDenver", "arbitrum"],
  solana: ["solaboratory", "aaboratory", "JupiterExchange", "phantom", "MagicEden"],
  cardano: ["Cardano", "IOHK_Charles", "InputOutputHK", "CardanoStiftung", "emaborgo"],
  xrp: ["Ripple", "baborgarlinghouse", "JoelKatz", "XRPLFoundation", "Ashokvishandas"],
};

// Search queries for each coin
const CRYPTO_SEARCH_QUERIES: Record<string, string> = {
  bitcoin: "(bitcoin OR btc OR #bitcoin) (news OR breaking OR update OR announcement) -is:retweet lang:en",
  ethereum: "(ethereum OR eth OR #ethereum) (news OR breaking OR update OR announcement) -is:retweet lang:en",
  solana: "(solana OR sol OR #solana) (news OR breaking OR update OR announcement) -is:retweet lang:en",
  cardano: "(cardano OR ada OR #cardano) (news OR breaking OR update OR announcement) -is:retweet lang:en",
  xrp: "(xrp OR ripple OR #xrp) (news OR breaking OR update OR announcement) -is:retweet lang:en",
};

interface TwitterTweet {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  public_metrics?: {
    like_count: number;
    retweet_count: number;
    reply_count: number;
  };
}

interface TwitterUser {
  id: string;
  name: string;
  username: string;
}

interface TwitterSearchResponse {
  data?: TwitterTweet[];
  includes?: {
    users?: TwitterUser[];
  };
  meta?: {
    result_count: number;
  };
}

/**
 * Search recent tweets (last 7 days) for a coin
 */
export async function searchTwitter(
  coinId: string,
  limit: number = 20,
  bearerToken?: string
): Promise<RedditPostItem[]> {
  const token = bearerToken || process.env.TWITTER_BEARER_TOKEN;
  if (!token) {
    return [];
  }

  const query = CRYPTO_SEARCH_QUERIES[coinId] || CRYPTO_SEARCH_QUERIES.bitcoin;
  
  try {
    const params = new URLSearchParams({
      query,
      max_results: Math.min(limit, 100).toString(),
      "tweet.fields": "created_at,public_metrics,author_id",
      "user.fields": "name,username",
      expansions: "author_id",
    });

    const res = await fetch(`${TWITTER_API_BASE}/tweets/search/recent?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        console.warn("Twitter API: Invalid bearer token");
      } else if (res.status === 429) {
        console.warn("Twitter API: Rate limited");
      }
      return [];
    }

    const data: TwitterSearchResponse = await res.json();
    
    if (!data.data || data.data.length === 0) {
      return [];
    }

    // Build user lookup map
    const userMap = new Map<string, TwitterUser>();
    for (const user of data.includes?.users || []) {
      userMap.set(user.id, user);
    }

    return data.data.map((tweet): RedditPostItem => {
      const user = userMap.get(tweet.author_id);
      const metrics = tweet.public_metrics;
      const engagement = (metrics?.like_count || 0) + (metrics?.retweet_count || 0) * 2;

      return {
        id: `twitter-${tweet.id}`,
        title: tweet.text.slice(0, 200),
        subreddit: "Twitter/X",
        author: user ? `@${user.username}` : "Unknown",
        selftext: tweet.text,
        created_utc: Math.floor(new Date(tweet.created_at).getTime() / 1000),
        score: engagement,
        num_comments: metrics?.reply_count || 0,
        permalink: `https://twitter.com/${user?.username || "i"}/status/${tweet.id}`,
        url: `https://twitter.com/${user?.username || "i"}/status/${tweet.id}`,
        comments: [],
        source: "twitter",
      };
    });
  } catch (err) {
    console.error("Twitter API error:", err);
    return [];
  }
}

/**
 * Get tweets from specific influential accounts
 */
export async function getInfluencerTweets(
  coinId: string,
  limit: number = 10,
  bearerToken?: string
): Promise<RedditPostItem[]> {
  const token = bearerToken || process.env.TWITTER_BEARER_TOKEN;
  if (!token) {
    return [];
  }

  const accounts = CRYPTO_TWITTER_ACCOUNTS[coinId] || CRYPTO_TWITTER_ACCOUNTS.bitcoin;
  const allTweets: RedditPostItem[] = [];

  // Fetch from top 3 accounts to stay within rate limits
  for (const username of accounts.slice(0, 3)) {
    try {
      // First get user ID
      const userRes = await fetch(
        `${TWITTER_API_BASE}/users/by/username/${username}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!userRes.ok) continue;
      const userData = await userRes.json();
      const userId = userData.data?.id;
      if (!userId) continue;

      // Then get their recent tweets
      const tweetsRes = await fetch(
        `${TWITTER_API_BASE}/users/${userId}/tweets?max_results=5&tweet.fields=created_at,public_metrics`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!tweetsRes.ok) continue;
      const tweetsData = await tweetsRes.json();

      for (const tweet of tweetsData.data || []) {
        const metrics = tweet.public_metrics;
        allTweets.push({
          id: `twitter-${tweet.id}`,
          title: tweet.text.slice(0, 200),
          subreddit: "Twitter/X",
          author: `@${username}`,
          selftext: tweet.text,
          created_utc: Math.floor(new Date(tweet.created_at).getTime() / 1000),
          score: (metrics?.like_count || 0) + (metrics?.retweet_count || 0) * 2,
          num_comments: metrics?.reply_count || 0,
          permalink: `https://twitter.com/${username}/status/${tweet.id}`,
          url: `https://twitter.com/${username}/status/${tweet.id}`,
          comments: [],
          source: "twitter",
        });
      }
    } catch {
      continue;
    }
  }

  return allTweets.slice(0, limit);
}

/**
 * Fetch all Twitter data for a coin (search + influencers)
 */
export async function fetchTwitterData(
  coinId: string,
  limit: number = 15
): Promise<RedditPostItem[]> {
  const token = process.env.TWITTER_BEARER_TOKEN;
  if (!token) {
    return [];
  }

  try {
    // Just use search - it's more efficient with rate limits
    const tweets = await searchTwitter(coinId, limit, token);
    return tweets;
  } catch {
    return [];
  }
}

/**
 * Check if Twitter API is configured
 */
export function isTwitterConfigured(): boolean {
  return !!process.env.TWITTER_BEARER_TOKEN;
}
