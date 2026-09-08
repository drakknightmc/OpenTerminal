const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const BASE = "https://www.nseindia.com";

export type NseQuote = {
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
  exchange: "NSE";
  marketState: string | null;
  time: number | null;
  source: "nse";
};

export type NseCandle = { time: number; open: number; high: number; low: number; close: number; volume: number };
export type NseIndex = { name: string; value: number; change: number; changePercent: number };

let cookies = "";
let cookieFetched = 0;

function number(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || !value.trim() || value === "-" || value === "--") return null;
  const parsed = Number(value.replace(/,/g, "").replace(/%/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function cookieHeader(response: Response): string {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  const values = headers.getSetCookie?.() ?? [];
  if (values.length) return values.map((value) => value.split(";", 1)[0]).join("; ");
  return (response.headers.get("set-cookie") ?? "")
    .split(/,(?=[^;]+=[^;]+)/)
    .map((value) => value.split(";", 1)[0].trim())
    .filter(Boolean)
    .join("; ");
}

async function warmCookies(force = false): Promise<void> {
  if (!force && cookies && Date.now() - cookieFetched < 15 * 60_000) return;
  const response = await fetch(`${BASE}/`, {
    headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
  });
  const nextCookies = cookieHeader(response);
  if (!response.ok || !nextCookies) throw new Error(`nse warm-up failed (${response.status})`);
  cookies = nextCookies;
  cookieFetched = Date.now();
}

async function nfetch(path: string): Promise<any> {
  for (let attempt = 0; attempt < 2; attempt++) {
    await warmCookies(attempt > 0);
    const response = await fetch(`${BASE}${path}`, {
      headers: {
        "User-Agent": UA,
        Accept: "application/json, text/plain, */*",
        Referer: `${BASE}/`,
        Cookie: cookies,
      },
    });
    if (response.ok) return response.json();
    if (attempt === 0 && (response.status === 401 || response.status === 403)) {
      cookies = "";
      cookieFetched = 0;
      continue;
    }
    throw new Error(`nse ${response.status} for ${path}`);
  }
  throw new Error(`nse request failed for ${path}`);
}

function timestamp(value: unknown): number | null {
  if (typeof value === "number") return value > 10_000_000_000 ? Math.round(value / 1000) : value;
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value.replace(/-/g, " "));
  return Number.isNaN(parsed) ? null : Math.round(parsed / 1000);
}

export async function nseQuote(symbol: string): Promise<NseQuote> {
  const json = await nfetch(`/api/quote-equity?symbol=${encodeURIComponent(symbol.replace(/\.(NS|BO)$/i, ""))}`);
  const info = json?.info ?? {};
  const priceInfo = json?.priceInfo ?? {};
  const intraDay = priceInfo.intraDayHighLow ?? {};
  const buySell = priceInfo.buySell ?? {};
  const price = number(priceInfo.lastPrice);
  return {
    symbol: info.symbol ?? symbol,
    price,
    change: number(priceInfo.change),
    changePercent: number(priceInfo.pChange),
    open: number(priceInfo.open),
    high: number(intraDay.max),
    low: number(intraDay.min),
    previousClose: number(priceInfo.previousClose),
    bid: number(buySell.buyPrice),
    ask: number(buySell.sellPrice),
    volume: number(priceInfo.totalTradedVolume ?? json?.marketDeptOrderBook?.tradeInfo?.totalTradedVolume),
    currency: "INR",
    exchange: "NSE",
    marketState: info.status ?? json?.metadata?.status ?? null,
    time: timestamp(priceInfo.lastUpdateTime ?? json?.metadata?.lastUpdateTime),
    source: "nse",
  };
}

export async function nseHistory(symbol: string, fromDate: string, toDate: string): Promise<NseCandle[]> {
  const query = new URLSearchParams({
    symbol: symbol.replace(/\.(NS|BO)$/i, ""),
    series: '["EQ"]',
    from: fromDate,
    to: toDate,
  });
  const json = await nfetch(`/api/historical/cm/equity?${query}`);
  const rows: any[] = json?.data ?? [];
  return rows
    .map((row) => ({
      time: timestamp(row.mTIMESTAMP ?? row.timestamp ?? row.date),
      open: number(row.CH_OPENING_PRICE ?? row.open),
      high: number(row.CH_TRADE_HIGH_PRICE ?? row.high),
      low: number(row.CH_TRADE_LOW_PRICE ?? row.low),
      close: number(row.CH_CLOSING_PRICE ?? row.close),
      volume: number(row.CH_TOT_TRADED_QTY ?? row.volume) ?? 0,
    }))
    .filter((row) => row.time !== null && row.open !== null && row.high !== null && row.low !== null && row.close !== null)
    .map((row) => ({ time: row.time as number, open: row.open as number, high: row.high as number, low: row.low as number, close: row.close as number, volume: row.volume }));
}

export async function nseIndices(): Promise<NseIndex[]> {
  const indices = await Promise.all(["NIFTY 50", "SENSEX"].map(async (index) => {
    const json = await nfetch(`/api/equity-stockIndices?index=${encodeURIComponent(index)}`);
    const rows: any[] = json?.data ?? [];
    const row = rows.find((item) => item.indexName || item.indexSymbol) ?? rows[0];
    if (!row) throw new Error(`nse: no data for ${index}`);
    return {
      name: row.indexName ?? row.indexSymbol ?? index,
      value: number(row.last ?? row.lastPrice) ?? 0,
      change: number(row.change) ?? 0,
      changePercent: number(row.pChange ?? row.percentChange) ?? 0,
    };
  }));
  return indices;
}
