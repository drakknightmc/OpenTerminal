import * as nasdaq from "./nasdaq.js";
import * as yahoo from "./yahoo.js";
import * as stooq from "./stooq.js";
import * as tradingview from "./tradingview.js";
import { OptionsChain, yahooRowToStandard } from "./options.js";

export type { Quote, Candle } from "./yahoo.js";
export type { Fundamentals } from "./tradingview.js";
export type { OptionsChain } from "./options.js";

export interface SymbolResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

export interface ScreenerFilters {
  limit?: number;
}

/**
 * Get a single quote with fallback chain: Nasdaq → Yahoo → Stooq
 */
export async function getQuote(symbol: string): Promise<yahoo.Quote> {
  let lastErr: Error | null = null;

  try {
    return await nasdaq.quote(symbol);
  } catch (err) {
    lastErr = err instanceof Error ? err : new Error(String(err));
  }

  try {
    return await yahoo.quoteFromChart(symbol);
  } catch (err) {
    lastErr = err instanceof Error ? err : new Error(String(err));
  }

  try {
    return await stooq.quote(symbol);
  } catch (err) {
    lastErr = err instanceof Error ? err : new Error(String(err));
  }

  throw lastErr || new Error(`getQuote: no provider succeeded for ${symbol}`);
}

// Range mapping for Yahoo Finance
const YAHOO_RANGE_MAP: Record<string, { range: string; interval: string }> = {
  "1D": { range: "1d", interval: "5m" },
  "5D": { range: "5d", interval: "15m" },
  "1M": { range: "1mo", interval: "1h" },
  "6M": { range: "6mo", interval: "1d" },
  YTD: { range: "ytd", interval: "1d" },
  "1Y": { range: "1y", interval: "1d" },
  "5Y": { range: "5y", interval: "1wk" },
  MAX: { range: "max", interval: "1mo" },
};

/**
 * Get historical candles with fallback chain: Nasdaq → Yahoo → Stooq
 */
export async function getHistoricalCandles(symbol: string, timeframe: string): Promise<yahoo.Candle[]> {
  let lastErr: Error | null = null;

  try {
    return await nasdaq.history(symbol, timeframe);
  } catch (err) {
    lastErr = err instanceof Error ? err : new Error(String(err));
  }

  const yahooRange = YAHOO_RANGE_MAP[timeframe] || YAHOO_RANGE_MAP["6M"];
  try {
    return await yahoo.history(symbol, yahooRange.range, yahooRange.interval);
  } catch (err) {
    lastErr = err instanceof Error ? err : new Error(String(err));
  }

  try {
    return await stooq.history(symbol);
  } catch (err) {
    lastErr = err instanceof Error ? err : new Error(String(err));
  }

  throw lastErr || new Error(`getHistoricalCandles: no provider succeeded for ${symbol}`);
}

/**
 * Search for symbols with fallback chain: TradingView → Yahoo
 */
export async function searchSymbols(query: string): Promise<SymbolResult[]> {
  let lastErr: Error | null = null;

  try {
    const results = await tradingview.search(query);
    return results.map((r) => ({
      symbol: r.symbol,
      name: r.name,
      exchange: r.exchange,
      type: r.type,
    }));
  } catch (err) {
    lastErr = err instanceof Error ? err : new Error(String(err));
  }

  try {
    const results = await yahoo.search(query);
    return results.map((r) => ({
      symbol: r.symbol,
      name: r.name,
      exchange: r.exchange,
      type: r.type,
    }));
  } catch (err) {
    lastErr = err instanceof Error ? err : new Error(String(err));
  }

  throw lastErr || new Error(`searchSymbols: no provider succeeded for "${query}"`);
}

/**
 * Get fundamentals from TradingView (no fallback)
 */
export async function getFundamentals(symbol: string): Promise<tradingview.Fundamentals> {
  try {
    const map = await tradingview.scanFundamentals([
      { symbol, exchange: null },
    ]);
    const result = map.get(symbol);
    if (!result) {
      throw new Error(`tradingview: no fundamentals for ${symbol}`);
    }
    return result;
  } catch (err) {
    throw err instanceof Error ? err : new Error(String(err));
  }
}

/**
 * Get market screener data from TradingView
 */
export async function getScreener(filters: ScreenerFilters): Promise<tradingview.ScreenerRow[]> {
  return tradingview.marketScan(filters.limit ?? 1500);
}

/**
 * Get options chain with fallback: Nasdaq → Yahoo
 */
export async function getOptionsChain(symbol: string): Promise<OptionsChain> {
  let lastErr: Error | null = null;

  try {
    const chain = await nasdaq.optionChain(symbol);
    return {
      symbol: chain.symbol,
      underlyingPrice: chain.underlyingPrice,
      expirationDates: chain.expirationDates,
      selectedDate: chain.selectedDate,
      calls: chain.calls.map(yahooRowToStandard),
      puts: chain.puts.map(yahooRowToStandard),
    };
  } catch (err) {
    lastErr = err instanceof Error ? err : new Error(String(err));
  }

  try {
    const chain = await yahoo.options(symbol);
    return {
      symbol: chain.symbol,
      underlyingPrice: chain.underlyingPrice,
      expirationDates: chain.expirationDates.map((d: number) => new Date(d * 1000).toISOString().slice(0, 10)),
      selectedDate: chain.selectedDate ? new Date(chain.selectedDate * 1000).toISOString().slice(0, 10) : null,
      calls: chain.calls.map(yahooRowToStandard),
      puts: chain.puts.map(yahooRowToStandard),
    };
  } catch (err) {
    lastErr = err instanceof Error ? err : new Error(String(err));
  }

  throw lastErr || new Error(`getOptionsChain: no provider succeeded for ${symbol}`);
}
