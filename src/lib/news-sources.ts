import type { RedditPostItem } from "./explore-types";

// RSS feed URLs for major crypto news sources
const CRYPTO_RSS_FEEDS: Record<string, string[]> = {
  bitcoin: [
    "https://www.coindesk.com/arc/outboundfeeds/rss/?outputType=xml",
    "https://decrypt.co/feed",
    "https://cointelegraph.com/rss",
    "https://bitcoinmagazine.com/feed",
  ],
  ethereum: [
    "https://www.coindesk.com/arc/outboundfeeds/rss/?outputType=xml",
    "https://decrypt.co/feed",
    "https://cointelegraph.com/rss",
    "https://www.theblock.co/rss.xml",
  ],
  solana: [
    "https://www.coindesk.com/arc/outboundfeeds/rss/?outputType=xml",
    "https://decrypt.co/feed",
    "https://cointelegraph.com/rss",
  ],
  cardano: [
    "https://www.coindesk.com/arc/outboundfeeds/rss/?outputType=xml",
    "https://decrypt.co/feed",
    "https://cointelegraph.com/rss",
  ],
  xrp: [
    "https://www.coindesk.com/arc/outboundfeeds/rss/?outputType=xml",
    "https://decrypt.co/feed",
    "https://cointelegraph.com/rss",
  ],
};

// Keywords to filter RSS items by coin
const COIN_FILTER_KEYWORDS: Record<string, string[]> = {
  bitcoin: ["bitcoin", "btc", "satoshi", "lightning", "ordinals", "halving"],
  ethereum: ["ethereum", "eth", "vitalik", "layer 2", "defi", "staking"],
  solana: ["solana", "sol", "phantom", "jupiter", "firedancer"],
  cardano: ["cardano", "ada", "hoskinson", "iohk", "voltaire"],
  xrp: ["xrp", "ripple", "garlinghouse", "sec lawsuit"],
};

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  source: string;
}

/**
 * Parse RSS XML and extract items
 */
function parseRSSXml(xml: string, sourceName: string): RSSItem[] {
  const items: RSSItem[] = [];
  
  // Simple regex-based XML parsing (works for most RSS feeds)
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  const matches = xml.matchAll(itemRegex);
  
  for (const match of matches) {
    const itemXml = match[1];
    
    const title = extractTag(itemXml, "title");
    const link = extractTag(itemXml, "link") || extractTag(itemXml, "guid");
    const pubDate = extractTag(itemXml, "pubDate");
    const description = extractTag(itemXml, "description") || extractTag(itemXml, "content:encoded") || "";
    
    if (title && link) {
      items.push({
        title: cleanHtml(title),
        link,
        pubDate,
        description: cleanHtml(description).slice(0, 500),
        source: sourceName,
      });
    }
  }
  
  return items;
}

function extractTag(xml: string, tag: string): string {
  // Handle CDATA
  const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i");
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();
  
  // Handle regular tags
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1].trim() : "";
}

function cleanHtml(text: string): string {
  return text
    .replace(/<[^>]+>/g, "") // Remove HTML tags
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getSourceName(url: string): string {
  if (url.includes("coindesk")) return "CoinDesk";
  if (url.includes("decrypt")) return "Decrypt";
  if (url.includes("cointelegraph")) return "Cointelegraph";
  if (url.includes("theblock")) return "The Block";
  if (url.includes("bitcoinmagazine")) return "Bitcoin Magazine";
  return "News";
}

/**
 * Fetch and parse a single RSS feed
 */
async function fetchRSSFeed(url: string): Promise<RSSItem[]> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Monitor110/1.0",
        Accept: "application/rss+xml, application/xml, text/xml",
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });
    
    if (!res.ok) return [];
    
    const xml = await res.text();
    return parseRSSXml(xml, getSourceName(url));
  } catch {
    return [];
  }
}

/**
 * Filter RSS items by coin-specific keywords
 */
function filterByCoin(items: RSSItem[], coinId: string): RSSItem[] {
  const keywords = COIN_FILTER_KEYWORDS[coinId] || COIN_FILTER_KEYWORDS.bitcoin;
  
  return items.filter((item) => {
    const text = `${item.title} ${item.description}`.toLowerCase();
    return keywords.some((kw) => text.includes(kw.toLowerCase()));
  });
}

/**
 * Convert RSS items to RedditPostItem format for unified processing
 */
function rssToPostItem(item: RSSItem, index: number): RedditPostItem {
  const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
  const createdUtc = Math.floor(pubDate.getTime() / 1000);
  
  return {
    id: `news-${index}-${Date.now()}`,
    title: item.title,
    subreddit: item.source,
    author: item.source,
    selftext: item.description,
    created_utc: createdUtc,
    score: 100, // Default score for news
    num_comments: 0,
    permalink: item.link,
    url: item.link,
    comments: [],
    source: "news",
  };
}

/**
 * Fetch news from RSS feeds for a specific coin
 */
export async function fetchNewsFromRSS(
  coinId: string,
  limit: number = 20
): Promise<RedditPostItem[]> {
  const feeds = CRYPTO_RSS_FEEDS[coinId] || CRYPTO_RSS_FEEDS.bitcoin;
  
  // Fetch all feeds in parallel
  const allItems = await Promise.all(feeds.map(fetchRSSFeed));
  const flatItems = allItems.flat();
  
  // Filter by coin keywords
  const filtered = filterByCoin(flatItems, coinId);
  
  // Remove duplicates by title similarity
  const seen = new Set<string>();
  const unique = filtered.filter((item) => {
    const key = item.title.toLowerCase().slice(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  // Sort by date (newest first) and limit
  const sorted = unique
    .sort((a, b) => {
      const dateA = new Date(a.pubDate || 0).getTime();
      const dateB = new Date(b.pubDate || 0).getTime();
      return dateB - dateA;
    })
    .slice(0, limit);
  
  return sorted.map((item, i) => rssToPostItem(item, i));
}

// CryptoPanic API (free tier)
const CRYPTOPANIC_BASE = "https://cryptopanic.com/api/v1";

interface CryptoPanicPost {
  id: number;
  title: string;
  url: string;
  source: { title: string };
  published_at: string;
  votes: { positive: number; negative: number };
}

/**
 * Fetch from CryptoPanic API (requires API key in env)
 */
export async function fetchFromCryptoPanic(
  coinId: string,
  limit: number = 20
): Promise<RedditPostItem[]> {
  const apiKey = process.env.CRYPTOPANIC_API_KEY;
  if (!apiKey) return []; // Skip if no API key
  
  const currencyMap: Record<string, string> = {
    bitcoin: "BTC",
    ethereum: "ETH",
    solana: "SOL",
    cardano: "ADA",
    xrp: "XRP",
  };
  
  const currency = currencyMap[coinId] || "BTC";
  
  try {
    const res = await fetch(
      `${CRYPTOPANIC_BASE}/posts/?auth_token=${apiKey}&currencies=${currency}&kind=news&public=true`,
      { next: { revalidate: 300 } }
    );
    
    if (!res.ok) return [];
    
    const data = await res.json();
    const results = (data.results || []) as CryptoPanicPost[];
    
    return results.slice(0, limit).map((post, i): RedditPostItem => ({
      id: `cryptopanic-${post.id}`,
      title: post.title,
      subreddit: post.source.title,
      author: post.source.title,
      selftext: "",
      created_utc: Math.floor(new Date(post.published_at).getTime() / 1000),
      score: (post.votes?.positive || 0) - (post.votes?.negative || 0),
      num_comments: 0,
      permalink: post.url,
      url: post.url,
      comments: [],
      source: "news",
    }));
  } catch {
    return [];
  }
}

// CoinGecko API (free, no key required)
const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

interface CoinGeckoNews {
  title: string;
  description: string;
  url: string;
  news_site: string;
  created_at: string;
}

/**
 * Fetch trending/status updates from CoinGecko
 */
export async function fetchFromCoinGecko(
  coinId: string
): Promise<RedditPostItem[]> {
  const coinMap: Record<string, string> = {
    bitcoin: "bitcoin",
    ethereum: "ethereum",
    solana: "solana",
    cardano: "cardano",
    xrp: "ripple",
  };
  
  const geckoId = coinMap[coinId] || "bitcoin";
  
  try {
    // Get coin status updates
    const res = await fetch(
      `${COINGECKO_BASE}/coins/${geckoId}/status_updates`,
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 600 },
      }
    );
    
    if (!res.ok) return [];
    
    const data = await res.json();
    const updates = data.status_updates || [];
    
    return updates.slice(0, 10).map((update: { description: string; created_at: string; user: string; project: { name: string } }, i: number): RedditPostItem => ({
      id: `coingecko-${i}-${Date.now()}`,
      title: update.description?.slice(0, 100) || "Update",
      subreddit: "CoinGecko",
      author: update.user || update.project?.name || "CoinGecko",
      selftext: update.description || "",
      created_utc: Math.floor(new Date(update.created_at).getTime() / 1000),
      score: 50,
      num_comments: 0,
      permalink: `https://www.coingecko.com/en/coins/${geckoId}`,
      url: `https://www.coingecko.com/en/coins/${geckoId}`,
      comments: [],
      source: "news",
    }));
  } catch {
    return [];
  }
}

/**
 * Fetch from all news sources and combine with Reddit data
 */
export async function fetchAllNewsSources(
  coinId: string,
  limit: number = 15
): Promise<RedditPostItem[]> {
  const [rssNews, cryptoPanicNews, coinGeckoNews] = await Promise.all([
    fetchNewsFromRSS(coinId, limit),
    fetchFromCryptoPanic(coinId, limit),
    fetchFromCoinGecko(coinId),
  ]);
  
  // Combine all sources
  const all = [...rssNews, ...cryptoPanicNews, ...coinGeckoNews];
  
  // Remove duplicates by title
  const seen = new Set<string>();
  const unique = all.filter((item) => {
    const key = item.title.toLowerCase().slice(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  // Sort by date and limit
  return unique
    .sort((a, b) => b.created_utc - a.created_utc)
    .slice(0, limit);
}
