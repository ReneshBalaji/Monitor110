"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 overflow-hidden relative">
      {/* Subtle gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-fuchsia-600/15 rounded-full blur-3xl animate-float-delayed" />
      </div>

      <div className="max-w-2xl mx-auto text-center relative z-10">
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white animate-fade-in-up">
          Portfolio Intelligence
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-white/80 max-w-xl mx-auto animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          Trending news from Reddit, scored for legitimacy. Choose your asset
          class, pick a topic, and get ranked insights to support your decisions.
        </p>
        <p className="mt-3 text-sm text-white/50 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          Crypto · Stocks · Real Estate
        </p>
        <Link
          href="/categories"
          className="mt-10 inline-flex items-center justify-center rounded-xl bg-violet-600 px-10 py-4 text-base font-medium text-white hover:bg-violet-500 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-violet-500/30 animate-fade-in-up"
          style={{ animationDelay: "300ms" }}
        >
          Get Started
        </Link>
      </div>
    </div>
  );
}
