import type { CoinId } from "./explore-types";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

const COIN_ID_MAP: Record<CoinId, string> = {
  bitcoin: "bitcoin",
  ethereum: "ethereum",
  solana: "solana",
  cardano: "cardano",
  xrp: "ripple",
};

export interface CoingeckoMarketData {
  currentPriceUsd: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  marketCapUsd: number;
  totalVolumeUsd: number;
  high24h: number;
  low24h: number;
  source: "coingecko";
}

export interface CoingeckoCoinInfo {
  id: string;
  symbol: string;
  name: string;
  marketData: CoingeckoMarketData;
  description?: string;
}

export async function fetchCoingeckoCoin(coinId: CoinId): Promise<CoingeckoCoinInfo | null> {
  const cgId = COIN_ID_MAP[coinId];
  if (!cgId) return null;
  try {
    const res = await fetch(
      `${COINGECKO_BASE}/coins/${cgId}?localization=false&tickers=false&community_data=false&developer_data=false`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      id?: string;
      symbol?: string;
      name?: string;
      market_data?: {
        current_price?: { usd?: number };
        price_change_24h?: number;
        price_change_percentage_24h?: number;
        market_cap?: { usd?: number };
        total_volume?: { usd?: number };
        high_24h?: { usd?: number };
        low_24h?: { usd?: number };
      };
      description?: { en?: string };
    };
    const md = data.market_data;
    if (!md?.current_price?.usd) return null;
    return {
      id: data.id ?? cgId,
      symbol: (data.symbol ?? "").toUpperCase(),
      name: data.name ?? coinId,
      marketData: {
        currentPriceUsd: md.current_price.usd,
        priceChange24h: md.price_change_24h ?? 0,
        priceChangePercent24h: md.price_change_percentage_24h ?? 0,
        marketCapUsd: md.market_cap?.usd ?? 0,
        totalVolumeUsd: md.total_volume?.usd ?? 0,
        high24h: md.high_24h?.usd ?? 0,
        low24h: md.low_24h?.usd ?? 0,
        source: "coingecko",
      },
      description: data.description?.en?.slice(0, 300),
    };
  } catch {
    return null;
  }
}
