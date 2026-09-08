import type { Candle, IndiaQuote } from "./index.js";

const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

function ticker(symbol: string): string {
  return /\.(NS|BO)$/i.test(symbol) ? symbol.toUpperCase() : `${symbol.toUpperCase()}.NS`;
}

function number(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

async function yfetch(url: string): Promise<any> {
  const response = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!response.ok) throw new Error(`yahoo india ${response.status} for ${url}`);
  return response.json();
}

export async function yahooIndiaQuote(symbol: string): Promise<IndiaQuote> {
  const yahooSymbol = ticker(symbol);
  let row: any;
  try {
    const json = await yfetch(`https://query1.finance.yahoo.com/v1/finance/quote?symbols=${encodeURIComponent(yahooSymbol)}`);
    row = json?.quoteResponse?.result?.[0];
  } catch {
    row = null;
  }
  if (!row) {
    const json = await yfetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=1d&interval=1d`);
    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta) throw new Error(`yahoo india: no quote for ${symbol}`);
    row = meta;
  }
  const price = number(row.regularMarketPrice);
  const previousClose = number(row.regularMarketPreviousClose ?? row.previousClose ?? row.chartPreviousClose);
  return {
    symbol,
    price,
    change: number(row.regularMarketChange) ?? (price !== null && previousClose !== null ? price - previousClose : null),
    changePercent: number(row.regularMarketChangePercent) ?? (price !== null && previousClose ? ((price - previousClose) / previousClose) * 100 : null),
    open: number(row.regularMarketOpen),
    high: number(row.regularMarketDayHigh),
    low: number(row.regularMarketDayLow),
    previousClose,
    bid: number(row.bid),
    ask: number(row.ask),
    volume: number(row.regularMarketVolume),
    currency: "INR",
    exchange: /\.BO$/i.test(yahooSymbol) ? "BSE" : "NSE",
    marketState: row.marketState ?? null,
    time: number(row.regularMarketTime),
    source: "yahoo-india",
  };
}

export async function yahooIndiaHistory(symbol: string, range: string, interval: string): Promise<Candle[]> {
  const json = await yfetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker(symbol))}?range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}&includePrePost=false`);
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error(`yahoo india: no chart data for ${symbol}`);
  const timestamps: number[] = result.timestamp ?? [];
  const quote = result.indicators?.quote?.[0] ?? {};
  const candles: Candle[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const open = number(quote.open?.[i]);
    const high = number(quote.high?.[i]);
    const low = number(quote.low?.[i]);
    const close = number(quote.close?.[i]);
    if (open === null || high === null || low === null || close === null) continue;
    candles.push({ time: timestamps[i], open, high, low, close, volume: number(quote.volume?.[i]) ?? 0 });
  }
  return candles;
}
