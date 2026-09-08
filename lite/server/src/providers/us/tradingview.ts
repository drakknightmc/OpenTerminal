const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const HEADERS = {
  "User-Agent": UA,
  "Content-Type": "application/json",
  Referer: "https://www.tradingview.com/",
  Origin: "https://www.tradingview.com",
};

export function toTVExchange(exchange: string | null): string {
  const e = (exchange ?? "").toUpperCase();
  if (e.includes("NASDAQ")) return "NASDAQ";
  if (e === "NYSE") return "NYSE";
  if (e.includes("AMERICAN") || e === "PSE" || e.includes("ARCA") || e.includes("AMEX")) return "AMEX";
  return "NASDAQ";
}

export type Fundamentals = {
  open: number | null;
  pe: number | null;
  eps: number | null;
  dividendYield: number | null;
  beta: number | null;
  sharesOutstanding: number | null;
};

const COLUMNS = [
  "open",
  "price_earnings_ttm",
  "earnings_per_share_basic_ttm",
  "dividends_yield_current",
  "beta_1_year",
  "total_shares_outstanding",
];

export async function scanFundamentals(
  entries: Array<{ symbol: string; exchange: string | null }>
): Promise<Map<string, Fundamentals>> {
  const tickers = entries.map((e) => `${toTVExchange(e.exchange)}:${e.symbol}`);
  const out = new Map<string, Fundamentals>();
  if (tickers.length === 0) return out;

  const res = await fetch("https://scanner.tradingview.com/america/scan", {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ symbols: { tickers }, columns: COLUMNS }),
  });
  if (!res.ok) throw new Error(`tradingview scan ${res.status}`);
  const json = await res.json();
  const rows: Array<{ s: string; d: (number | null)[] }> = json?.data ?? [];

  for (const row of rows) {
    const symbol = row.s.split(":")[1];
    const [open, pe, eps, divYield, beta, shares] = row.d;
    out.set(symbol, {
      open: open ?? null,
      pe: pe ?? null,
      eps: eps ?? null,
      dividendYield: divYield !== null && divYield !== undefined ? divYield / 100 : null,
      beta: beta ?? null,
      sharesOutstanding: shares ?? null,
    });
  }
  return out;
}

export type ScreenerRow = {
  symbol: string;
  name: string;
  price: number | null;
  changePercent: number | null;
  volume: number | null;
  marketCap: number | null;
  sector: string;
  exchange: string;
};

export async function marketScan(limit = 1500): Promise<ScreenerRow[]> {
  const res = await fetch("https://scanner.tradingview.com/america/scan", {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      columns: ["description", "close", "change", "market_cap_basic", "sector", "volume", "exchange"],
      filter: [
        { left: "type", operation: "equal", right: "stock" },
        { left: "typespecs", operation: "has", right: ["common"] },
      ],
      sort: { sortBy: "market_cap_basic", sortOrder: "desc" },
      range: [0, limit],
    }),
  });
  if (!res.ok) throw new Error(`tradingview scan ${res.status}`);
  const json = await res.json();
  const rows: Array<{ s: string; d: any[] }> = json?.data ?? [];
  return rows
    .map((r) => {
      const [name, close, change, marketCap, sector, volume, exchange] = r.d;
      return {
        symbol: r.s.split(":")[1],
        name: name ?? r.s.split(":")[1],
        price: close ?? null,
        changePercent: change ?? null,
        marketCap: marketCap ?? null,
        sector: sector || "Other",
        volume: volume ?? null,
        exchange: exchange ?? "",
      };
    })
    .filter((r) => r.symbol && r.exchange !== "OTC");
}

export type SearchResult = { symbol: string; name: string; exchange: string; type: string };

const EXCHANGE_SUFFIX: Array<{ match: RegExp; suffix: string }> = [
  { match: /^(mil|bit)$/i, suffix: ".MI" },
  { match: /euronext paris|^par$/i, suffix: ".PA" },
  { match: /euronext amsterdam|^ams$/i, suffix: ".AS" },
  { match: /euronext brussels|^bru$/i, suffix: ".BR" },
  { match: /euronext lisbon|^lis$/i, suffix: ".LS" },
  { match: /^(xetr|fra|ger|gettex)$/i, suffix: ".DE" },
  { match: /^(lse|lsin)$/i, suffix: ".L" },
  { match: /^(bme|mce)$/i, suffix: ".MC" },
  { match: /^(six|swx|ebs)$/i, suffix: ".SW" },
  { match: /^omxsto$/i, suffix: ".ST" },
  { match: /^omxcop$/i, suffix: ".CO" },
  { match: /^omxhex$/i, suffix: ".HE" },
  { match: /^oslo$/i, suffix: ".OL" },
  { match: /^(tsx|tsxv)$/i, suffix: ".TO" },
  { match: /^asx$/i, suffix: ".AX" },
  { match: /^hkex$/i, suffix: ".HK" },
  { match: /^tse$/i, suffix: ".T" },
  { match: /^nse$/i, suffix: ".NS" },
  { match: /^bse$/i, suffix: ".BO" },
];

function yahooSuffixFor(exchange: string): string {
  for (const { match, suffix } of EXCHANGE_SUFFIX) {
    if (match.test(exchange)) return suffix;
  }
  return "";
}

export async function search(query: string): Promise<SearchResult[]> {
  const url = `https://symbol-search.tradingview.com/symbol_search/v3/?text=${encodeURIComponent(
    query
  )}&hl=1&lang=en&search_type=undefined&domain=production&sort_by_country=US`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`tradingview search ${res.status}`);
  const json = await res.json();
  const rows: any[] = json?.symbols ?? [];
  const strip = (s: string) => s.replace(/<\/?em>/g, "");
  return rows
    .filter((r) => ["stock", "fund", "dr"].includes(r.type))
    .slice(0, 15)
    .map((r) => {
      const exchange = r.exchange ?? "";
      const symbol = strip(r.symbol);
      return {
        symbol: symbol.includes(".") ? symbol : symbol + yahooSuffixFor(exchange),
        name: strip(r.description ?? r.symbol),
        exchange,
        type: r.type ?? "",
      };
    });
}
