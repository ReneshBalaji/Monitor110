export type Sentiment = "positive" | "negative" | "neutral";

export interface Insight {
  id: string;
  topic: string;
  sentiment: Sentiment;
  timeContext: string;
  confidence?: number;
}

export interface DashboardMetrics {
  overallSentiment: Sentiment;
  sentimentScore: number; // -100 to 100
  activeSignalsCount: number;
  trendData: { time: string; value: number }[];
}
