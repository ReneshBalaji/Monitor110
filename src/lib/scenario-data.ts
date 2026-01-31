import type { RedditPost, RedditComment, ScenarioId } from "./crypto-types";

const basePosts: Omit<RedditPost, "comments">[] = [
  {
    id: "p1",
    title: "Thoughts on ETF approval timeline",
    subreddit: "CryptoCurrency",
    author: "user_a",
    selftext: "Just wondering when we might see movement on the ETF front. Anyone else following this?",
    created_utc: 0,
    score: 42,
    num_comments: 12,
  },
  {
    id: "p2",
    title: "Exchange security concerns after recent news",
    subreddit: "Bitcoin",
    author: "user_b",
    selftext: "With the recent hack reports, how do you all secure your holdings?",
    created_utc: 0,
    score: 89,
    num_comments: 34,
  },
  {
    id: "p3",
    title: "Regulation discussion megathread",
    subreddit: "ethereum",
    author: "user_c",
    selftext: "Consolidating regulatory updates and community views here.",
    created_utc: 0,
    score: 156,
    num_comments: 78,
  },
];

// Day 1 – Normal discussion (baseline)
const day1Comments: Record<string, RedditComment[]> = {
  p1: [
    { id: "c1", author: "u1", body: "Probably next quarter. Patience.", score: 5, created_utc: 0 },
    { id: "c2", author: "u2", body: "No one knows for sure. Just hold.", score: 3, created_utc: 0 },
    { id: "c3", author: "u3", body: "I'm optimistic but not holding my breath.", score: 8, created_utc: 0 },
  ],
  p2: [
    { id: "c4", author: "u4", body: "Hardware wallet. Always.", score: 12, created_utc: 0 },
    { id: "c5", author: "u5", body: "The hack was unfortunate. Self-custody is key.", score: 7, created_utc: 0 },
  ],
  p3: [
    { id: "c6", author: "u6", body: "Regulation is inevitable. Hope it's sensible.", score: 9, created_utc: 0 },
  ],
};

// Day 2 – Slight increase
const day2Comments: Record<string, RedditComment[]> = {
  p1: [
    ...day1Comments.p1,
    { id: "c7", author: "u7", body: "Rumors are heating up. Could be soon.", score: 15, created_utc: 0 },
    { id: "c8", author: "u8", body: "I'm bullish on approval this year.", score: 11, created_utc: 0 },
  ],
  p2: [
    ...day1Comments.p2,
    { id: "c9", author: "u9", body: "More exchanges need to step up security.", score: 6, created_utc: 0 },
  ],
  p3: [
    ...day1Comments.p3,
    { id: "c10", author: "u10", body: "New draft legislation looks reasonable.", score: 14, created_utc: 0 },
  ],
};

// Day 3 – Discussion spike (fear/uncertainty)
const day3Comments: Record<string, RedditComment[]> = {
  p1: [
    ...day2Comments.p1,
    { id: "c11", author: "u11", body: "ETF delayed again. This is frustrating.", score: 45, created_utc: 0 },
    { id: "c12", author: "u12", body: "Why does everything take so long?", score: 32, created_utc: 0 },
    { id: "c13", author: "u13", body: "Not surprised. Disappointed.", score: 28, created_utc: 0 },
  ],
  p2: [
    ...day2Comments.p2,
    { id: "c14", author: "u14", body: "Another exchange hacked. When will this stop?", score: 89, created_utc: 0 },
    { id: "c15", author: "u15", body: "I'm moving everything off exchanges. Too risky.", score: 67, created_utc: 0 },
    { id: "c16", author: "u16", body: "Security is a joke at some of these places.", score: 54, created_utc: 0 },
    { id: "c17", author: "u17", body: "Really worried about my holdings now.", score: 41, created_utc: 0 },
  ],
  p3: [
    ...day2Comments.p3,
    { id: "c18", author: "u18", body: "New regulations could hurt innovation.", score: 56, created_utc: 0 },
    { id: "c19", author: "u19", body: "Uncertainty is killing the market.", score: 44, created_utc: 0 },
  ],
};

// Day 4 – Cooling phase
const day4Comments: Record<string, RedditComment[]> = {
  p1: [
    ...day3Comments.p1.slice(0, -1),
    { id: "c20", author: "u20", body: "Delays happen. Still confident long-term.", score: 22, created_utc: 0 },
  ],
  p2: [
    ...day3Comments.p2.slice(0, 2),
    { id: "c21", author: "u21", body: "Exchanges are responding with new safeguards.", score: 18, created_utc: 0 },
    { id: "c22", author: "u22", body: "Took my coins off. Feel better now.", score: 12, created_utc: 0 },
  ],
  p3: [
    ...day3Comments.p3,
    { id: "c23", author: "u23", body: "Clarity will come. Just need to wait.", score: 19, created_utc: 0 },
  ],
};

// Day 5 – Post-event normalization
const day5Comments: Record<string, RedditComment[]> = {
  p1: [
    { id: "c24", author: "u24", body: "Back to normal discussion. ETF will happen when it happens.", score: 8, created_utc: 0 },
    { id: "c25", author: "u25", body: "Community is calmer. Good.", score: 6, created_utc: 0 },
  ],
  p2: [
    { id: "c26", author: "u26", body: "Security practices improving. Learned from the incident.", score: 11, created_utc: 0 },
    { id: "c27", author: "u27", body: "Still prefer self-custody but less panic now.", score: 7, created_utc: 0 },
  ],
  p3: [
    { id: "c28", author: "u28", body: "Regulation discussion is more balanced now.", score: 9, created_utc: 0 },
  ],
};

function buildScenario(
  day: ScenarioId,
  commentMap: Record<string, RedditComment[]>
): RedditPost[] {
  return basePosts.map((p) => ({
    ...p,
    comments: commentMap[p.id] || [],
  }));
}

export const scenarioData: Record<ScenarioId, RedditPost[]> = {
  day1: buildScenario("day1", day1Comments),
  day2: buildScenario("day2", day2Comments),
  day3: buildScenario("day3", day3Comments),
  day4: buildScenario("day4", day4Comments),
  day5: buildScenario("day5", day5Comments),
};

export const scenarioVolume: Record<ScenarioId, number> = {
  day1: 22,
  day2: 31,
  day3: 89,
  day4: 52,
  day5: 28,
};
