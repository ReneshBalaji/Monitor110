"use client";

import Link from "next/link";

const sections = [
  {
    id: "crypto",
    title: "Crypto",
    description: "Trending discussions and articles for Bitcoin, Ethereum, Solana, and more. Community + news, legitimacy-scored.",
    href: "/explore/crypto",
    icon: "₿",
  },
  {
    id: "stocks",
    title: "Stocks",
    description: "Equity and market discussions from r/stocks and r/investing. Legitimacy-scored news and keyword spikes.",
    href: "/explore/stocks",
    icon: "📈",
  },
  {
    id: "real-estate",
    title: "Real Estate",
    description: "Property and market sentiment from r/realestate and r/realestateinvesting. Legitimacy-scored news and keyword spikes.",
    href: "/explore/real-estate",
    icon: "🏠",
  },
];

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-slate-50/80">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-5">
          <Link
            href="/"
            className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
          >
            ← Back
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">
          Choose a category
        </h1>
        <p className="text-slate-600 mb-10">
          Select an asset class to fetch trending news and legitimacy-scored
          insights from community and articles.
        </p>

        <div className="space-y-5">
          {sections.map((s, i) => (
            <Link
              key={s.id}
              href={s.href}
              className="block rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-200 hover:shadow-md hover:shadow-blue-50/50 transition-all duration-300 animate-fade-in-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <span className="text-3xl mb-3 block" aria-hidden>
                {s.icon}
              </span>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                {s.title}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {s.description}
              </p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
