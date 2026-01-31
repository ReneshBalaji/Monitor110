import { NextRequest, NextResponse } from "next/server";
import { fetchAllNewsSources } from "@/lib/news-sources";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const coinId = searchParams.get("coin") || "bitcoin";
  const limit = Math.min(parseInt(searchParams.get("limit") || "15"), 30);

  try {
    const posts = await fetchAllNewsSources(coinId, limit);
    
    return NextResponse.json({
      posts,
      sources: ["CoinDesk", "Decrypt", "Cointelegraph", "The Block", "Bitcoin Magazine"],
      count: posts.length,
    });
  } catch (err) {
    console.error("News fetch error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch news" },
      { status: 500 }
    );
  }
}
