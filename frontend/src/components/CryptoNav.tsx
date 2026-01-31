"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function CryptoNav() {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/live-sample", label: "Live Sample" },
    { href: "/demo-scenarios", label: "Demo Scenarios" },
    { href: "/about", label: "About" },
  ];

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <Link
          href="/dashboard"
          className="text-lg font-semibold text-blue-600 tracking-tight hover:text-blue-700"
        >
          Monitor110
        </Link>
        <nav className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1.5">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                pathname === href
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
