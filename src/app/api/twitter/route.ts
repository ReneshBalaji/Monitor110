import { NextRequest, NextResponse } from "next/server";
import { fetchTwitterData, isTwitterConfigured } from "@/lib/twitter-fetch";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const coinId = searchParams.get("coin") || "bitcoin";
  const limit = Math.min(parseInt(searchParams.get("limit") || "15"), 30);

  // Check if Twitter is configured
  if (!isTwitterConfigured()) {
    return NextResponse.json({
      posts: [],
      configured: false,
      message: "Twitter API not configured. Add TWITTER_BEARER_TOKEN to .env.local",
    });
  }

  try {
    const posts = await fetchTwitterData(coinId, limit);
    
    return NextResponse.json({
      posts,
      configured: true,
      count: posts.length,
    });
  } catch (err) {
    console.error("Twitter fetch error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch Twitter data" },
      { status: 500 }
    );
  }
}
