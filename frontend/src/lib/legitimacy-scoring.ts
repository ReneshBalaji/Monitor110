import type { RedditPostItem, KeywordSpike, ScoredPost, SpikeSentiment, TimeWindow } from "./explore-types";

/** Keywords for scoring and spike detection. Includes tickers so we get enough matches; coin ticker is excluded from displayed spikes. */
const CRYPTO_KEYWORDS: Record<string, string[]> = {
  bitcoin: ["btc", "etf", "halving", "mining", "regulation", "sec", "exchange", "hack", "adoption", "institutional", "whale", "custody", "lightning", "ordinals", "macro", "inflation"],
  ethereum: ["eth", "etf", "merge", "staking", "defi", "layer 2", "l2", "regulation", "sec", "gas", "upgrade", "validators", "yield", "liquidity"],
  solana: ["sol", "etf", "pump", "meme", "airdrop", "nft", "defi", "outage", "speed", "validator", "jito", "fees"],
  cardano: ["ada", "etf", "staking", "governance", "upgrade", "defi", "plutus", "hydra", "voltaire"],
  xrp: ["xrp", "ripple", "sec", "lawsuit", "regulation", "etf", "settlement", "cbdc", "cross-border"],
};

/** Don’t show the coin’s own ticker as a keyword spike. */
const COIN_TICKER_EXCLUDE_FROM_SPIKE: Record<string, string> = {
  bitcoin: "btc",
  ethereum: "eth",
  solana: "sol",
  cardano: "ada",
  xrp: "xrp",
};

export const STOCKS_KEYWORDS: string[] = [
  "earnings", "fed", "inflation", "recession", "etf", "dividend", "sec", "rally", "dip", "market", "trading", "rate", "cut", "jobs", "gdp", "stocks", "s&p", "nasdaq",
];

export const REALESTATE_KEYWORDS: string[] = [
  "mortgage", "rates", "housing", "rent", "inflation", "fed", "market", "recession", "interest", "refinance", "prices", "inventory", "buyers", "sellers", "reit", "property",
];

const NEGATIVE_WORDS = new Set(
  "scam fake rug pull hack hacked exploit dump ponzi fud fear worry risk".split(" ")
);
const POSITIVE_WORDS = new Set(
  "legit official confirmed approved etf adoption institutional real utility".split(" ")
);

function getKeywordMatches(
  text: string,
  coinId: string
): string[] {
  const keywords = CRYPTO_KEYWORDS[coinId] ?? CRYPTO_KEYWORDS.bitcoin;
  return getKeywordMatchesFromList(text, keywords);
}

function getKeywordMatchesFromList(text: string, keywords: string[]): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const kw of keywords) {
    if (lower.includes(kw)) found.push(kw);
  }
  return [...new Set(found)];
}

function sentimentScore(text: string): number {
  const lower = text.toLowerCase().replace(/[^\w\s]/g, " ");
  const words = lower.split(/\s+/).filter(Boolean);
  let pos = 0,
    neg = 0;
  for (const w of words) {
    if (POSITIVE_WORDS.has(w)) pos++;
    if (NEGATIVE_WORDS.has(w)) neg++;
  }
  const total = pos + neg || 1;
  return (pos - neg) / total;
}

function commentDiversity(post: RedditPostItem): number {
  const authors = new Set(post.comments.map((c) => c.author));
  return Math.min(authors.size / 5, 1) * 20;
}

function engagementScore(post: RedditPostItem): number {
  const score = Math.min(post.score / 500, 1) * 15;
  const comments = Math.min(post.num_comments / 30, 1) * 15;
  return score + comments;
}

function sentimentConsistency(post: RedditPostItem): number {
  const texts = [post.title, post.selftext, ...post.comments.map((c) => c.body)];
  const sentiments = texts.filter(Boolean).map(sentimentScore);
  if (sentiments.length < 2) return 10;
  const avg = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
  const variance =
    sentiments.reduce((acc, s) => acc + (s - avg) ** 2, 0) / sentiments.length;
  return Math.max(0, 15 - variance * 20);
}

function anomalyPenalty(post: RedditPostItem): number {
  let penalty = 0;
  const isNews = post.source === "news";
  if (post.score > 1000 && post.comments.length < 2 && !isNews) penalty += 25;
  if (post.comments.length === 0 && post.selftext.length < 50 && !isNews)
    penalty += 10;
  if (post.author === "[deleted]" || post.author === "AutoModerator")
    penalty += 5;
  return penalty;
}

function summarizeViability(post: RedditPostItem, matches: string[]): string {
  const comments = post.comments.map((c) => c.body).join(" ");
  const sent = sentimentScore(post.title + " " + post.selftext + " " + comments);
  const themes = matches.length ? matches.slice(0, 3).join(", ") : "general discussion";
  if (sent > 0.2)
    return `Positive sentiment around ${themes}. Comments align with topic.`;
  if (sent < -0.2)
    return `Cautious or negative sentiment on ${themes}. Verify claims.`;
  return `Neutral discussion on ${themes}. Mixed feedback from comments.`;
}

export function scorePost(
  post: RedditPostItem,
  coinId: string
): ScoredPost {
  const text = `${post.title} ${post.selftext} ${post.comments.map((c) => c.body).join(" ")}`;
  const keywordMatches = getKeywordMatches(text, coinId);
  const keywordScore = Math.min(keywordMatches.length * 8, 25);
  const engagement = engagementScore(post);
  const diversity = commentDiversity(post);
  const consistency = sentimentConsistency(post);
  const penalty = anomalyPenalty(post);
  const raw =
    keywordScore + engagement + diversity + consistency - penalty;
  const legitimacyScore = Math.max(0, Math.min(100, Math.round(raw)));
  const viabilitySummary = summarizeViability(post, keywordMatches);

  return {
    post,
    legitimacyScore,
    keywordMatches,
    viabilitySummary,
  };
}

export function scoreAndSort(
  posts: RedditPostItem[],
  coinId: string
): ScoredPost[] {
  const scored = posts.map((p) => scorePost(p, coinId));
  return scored.sort((a, b) => b.legitimacyScore - a.legitimacyScore);
}

function countKeywordOccurrences(
  posts: RedditPostItem[],
  coinId: string
): Record<string, number> {
  const keywords = CRYPTO_KEYWORDS[coinId] ?? CRYPTO_KEYWORDS.bitcoin;
  const counts: Record<string, number> = {};
  for (const kw of keywords) counts[kw] = 0;
  for (const post of posts) {
    const text = `${post.title} ${post.selftext} ${post.comments.map((c) => c.body).join(" ")}`.toLowerCase();
    for (const kw of keywords) {
      if (text.includes(kw)) counts[kw]++;
    }
  }
  return counts;
}

function getSpikeSentiment(text: string): SpikeSentiment {
  const score = sentimentScore(text);
  if (score > 0.15) return "positive";
  if (score < -0.15) return "mixed";
  return "neutral";
}

function cleanSnippet(text: string, maxLen: number = 140): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= maxLen) return t;
  const cut = t.slice(0, maxLen).trim();
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 80 ? cut.slice(0, lastSpace) : cut) + "…";
}

/** Co-occurrence: other keywords that appear in the same posts as this keyword. */
function getCoOccurringKeywords(
  keyword: string,
  posts: RedditPostItem[],
  coinId: string,
  keywords: string[]
): string[] {
  const postsWithKw = posts.filter((p) => {
    const t = `${p.title} ${p.selftext} ${p.comments.map((c) => c.body).join(" ")}`.toLowerCase();
    return t.includes(keyword);
  });
  const counts: Record<string, number> = {};
  for (const kw of keywords) {
    if (kw === keyword) continue;
    counts[kw] = 0;
  }
  for (const p of postsWithKw) {
    const t = `${p.title} ${p.selftext} ${p.comments.map((c) => c.body).join(" ")}`.toLowerCase();
    for (const kw of keywords) {
      if (kw !== keyword && t.includes(kw)) counts[kw]++;
    }
  }
  return Object.entries(counts)
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => k);
}

/** Build key-details summary for "Why trending" (spike, related topics, sentiment, sample). */
function buildExpandableSummary(
  keyword: string,
  spikePercent: number,
  coOccurring: string[],
  feedbackSummary: string,
  sentiment: SpikeSentiment
): string {
  const kw = keyword.charAt(0).toUpperCase() + keyword.slice(1);
  const lines: string[] = [
    `• Spike: +${spikePercent}% above average for this time window — getting more attention than usual.`,
    coOccurring.length > 0
      ? `• Related topics: ${coOccurring.map((k) => k.charAt(0).toUpperCase() + k.slice(1)).join(", ")} (often discussed together).`
      : `• Context: Mentions are up ${spikePercent}% vs other topics in this window.`,
    sentiment === "positive"
      ? "• Sentiment: Mostly positive in discussions."
      : sentiment === "mixed"
      ? "• Sentiment: Mixed or cautious."
      : "• Sentiment: Mostly neutral.",
  ];
  const hasFeedback = feedbackSummary && feedbackSummary !== "No summary available.";
  if (hasFeedback)
    lines.push(`• Sample: "${cleanSnippet(feedbackSummary, 100)}"`);
  return lines.join("\n");
}

/** Ignore keywords that appear in almost all posts (common / always-present). */
function filterCommonKeywords(
  counts: Record<string, number>,
  total: number,
  maxShare = 0.85
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [kw, count] of Object.entries(counts)) {
    if (total === 0) continue;
    const share = count / total;
    if (share <= maxShare) out[kw] = count;
  }
  return out;
}

export function computeKeywordSpikes(
  posts: RedditPostItem[],
  coinId: string
): KeywordSpike[] {
  const keywords = CRYPTO_KEYWORDS[coinId] ?? CRYPTO_KEYWORDS.bitcoin;
  const countsRaw = countKeywordOccurrences(posts, coinId);
  const total = posts.length || 1;
  const counts = filterCommonKeywords(countsRaw, total);
  const numKeywords = Object.keys(counts).length || 1;
  const avgRate = 1 / numKeywords;
  const spikes: KeywordSpike[] = [];

  const excludeTicker = COIN_TICKER_EXCLUDE_FROM_SPIKE[coinId];
  for (const [keyword, count] of Object.entries(counts)) {
    if (count === 0) continue;
    if (excludeTicker && keyword.toLowerCase() === excludeTicker.toLowerCase()) continue;
    const rate = count / total;
    const spikePercent =
      avgRate > 0 ? Math.round(((rate - avgRate) / avgRate) * 100) : 100;
    const displaySpike = spikePercent > 0 ? spikePercent : 50;
    if (spikePercent < 20) continue;

    const postWithKeyword = posts.find((p) => {
      const t = `${p.title} ${p.selftext} ${p.comments.map((c) => c.body).join(" ")}`.toLowerCase();
      return t.includes(keyword);
    });
    const commentSnippets = postWithKeyword?.comments
      .slice(0, 3)
      .map((c) => c.body)
      .join(" ") ?? "";
    const titleSelf = (postWithKeyword?.title ?? "") + " " + (postWithKeyword?.selftext ?? "");
    const rawFeedback = commentSnippets || titleSelf;
    const feedbackSummary = rawFeedback
      ? cleanSnippet(rawFeedback, 120)
      : "No summary available.";
    const textForSentiment = commentSnippets || titleSelf;
    const sentiment = getSpikeSentiment(textForSentiment);
    const coOccurring = getCoOccurringKeywords(keyword, posts, coinId, keywords);
    const expandableSummary = buildExpandableSummary(
      keyword,
      displaySpike,
      coOccurring,
      feedbackSummary,
      sentiment
    );

    spikes.push({
      keyword,
      spikePercent: displaySpike,
      feedbackSummary,
      sentiment,
      expandableSummary,
    });
  }

  return spikes.sort((a, b) => b.spikePercent - a.spikePercent).slice(0, 8);
}

export const TIME_WINDOW_SECONDS: Record<TimeWindow, number> = {
  "1h": 3600,
  "4h": 4 * 3600,
  "12h": 12 * 3600,
  "24h": 24 * 3600,
  "7d": 7 * 24 * 3600,
  "30d": 30 * 24 * 3600,
};

export function filterPostsByTimeWindow(
  posts: RedditPostItem[],
  windowKey: TimeWindow,
  nowSeconds: number = Math.floor(Date.now() / 1000)
): RedditPostItem[] {
  const since = nowSeconds - TIME_WINDOW_SECONDS[windowKey];
  return posts.filter((p) => p.created_utc >= since);
}

export function computeKeywordSpikesForWindow(
  posts: RedditPostItem[],
  coinId: string,
  windowKey: TimeWindow,
  nowSeconds?: number
): KeywordSpike[] {
  const filtered = filterPostsByTimeWindow(posts, windowKey, nowSeconds);
  if (filtered.length === 0) return [];
  return computeKeywordSpikes(filtered, coinId);
}

export function getTimeWindowKeys(): TimeWindow[] {
  return ["1h", "4h", "12h", "24h", "7d", "30d"];
}

/** Main key points from all fetched posts for the summary panel. */
export function generateKeyPointsSummary(
  posts: RedditPostItem[],
  coinId: string
): string[] {
  const keywords = CRYPTO_KEYWORDS[coinId] ?? CRYPTO_KEYWORDS.bitcoin;
  return generateKeyPointsSummaryGeneric(posts, keywords);
}

function countKeywordOccurrencesGeneric(
  posts: RedditPostItem[],
  keywords: string[]
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const kw of keywords) counts[kw] = 0;
  for (const post of posts) {
    const text = `${post.title} ${post.selftext} ${post.comments.map((c) => c.body).join(" ")}`.toLowerCase();
    for (const kw of keywords) {
      if (text.includes(kw)) counts[kw]++;
    }
  }
  return counts;
}

export function generateKeyPointsSummaryGeneric(
  posts: RedditPostItem[],
  keywords: string[]
): string[] {
  if (posts.length === 0) return [];
  const counts = countKeywordOccurrencesGeneric(posts, keywords);
  const topKeywords = Object.entries(counts)
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k]) => k);
  const allText = posts
    .map((p) => `${p.title} ${p.selftext} ${p.comments.map((c) => c.body).join(" ")}`)
    .join(" ");
  const overallSent = sentimentScore(allText);
  const sentimentLine =
    overallSent > 0.1
      ? "Overall sentiment is positive."
      : overallSent < -0.1
      ? "Overall sentiment is cautious or negative."
      : "Overall sentiment is mixed or neutral.";

  const bullets: string[] = [];
  if (topKeywords.length > 0) {
    bullets.push(
      `Most discussed topics: ${topKeywords.map((k) => k.charAt(0).toUpperCase() + k.slice(1)).join(", ")}.`
    );
  }
  bullets.push(sentimentLine);
  bullets.push(`Based on ${posts.length} items from sources.`);
  return bullets;
}

export function scorePostGeneric(
  post: RedditPostItem,
  keywords: string[]
): ScoredPost {
  const text = `${post.title} ${post.selftext} ${post.comments.map((c) => c.body).join(" ")}`;
  const keywordMatches = getKeywordMatchesFromList(text, keywords);
  const keywordScore = Math.min(keywordMatches.length * 8, 25);
  const engagement = engagementScore(post);
  const diversity = commentDiversity(post);
  const consistency = sentimentConsistency(post);
  const penalty = anomalyPenalty(post);
  const raw = keywordScore + engagement + diversity + consistency - penalty;
  const legitimacyScore = Math.max(0, Math.min(100, Math.round(raw)));
  const viabilitySummary = summarizeViability(post, keywordMatches);
  return { post, legitimacyScore, keywordMatches, viabilitySummary };
}

export function scoreAndSortGeneric(
  posts: RedditPostItem[],
  keywords: string[]
): ScoredPost[] {
  const scored = posts.map((p) => scorePostGeneric(p, keywords));
  return scored.sort((a, b) => b.legitimacyScore - a.legitimacyScore);
}

export function computeKeywordSpikesGeneric(
  posts: RedditPostItem[],
  keywords: string[]
): KeywordSpike[] {
  const countsRaw = countKeywordOccurrencesGeneric(posts, keywords);
  const total = posts.length || 1;
  const counts = filterCommonKeywords(countsRaw, total);
  const numKeywords = Object.keys(counts).length || 1;
  const avgRate = 1 / numKeywords;
  const spikes: KeywordSpike[] = [];

  for (const [keyword, count] of Object.entries(counts)) {
    if (count === 0) continue;
    const rate = count / total;
    const spikePercent = avgRate > 0 ? Math.round(((rate - avgRate) / avgRate) * 100) : 100;
    const displaySpike = spikePercent > 0 ? spikePercent : 50;
    if (spikePercent < 20) continue;

    const postWithKeyword = posts.find((p) => {
      const t = `${p.title} ${p.selftext} ${p.comments.map((c) => c.body).join(" ")}`.toLowerCase();
      return t.includes(keyword);
    });
    const commentSnippets = postWithKeyword?.comments.slice(0, 3).map((c) => c.body).join(" ") ?? "";
    const titleSelf = (postWithKeyword?.title ?? "") + " " + (postWithKeyword?.selftext ?? "");
    const rawFeedback = commentSnippets || titleSelf;
    const feedbackSummary = rawFeedback ? cleanSnippet(rawFeedback, 120) : "No summary available.";
    const sentiment = getSpikeSentiment(commentSnippets || titleSelf);
    const coOccurring = getCoOccurringKeywords(keyword, posts, "crypto", keywords);
    const expandableSummary = buildExpandableSummary(keyword, displaySpike, coOccurring, feedbackSummary, sentiment);
    spikes.push({ keyword, spikePercent: displaySpike, feedbackSummary, sentiment, expandableSummary });
  }
  return spikes.sort((a, b) => b.spikePercent - a.spikePercent).slice(0, 8);
}

export function computeKeywordSpikesForWindowGeneric(
  posts: RedditPostItem[],
  keywords: string[],
  windowKey: TimeWindow,
  nowSeconds?: number
): KeywordSpike[] {
  const filtered = filterPostsByTimeWindow(posts, windowKey, nowSeconds);
  if (filtered.length === 0) return [];
  return computeKeywordSpikesGeneric(filtered, keywords);
}
