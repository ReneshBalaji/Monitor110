import type { Insight, DashboardMetrics } from "./types";

export const mockInsights: Insight[] = [
  {
    id: "1",
    topic: "Negative sentiment spike in Banking sector",
    sentiment: "negative",
    timeContext: "2 min ago",
    confidence: 0.82,
  },
  {
    id: "2",
    topic: "Positive momentum in EV discussions",
    sentiment: "positive",
    timeContext: "3 min ago",
    confidence: 0.78,
  },
  {
    id: "3",
    topic: "Neutral chatter around Fed meeting",
    sentiment: "neutral",
    timeContext: "5 min ago",
    confidence: 0.65,
  },
  {
    id: "4",
    topic: "Bearish tone on regional banks",
    sentiment: "negative",
    timeContext: "7 min ago",
    confidence: 0.71,
  },
  {
    id: "5",
    topic: "Bullish sentiment on AI stocks",
    sentiment: "positive",
    timeContext: "9 min ago",
    confidence: 0.84,
  },
  {
    id: "6",
    topic: "Mixed views on crypto regulation",
    sentiment: "neutral",
    timeContext: "12 min ago",
    confidence: 0.58,
  },
  {
    id: "7",
    topic: "Positive buzz around earnings beats",
    sentiment: "positive",
    timeContext: "15 min ago",
    confidence: 0.76,
  },
  {
    id: "8",
    topic: "Concern over inflation data",
    sentiment: "negative",
    timeContext: "18 min ago",
    confidence: 0.69,
  },
];

export const mockDashboard: DashboardMetrics = {
  overallSentiment: "neutral",
  sentimentScore: -12,
  activeSignalsCount: 24,
  trendData: [
    { time: "10:00", value: 8 },
    { time: "10:15", value: 2 },
    { time: "10:30", value: -5 },
    { time: "10:45", value: -12 },
    { time: "11:00", value: -8 },
    { time: "11:15", value: -12 },
    { time: "11:30", value: -15 },
    { time: "11:45", value: -10 },
    { time: "12:00", value: -12 },
  ],
};
