// Ported 1:1 from Terminal - Investments.dc.html's position-detail data
// (`lots`, `posStats`, `news`, `ranges`). The prototype only authored one
// example position (NVDA) — every symbol's detail page reuses this same
// illustrative dataset for lots/news, with the header and Position stat
// block driven by that symbol's own row (see app/investments/[symbol]).
import { TXT, UP } from "./colors";

export type Lot = { date: string; qty: string; cost: string; gain: string; term: string; tagBg: string; tagFg: string; tax: string };

export const lots: Lot[] = [
  ["2024-08-14", "56", "$96.20", "+$4,369", "Long term", "#292b31", "#cfd3e5", "−₹72,640"],
  ["2025-02-03", "44", "$121.40", "+$2,324", "Long term", "#292b31", "#cfd3e5", "−₹38,640"],
  ["2026-03-11", "30", "$148.90", "+$760", "Short term", "#423a6a", "#d2cefd", "−₹19,690"],
].map(([date, qty, cost, gain, term, tagBg, tagFg, tax]) => ({ date, qty, cost, gain, term, tagBg, tagFg, tax }));

export type PosStat = { k: string; v: string; color: string };

export const posStats: PosStat[] = ([
  ["Quantity", "130", TXT], ["Average cost", "$118.40", TXT], ["Invested", "$15,392 · ₹12,79,383", TXT],
  ["Market value", "$22,649 · ₹18,82,551", TXT], ["Unrealised", "+$7,257 · +47.1%", UP],
  ["FX effect", "+₹58,500", UP], ["XIRR", "61.4%", UP], ["Weight of net worth", "7.9%", TXT],
  ["Realised FY26", "+$318", UP], ["Dividends FY26", "$4.20", TXT],
] as [string, string, string][]).map(([k, v, color]) => ({ k, v, color }));

export type NewsItem = { head: string; meta: string };

export const news: NewsItem[] = [
  ["Data-centre revenue guidance lifted for the third straight quarter", "Reuters · 2h · sentiment +"],
  ["Supplier lead times shorten on the latest accelerator line", "Bloomberg · 5h · sentiment +"],
  ["Export-control review widens to two more markets", "FT · 9h · sentiment −"],
  ["Index rebalance raises weight in the S&P 500 to 7.4%", "Nasdaq · 1d · neutral"],
].map(([head, meta]) => ({ head, meta }));

export const RANGE_LABELS = ["1D", "1M", "6M", "1Y", "3Y", "MAX"] as const;
