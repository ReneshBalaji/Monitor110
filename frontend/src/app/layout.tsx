import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Monitor110 — Portfolio Intelligence",
  description:
    "Discussion and news intelligence for serious investors. Community and articles, legitimacy-scored. Research and education only—not financial advice.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-white font-sans antialiased text-slate-900">
        {children}
      </body>
    </html>
  );
}
