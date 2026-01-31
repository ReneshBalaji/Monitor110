"use client";

import CryptoNav from "@/components/CryptoNav";

const architecture = [
  {
    title: "Data source",
    body: "Public community discussions and news articles (read-only). Multiple sources: forums, aggregators, and news. No authentication required for public feeds.",
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
  "Read-only public data usage. No posting or modifying source content.",
  "No user tracking. No cookies or analytics for personal identification.",
  "No financial advice. This system does not provide trading or investment recommendations.",
  "Academic demonstration only. Not a production trading or prediction system.",
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900">
      <CryptoNav />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">
          Architecture & Ethics
        </h1>
        <p className="text-sm text-slate-600 mb-10">
          How the system is designed and the constraints it follows.
        </p>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Architecture
          </h2>
          <div className="space-y-4">
            {architecture.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <h3 className="text-sm font-medium text-blue-700 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Technical constraints & ethics
          </h2>
          <ul className="space-y-3">
            {ethics.map((item, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm"
              >
                <span className="text-blue-600 shrink-0" aria-hidden>✓</span>
                {item}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
