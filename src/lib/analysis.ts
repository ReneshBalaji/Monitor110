import type {
  RedditPost,
  RedditComment,
  Topic,
  SentimentBreakdown,
  IntelligenceOutput,
  ScenarioId,
} from "./crypto-types";
import { scenarioVolume } from "./scenario-data";

const NEGATIVE_WORDS = new Set(
  "hack hacked worry worried fear concern risk risky delay delayed frustrating disappointed uncertainty kill hurt security breach stolen".split(
    " "
  )
);
const POSITIVE_WORDS = new Set(
  "bullish optimistic confident approve approval sensible reasonable good better safe secure hope patience hold long-term".split(
    " "
  )
);

function getTextSentiment(text: string): "positive" | "negative" | "neutral" {
  const lower = text.toLowerCase().replace(/[^\w\s]/g, " ");
  const words = lower.split(/\s+/).filter(Boolean);
  let pos = 0,
    neg = 0;
  for (const w of words) {
    if (POSITIVE_WORDS.has(w)) pos++;
    if (NEGATIVE_WORDS.has(w)) neg++;
  }
  if (pos > neg) return "positive";
  if (neg > pos) return "negative";
  return "neutral";
}

function aggregateSentiment(posts: RedditPost[]): SentimentBreakdown {
  let pos = 0,
    neg = 0,
    neu = 0;
  const add = (text: string) => {
    const s = getTextSentiment(text);
    if (s === "positive") pos++;
    else if (s === "negative") neg++;
    else neu++;
  };
  for (const p of posts) {
    add(p.title);
    add(p.selftext);
    for (const c of p.comments) add(c.body);
  }
  const total = pos + neg + neu || 1;
  return {
    positive: Math.round((pos / total) * 100),
    negative: Math.round((neg / total) * 100),
    neutral: Math.round((neu / total) * 100),
  };
}

function sentimentToScore(breakdown: SentimentBreakdown): number {
  const { positive, negative, neutral } = breakdown;
  const total = positive + negative + neutral || 1;
  const raw = (positive - negative) / total;
  return Math.max(-1, Math.min(1, Math.round(raw * 100) / 100));
}

function getDiscussionChangePercent(
  scenarioId: ScenarioId,
  volume: number
): string {
  const order: ScenarioId[] = ["day1", "day2", "day3", "day4", "day5"];
  const idx = order.indexOf(scenarioId);
  if (idx <= 0) return "baseline";
  const prev = scenarioVolume[order[idx - 1]];
  const change = prev === 0 ? 0 : Math.round(((volume - prev) / prev) * 100);
  return change >= 0 ? `+${change}%` : `${change}%`;
}

function isSpike(scenarioId: ScenarioId, volume: number): boolean {
  const order: ScenarioId[] = ["day1", "day2", "day3", "day4", "day5"];
  const idx = order.indexOf(scenarioId);
  if (idx <= 0) return false;
  const prev = scenarioVolume[order[idx - 1]];
  const change = prev === 0 ? 0 : (volume - prev) / prev;
  return change >= 0.5;
}

function generateSummary(
  breakdown: SentimentBreakdown,
  spike: boolean,
  topic: Topic,
  keyword: string
): string {
  const score = sentimentToScore(breakdown);
  const parts: string[] = [];
  if (spike)
    parts.push(
      `Discussion volume spiked with heightened attention on ${keyword.toLowerCase()} topics.`
    );
  if (score < -0.3)
    parts.push(
      `Sentiment is predominantly negative, with concern around ${keyword.toLowerCase()} and ${topic} discussions.`
    );
  else if (score > 0.3)
    parts.push(
      `Sentiment is predominantly positive, with optimism in ${topic} and ${keyword.toLowerCase()} discussions.`
    );
  else
    parts.push(
      `Sentiment is mixed or neutral, with balanced views on ${keyword.toLowerCase()} and ${topic}.`
    );
  if (breakdown.negative > 40)
    parts.push("Themes include security, regulation, and uncertainty.");
  if (breakdown.positive > 40)
    parts.push("Themes include approval timelines, long-term outlook, and adoption.");
  return parts.join(" ");
}

const KEYWORDS: Record<ScenarioId, string> = {
  day1: "ETF",
  day2: "ETF",
  day3: "Exchange / Hack",
  day4: "Regulation",
  day5: "Normalization",
};

export function analyzeScenario(
  posts: RedditPost[],
  scenarioId: ScenarioId,
  topic: Topic = "Bitcoin"
): IntelligenceOutput {
  const volume = scenarioVolume[scenarioId];
  const sentimentBreakdown = aggregateSentiment(posts);
  const sentimentScore = sentimentToScore(sentimentBreakdown);
  const discussionChange = getDiscussionChangePercent(scenarioId, volume);
  const spikeDetected = isSpike(scenarioId, volume);
  const keywordMonitored = KEYWORDS[scenarioId];
  const summary = generateSummary(
    sentimentBreakdown,
    spikeDetected,
    topic,
    keywordMonitored
  );

  return {
    topic,
    keywordMonitored,
    discussionChange,
    spikeDetected,
    sentimentBreakdown,
    sentimentScore,
    summary,
  };
}

export function getVolumeChartData(): { day: string; volume: number }[] {
  const labels: Record<ScenarioId, string> = {
    day1: "Day 1",
    day2: "Day 2",
    day3: "Day 3",
    day4: "Day 4",
    day5: "Day 5",
  };
  return (["day1", "day2", "day3", "day4", "day5"] as ScenarioId[]).map(
    (id) => ({
      day: labels[id],
      volume: scenarioVolume[id],
    })
  );
}
