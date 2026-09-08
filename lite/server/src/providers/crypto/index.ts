import * as binance from "./binance.js";
import * as coingecko from "./coingecko.js";
import type { CryptoAsset } from "./coingecko.js";
import type { Candle } from "./binance.js";

export type { CryptoAsset, Candle };

const TIMEFRAME_INTERVALS: Record<string, { interval: string; limit: number }> = {
  "1D": { interval: "5m", limit: 288 },
  "5D": { interval: "15m", limit: 480 },
  "1W": { interval: "1h", limit: 168 },
  "1M": { interval: "1h", limit: 720 },
  "3M": { interval: "4h", limit: 550 },
  "6M": { interval: "4h", limit: 1000 },
  YTD: { interval: "1d", limit: 366 },
  "1Y": { interval: "1d", limit: 365 },
  "5Y": { interval: "1w", limit: 260 },
  MAX: { interval: "1M", limit: 200 },
};

export async function getTopAssets(limit = 50): Promise<CryptoAsset[]> {
  return coingecko.getMarkets(limit);
}

export async function getQuote(idOrSymbol: string): Promise<CryptoAsset> {
  const id = idOrSymbol.trim();
  if (!id) throw new Error("Crypto asset id or symbol is required");
  try {
    return await coingecko.getQuote(id.toLowerCase());
  } catch (coingeckoError) {
    try {
      return await binance.getQuote(id);
    } catch (binanceError) {
      throw new Error(`Unable to fetch crypto quote for ${id}: CoinGecko: ${coingeckoError instanceof Error ? coingeckoError.message : String(coingeckoError)}; Binance: ${binanceError instanceof Error ? binanceError.message : String(binanceError)}`);
    }
  }
}

export async function getOHLCV(symbol: string, timeframe: string): Promise<Candle[]> {
  const rawTimeframe = timeframe.trim();
  const key = rawTimeframe.toUpperCase();
  const config = TIMEFRAME_INTERVALS[key] ?? (rawTimeframe.match(/^\d+[mhdwM]$/) ? { interval: rawTimeframe, limit: 500 } : null);
  if (!config) throw new Error(`Unsupported crypto timeframe: ${timeframe}`);
  try {
    return await binance.getKlines(symbol, config.interval, config.limit);
  } catch (error) {
    throw new Error(`Unable to fetch crypto OHLCV for ${symbol} (${timeframe}): ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function getDominance(): Promise<{ btc: number; eth: number }> {
  const stats = await coingecko.getGlobalStats();
  return { btc: stats.btc, eth: stats.eth };
}
