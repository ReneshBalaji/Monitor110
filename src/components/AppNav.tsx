"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-[var(--border)] bg-[var(--card)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <Link
          href="/home"
          className="text-lg font-semibold text-[var(--foreground)] tracking-tight"
        >
          Monitor110
        </Link>
        <div className="flex gap-6">
          <Link
            href="/home"
            className={`text-sm font-medium transition-colors ${
              pathname === "/home"
                ? "text-slate-900 dark:text-slate-100"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            Home
          </Link>
          <Link
            href="/dashboard"
            className={`text-sm font-medium transition-colors ${
              pathname === "/dashboard"
                ? "text-slate-900 dark:text-slate-100"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/quick-insights"
            className={`text-sm font-medium transition-colors ${
              pathname === "/quick-insights"
                ? "text-slate-900 dark:text-slate-100"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            Quick Insights
          </Link>
        </div>
      </div>
    </nav>
  );
}
