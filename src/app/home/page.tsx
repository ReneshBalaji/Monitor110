"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const overviewCards = [
  {
    id: "1",
    icon: "📊",
    title: "Sentiment at a glance",
    snippet: "Real-time Reddit discussions clustered by topic with positive, negative, or neutral sentiment.",
  },
  {
    id: "2",
    icon: "⚡",
    title: "Quick Insights",
    snippet: "Scan market-moving themes in seconds—no charts, no clutter. Built for fast decisions.",
  },
  {
    id: "3",
    icon: "🔗",
    title: "From Reddit to you",
    snippet: "Finance, stocks, crypto subreddits aggregated and analyzed. Discussion trends, not price calls.",
  },
  {
    id: "4",
    icon: "📈",
    title: "Dashboard overview",
    snippet: "Overall sentiment score, trend chart, and active signal count. One screen to orient.",
  },
];

function OverviewNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-white/10 bg-black">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <Link
          href="/home"
          className="text-lg font-semibold text-violet-400 tracking-tight"
        >
          Monitor110
        </Link>
        <nav className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1.5">
          <Link
            href="/home"
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              pathname === "/home"
                ? "bg-white text-black"
                : "text-white/90 hover:text-white hover:bg-white/10"
            }`}
          >
            Home
          </Link>
          <Link
            href="/dashboard"
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              pathname === "/dashboard"
                ? "bg-white text-black"
                : "text-white/90 hover:text-white hover:bg-white/10"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/quick-insights"
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              pathname === "/quick-insights"
                ? "bg-white text-black"
                : "text-white/90 hover:text-white hover:bg-white/10"
            }`}
          >
            Quick Insights
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <OverviewNav />

      <main>
        <section className="max-w-3xl mx-auto px-4 sm:px-6 py-24 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
            Unleash market intelligence
          </h1>
          <p className="mt-5 text-lg text-white/80 max-w-xl mx-auto">
            Monitor110 aggregates Reddit discussions, clusters similar topics,
            analyzes sentiment, and delivers fast market insights—no price
            predictions, just discussion trends.
          </p>
          <Link
            href="/dashboard"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-violet-600 px-8 py-3.5 text-base font-medium text-white hover:bg-violet-500 transition-colors"
          >
            Go to Dashboard
          </Link>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-24">
          <h2 className="text-xl font-semibold text-white mb-6">
            Latest ecosystem news
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {overviewCards.map((card) => (
              <div
                key={card.id}
                className="rounded-xl border border-white/10 bg-white/5 p-5 hover:bg-white/[0.08] transition-colors"
              >
                <span className="text-2xl mb-3 block" aria-hidden>
                  {card.icon}
                </span>
                <h3 className="font-medium text-white mb-2">{card.title}</h3>
                <p className="text-sm text-white/70 leading-relaxed">
                  {card.snippet}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
