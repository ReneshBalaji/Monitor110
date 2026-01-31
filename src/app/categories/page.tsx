"use client";

import Link from "next/link";

const sections = [
  {
    id: "crypto",
    title: "Crypto",
    description: "Trending Reddit discussions for Bitcoin, Ethereum, Solana, and more. Legitimacy-scored news to inform your crypto decisions.",
    href: "/explore/crypto",
    icon: "₿",
  },
  {
    id: "stocks",
    title: "Stocks",
    description: "Equity and market discussions from r/stocks, r/investing, r/wallstreetbets. Legitimacy-scored news and keyword spikes.",
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
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Link
            href="/"
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            ← Back
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-semibold text-white mb-2">
          Choose a category
        </h1>
        <p className="text-white/70 mb-10">
          Select an asset class to fetch trending news and legitimacy-scored
          insights from Reddit.
        </p>

        <div className="space-y-6">
          {sections.map((s, i) => (
            <Link
              key={s.id}
              href={s.href}
              className="block rounded-xl border border-white/10 bg-white/5 p-6 hover:bg-white/[0.08] hover:border-violet-500/30 transition-all duration-300 animate-fade-in-up hover:scale-[1.02] hover:shadow-xl hover:shadow-violet-500/10"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <span className="text-3xl mb-3 block animate-pulse-slow" aria-hidden>
                {s.icon}
              </span>
              <h2 className="text-lg font-semibold text-white mb-2">
                {s.title}
              </h2>
              <p className="text-sm text-white/70 leading-relaxed">
                {s.description}
              </p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
