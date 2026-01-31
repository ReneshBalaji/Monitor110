"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top nav */}
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-800 font-semibold tracking-tight hover:text-slate-900"
          >
            <span className="flex w-8 h-8 items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-bold">
              M
            </span>
            <span className="lowercase">Monitor110</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href="/categories"
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Categories
            </Link>
            <Link
              href="/dashboard"
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/about"
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              About
            </Link>
            <Link
              href="/categories"
              className="ml-2 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-button hover:bg-blue-500 hover:shadow-button-hover transition-all"
            >
              Get early access
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero + gradient + grid */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-12 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 hero-gradient pointer-events-none" />
        <div className="absolute inset-0 hero-grid pointer-events-none" />

        <div className="max-w-2xl mx-auto text-center relative z-10">
          {/* Optional badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 mb-6 animate-fade-in-up">
            <span className="flex w-5 h-5 items-center justify-center rounded bg-amber-500 text-white text-xs font-bold">
              i
            </span>
            <span className="text-sm font-medium text-slate-600">
              For research & education — not financial advice
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 animate-fade-in-up">
            Portfolio Intelligence
          </h1>
          <p className="mt-3 text-4xl sm:text-5xl font-medium tracking-tight text-slate-500 animate-fade-in-up" style={{ animationDelay: "50ms" }}>
            in good hands
          </p>
          <p className="mt-6 text-lg text-slate-600 max-w-xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            Monitor110 is a better way to stay on top of discussion and news for crypto, stocks, and real estate. Community and articles, legitimacy-scored—so you see what matters.
          </p>
          <Link
            href="/categories"
            className="mt-10 inline-flex items-center justify-center rounded-lg border-2 border-blue-500 bg-white px-10 py-3.5 text-base font-medium text-blue-600 shadow-button hover:bg-blue-50 hover:border-blue-600 hover:text-blue-700 hover:shadow-button-hover transition-all duration-200 animate-fade-in-up"
            style={{ animationDelay: "200ms" }}
          >
            Get Started
          </Link>
        </div>
      </main>
    </div>
  );
}
