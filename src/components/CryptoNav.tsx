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
    <header className="border-b border-white/10 bg-black">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <Link
          href="/dashboard"
          className="text-lg font-semibold text-violet-400 tracking-tight"
        >
          Crypto Discussion Intelligence
        </Link>
        <nav className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1.5">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                pathname === href
                  ? "bg-white text-black"
                  : "text-white/90 hover:text-white hover:bg-white/10"
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
