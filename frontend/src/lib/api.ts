/**
 * API client — swap mock data for these calls when backend is ready.
 * Backend: FastAPI at /signals returns ranked signals (text, type, subreddit, score).
 * Map backend response to Insight[] (topic, sentiment, timeContext) in your data layer.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function fetchSignals(): Promise<unknown> {
  const res = await fetch(`${API_BASE}/signals/`);
  if (!res.ok) throw new Error("Failed to fetch signals");
  return res.json();
}
