export type Topic = "Bitcoin" | "Ethereum";
export type ScenarioId = "day1" | "day2" | "day3" | "day4" | "day5";

export interface RedditComment {
  id: string;
  author: string;
  body: string;
  score: number;
  created_utc: number;
}

export interface RedditPost {
  id: string;
  title: string;
  subreddit: string;
  author: string;
  selftext: string;
  created_utc: number;
  score: number;
  num_comments: number;
  comments: RedditComment[];
}

export interface SentimentBreakdown {
  positive: number;
  negative: number;
  neutral: number;
}

export interface IntelligenceOutput {
  topic: Topic;
  keywordMonitored: string;
  discussionChange: string;
  spikeDetected: boolean;
  sentimentBreakdown: SentimentBreakdown;
  sentimentScore: number;
  summary: string;
}

export interface ScenarioMeta {
  id: ScenarioId;
  label: string;
  description: string;
  volume: number;
  sentimentBreakdown: SentimentBreakdown;
  sentimentScore: number;
}
