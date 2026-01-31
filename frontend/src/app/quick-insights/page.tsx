"use client";

import AppNav from "@/components/AppNav";
import { mockInsights } from "@/lib/mock-data";
import type { Sentiment } from "@/lib/types";

function SentimentPill({ sentiment }: { sentiment: Sentiment }) {
  const styles: Record<Sentiment, string> = {
    positive: "bg-teal-100 text-teal-800",
    negative: "bg-red-100 text-red-800",
    neutral: "bg-slate-100 text-slate-700",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${styles[sentiment]}`}
    >
      {sentiment}
    </span>
  );
}

export default function QuickInsightsPage() {
  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900">
      <AppNav />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight mb-2">
          Quick Insights
        </h1>
        <p className="text-sm text-slate-600 mb-8">
          Fast updates — scan in seconds
        </p>

        <ul className="space-y-0 divide-y divide-slate-200 border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
          {mockInsights.map((insight) => (
            <li
              key={insight.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 hover:bg-slate-50 transition-colors"
            >
              <p className="text-slate-900 font-medium text-sm sm:text-base flex-1">
                {insight.topic}
              </p>
              <div className="flex items-center gap-3 flex-shrink-0">
                <SentimentPill sentiment={insight.sentiment} />
                <span className="text-xs text-slate-500 tabular-nums">
                  {insight.timeContext}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
