export type CoinId = "bitcoin" | "ethereum" | "solana" | "cardano" | "xrp";

export type FeedSource = "reddit" | "news" | "twitter";

export interface RedditPostItem {
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
  source?: FeedSource;
}

export type SpikeSentiment = "positive" | "mixed" | "neutral";

export interface KeywordSpike {
  keyword: string;
  spikePercent: number;
  feedbackSummary: string;
  sentiment?: SpikeSentiment;
  expandableSummary?: string;
}

export type TimeWindow = "1h" | "4h" | "12h" | "24h" | "7d" | "30d";

export interface ScoredPost {
  post: RedditPostItem;
  legitimacyScore: number;
  keywordMatches: string[];
  viabilitySummary: string;
}
