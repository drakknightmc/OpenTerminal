import type { CryptoAsset } from "./coingecko.js";

export type Candle = { time: number; open: number; high: number; low: number; close: number; volume: number };

const BASE_URL = "https://api.binance.com/api/v3";
const NAMES: Record<string, string> = {
  BTC: "Bitcoin", ETH: "Ethereum", SOL: "Solana", BNB: "BNB", XRP: "XRP", ADA: "Cardano",
  DOGE: "Dogecoin", AVAX: "Avalanche", DOT: "Polkadot", LINK: "Chainlink", LTC: "Litecoin", MATIC: "Polygon",
};

async function request(path: string): Promise<any> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { headers: { Accept: "application/json" } });
  } catch (error) {
    throw new Error(`Binance request failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!response.ok) throw new Error(`Binance request failed with HTTP ${response.status}`);
  try {
    return await response.json();
  } catch (error) {
    throw new Error(`Binance returned invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function pairFor(symbol: string): string {
  const normalized = symbol.trim().toUpperCase();
  if (!normalized) throw new Error("Binance symbol is required");
  return normalized.endsWith("USDT") ? normalized : `${normalized}USDT`;
}

function assetFromTicker(row: any): CryptoAsset {
  const pair = String(row?.symbol ?? "");
  const symbol = pair.endsWith("USDT") ? pair.slice(0, -4) : pair;
  const price = Number(row?.lastPrice);
  if (!symbol || !Number.isFinite(price)) throw new Error("Binance returned an incomplete ticker");
  return {
    id: pair,
    symbol,
    name: NAMES[symbol] ?? symbol,
    price,
    changePercent24h: Number.isFinite(Number(row?.priceChangePercent)) ? Number(row.priceChangePercent) : null,
    marketCap: null,
    volume24h: Number.isFinite(Number(row?.quoteVolume)) ? Number(row.quoteVolume) : null,
    rank: null,
    sparkline: [],
  };
}

export async function getMarkets(): Promise<CryptoAsset[]> {
  const symbols = Object.keys(NAMES).map((symbol) => `${symbol}USDT`);
  const rows = await request(`/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(symbols))}`);
  if (!Array.isArray(rows)) throw new Error("Binance markets response was not an array");
  return rows.map(assetFromTicker).sort((a, b) => (b.volume24h ?? 0) - (a.volume24h ?? 0));
}

export async function getQuote(symbol: string): Promise<CryptoAsset> {
  return assetFromTicker(await request(`/ticker/24hr?symbol=${encodeURIComponent(pairFor(symbol))}`));
}

export async function getKlines(symbol: string, interval: string, limit = 500): Promise<Candle[]> {
  const normalizedInterval = interval.trim();
  if (!normalizedInterval) throw new Error("Binance kline interval is required");
  if (!Number.isInteger(limit) || limit < 1 || limit > 1000) throw new Error("Binance kline limit must be an integer between 1 and 1000");
  const rows = await request(`/klines?symbol=${encodeURIComponent(pairFor(symbol))}&interval=${encodeURIComponent(normalizedInterval)}&limit=${limit}`);
  if (!Array.isArray(rows)) throw new Error("Binance klines response was not an array");
  return rows.map((row) => {
    if (!Array.isArray(row) || row.length < 6) throw new Error("Binance returned an incomplete kline");
    return { time: Math.floor(Number(row[0]) / 1000), open: Number(row[1]), high: Number(row[2]), low: Number(row[3]), close: Number(row[4]), volume: Number(row[5]) };
  });
}
