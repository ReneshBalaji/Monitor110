"use client";

import Link from "next/link";
import CryptoNav from "@/components/CryptoNav";

const cards = [
  {
    href: "/live-sample",
    icon: "📡",
    title: "Live Sample",
    snippet: "Proof of Reddit connectivity. Fetch one latest post and top comments for Bitcoin or Ethereum.",
  },
  {
    href: "/demo-scenarios",
    icon: "🔄",
    title: "Demo Scenarios",
    snippet: "Discussion Intelligence Replay. Five selectable days with volume, sentiment, and auto-generated summaries.",
  },
  {
    href: "/about",
    icon: "📐",
    title: "Architecture & Ethics",
    snippet: "Data source, processing, storage, and output. Read-only, no tracking, academic demonstration only.",
  },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <CryptoNav />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <section className="text-center mb-16">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Crypto Discussion Intelligence Prototype
          </h1>
          <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">
            Near real-time monitoring of online discussions for informational awareness.
          </p>
          <p className="mt-4 text-sm text-amber-400/90 font-medium">
            This system does not provide financial predictions or trading advice.
          </p>
        </section>

        <section className="grid gap-6 sm:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-xl border border-white/10 bg-white/5 p-6 hover:bg-white/[0.08] hover:border-violet-500/30 transition-all group"
            >
              <span className="text-3xl mb-4 block" aria-hidden>
                {card.icon}
              </span>
              <h2 className="text-lg font-semibold text-white mb-2 group-hover:text-violet-300 transition-colors">
                {card.title}
              </h2>
              <p className="text-sm text-white/70 leading-relaxed">
                {card.snippet}
              </p>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
