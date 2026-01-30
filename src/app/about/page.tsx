"use client";

import CryptoNav from "@/components/CryptoNav";

const architecture = [
  {
    title: "Data source",
    body: "Public Reddit discussions (read-only). No authentication required for public subreddits. Example: r/bitcoin, r/ethereum.",
  },
  {
    title: "Processing",
    body: "Keyword expansion, sentiment analysis (positive / negative / neutral), and spike detection by comparing discussion volume and tone across time windows.",
  },
  {
    title: "Storage",
    body: "Summarized intelligence only. No raw posts or comments are stored in this prototype. Live Sample fetches on demand; Demo uses pre-stored samples.",
  },
  {
    title: "Output",
    body: "Information awareness—structured summaries and sentiment breakdowns. Not price prediction, not buy/sell signals, not real-time market forecasting.",
  },
];

const ethics = [
  "Read-only public data usage. No posting or modifying Reddit content.",
  "No user tracking. No cookies or analytics for personal identification.",
  "No financial advice. This system does not provide trading or investment recommendations.",
  "Academic demonstration only. Not a production trading or prediction system.",
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <CryptoNav />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-2xl font-semibold text-white mb-2">
          Architecture & Ethics
        </h1>
        <p className="text-sm text-white/70 mb-10">
          How the system is designed and the constraints it follows.
        </p>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-white mb-4">
            Architecture
          </h2>
          <div className="space-y-4">
            {architecture.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-white/10 bg-white/5 p-5"
              >
                <h3 className="text-sm font-medium text-violet-300 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-white/80 leading-relaxed">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-4">
            Technical constraints & ethics
          </h2>
          <ul className="space-y-3">
            {ethics.map((item, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/90"
              >
                <span className="text-violet-400 shrink-0" aria-hidden>✓</span>
                {item}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
