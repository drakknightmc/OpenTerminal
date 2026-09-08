import { XMLParser } from "fast-xml-parser";

export type NewsMarket = "us" | "india" | "crypto" | "global";

export type NewsItem = {
  title: string;
  link: string;
  source: string;
  publishedAt: string | null;
  market: NewsMarket;
};

const parser = new XMLParser({ ignoreAttributes: false });
const USER_AGENT = "Mozilla/5.0 (compatible; OpenTerminal/1.0)";

function marketForSymbol(symbol: string): Exclude<NewsMarket, "global"> {
  const normalized = symbol.trim().toUpperCase();
  if (/\.(NS|BO)$/.test(normalized)) return "india";
  if (/-USD$/.test(normalized) || /^(BTC|ETH|SOL|XRP|ADA|DOGE|BNB|AVAX|DOT|LINK)([-.]?USD)?$/.test(normalized)) {
    return "crypto";
  }
  return "us";
}

function sourceName(source: unknown, fallback: string): string {
  if (typeof source === "string") return source;
  if (source && typeof source === "object" && "#text" in source) {
    return String((source as Record<string, unknown>)["#text"]);
  }
  return fallback;
}

async function fetchRss(url: string, fallbackSource: string, market: NewsMarket): Promise<NewsItem[]> {
  try {
    const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!response.ok) return [];
    const document = parser.parse(await response.text());
    const rawItems = document?.rss?.channel?.item ?? [];
    const items = Array.isArray(rawItems) ? rawItems : [rawItems];

    return items.flatMap((item: any) => {
      if (!item?.title || !item?.link) return [];
      let publishedAt: string | null = null;
      if (item.pubDate) {
        const date = new Date(String(item.pubDate));
        if (!Number.isNaN(date.valueOf())) publishedAt = date.toISOString();
      }
      return [{
        title: String(item.title),
        link: String(item.link),
        source: sourceName(item.source, fallbackSource),
        publishedAt,
        market,
      }];
    });
  } catch {
    return [];
  }
}

function normalizedTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().slice(0, 80);
}

function dedupe(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  return items
    .filter((item) => {
      const key = normalizedTitle(item.title);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
}

export async function getNews(symbol?: string): Promise<NewsItem[]> {
  if (symbol?.trim()) {
    const market = marketForSymbol(symbol);
    const url = `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${encodeURIComponent(symbol)}&region=US&lang=en-US`;
    return dedupe(await fetchRss(url, "Yahoo Finance", market));
  }

  const yahooUrl = "https://feeds.finance.yahoo.com/rss/2.0/headline?s=%5EGSPC,%5EIXIC,%5EDJI&region=US&lang=en-US";
  const googleUrl = "https://news.google.com/rss/search?q=stock%20market&hl=en-US&gl=US&ceid=US:en";
  const [yahoo, google] = await Promise.all([
    fetchRss(yahooUrl, "Yahoo Finance", "us"),
    fetchRss(googleUrl, "Google News", "global"),
  ]);
  return dedupe([...yahoo, ...google]);
}
