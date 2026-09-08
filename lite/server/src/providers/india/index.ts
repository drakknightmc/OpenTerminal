import { nseHistory, nseIndices, nseQuote } from "./nse.js";
import { yahooIndiaHistory, yahooIndiaQuote } from "./yahooIndia.js";

export type IndiaQuote = {
  symbol: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  previousClose: number | null;
  bid: number | null;
  ask: number | null;
  volume: number | null;
  currency: "INR";
  exchange: "NSE" | "BSE";
  marketState: string | null;
  time: number | null;
  source: string;
};

export type Candle = { time: number; open: number; high: number; low: number; close: number; volume: number };
export type IndiaIndex = { name: string; value: number; change: number; changePercent: number };

const RANGE: Record<string, { days: number; yahooRange: string; interval: string }> = {
  "1D": { days: 3, yahooRange: "5d", interval: "5m" },
  "5D": { days: 10, yahooRange: "1mo", interval: "15m" },
  "1M": { days: 40, yahooRange: "3mo", interval: "1d" },
  "6M": { days: 200, yahooRange: "1y", interval: "1d" },
  YTD: { days: 400, yahooRange: "1y", interval: "1d" },
  "1Y": { days: 400, yahooRange: "1y", interval: "1d" },
  "5Y": { days: 1900, yahooRange: "5y", interval: "1wk" },
  MAX: { days: 7300, yahooRange: "max", interval: "1mo" },
};

function nseDate(date: Date): string {
  return `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;
}

export async function getQuote(symbol: string): Promise<IndiaQuote> {
  try {
    return await nseQuote(symbol);
  } catch (nseError) {
    try {
      return await yahooIndiaQuote(symbol);
    } catch (yahooError) {
      throw new AggregateError([nseError, yahooError], `india quote failed for ${symbol}`);
    }
  }
}

export async function getHistoricalCandles(symbol: string, timeframe: string): Promise<Candle[]> {
  const config = RANGE[timeframe.toUpperCase()] ?? RANGE["1Y"];
  const to = new Date();
  const from = new Date(to.getTime() - config.days * 86_400_000);
  try {
    return await nseHistory(symbol, nseDate(from), nseDate(to));
  } catch (nseError) {
    try {
      return await yahooIndiaHistory(symbol, config.yahooRange, config.interval);
    } catch (yahooError) {
      throw new AggregateError([nseError, yahooError], `india history failed for ${symbol}`);
    }
  }
}

export async function getIndices(): Promise<IndiaIndex[]> {
  return nseIndices();
}
