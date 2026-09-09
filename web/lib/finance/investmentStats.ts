// Ported 1:1 from Terminal - Investments.dc.html's `STATS` object and the
// stat-strip derivation logic inside `renderVals()` (the per-tab Invested /
// Market value / Unrealised / ... row above the holdings table).
import { DIM, DOWN, TXT, UP } from "./colors";
import { TOTALS, dollars, isNeg, pctStr, rupees, signed } from "./rows";

type StatPair = [string, string];
type TabStatBase = { m: StatPair[]; r: string[]; f: [string, string] };

// Money metrics are [value, alternate-currency line]; the tab decides which
// currency leads. US equity leads in USD because that is the account's own
// currency; All leads in INR with the USD line beneath.
const STATS: Record<string, TabStatBase> = {
  "All": { m: [["₹1,91,88,600", "$2,30,853"], ["₹2,37,40,205", "$2,85,613"], ["+₹45,51,605", "+$54,760"], ["+₹1,84,200", "+$2,216"], ["₹4,25,600", "$5,120"], ["+₹45,215", "+$544"]],
    r: ["+23.7%", "+0.19%", "14.9%", "13.2%", "−12.4%", "1.79%"], f: ["24 positions · 11 accounts", "vs NIFTY 50 +3.1%"] },
  "Indian equity": { m: [["₹35,77,760", "cost basis"], ["₹38,42,140", "live"], ["+₹2,64,380", "unrealised"], ["+₹42,600", "booked FY26"], ["₹32,400", "8 payouts"], ["+₹16,494", "today"]],
    r: ["+7.4%", "+0.43%", "13.9%", "12.4%", "−21.4%", "0.84%"], f: ["5 positions · Zerodha", "vs NIFTY 50 +1.6%"] },
  "US equity": { m: [["$42,188", "₹35,06,668"], ["$54,269", "₹45,10,566"], ["+$12,081", "+₹10,03,898"], ["+$318", "+₹26,400"], ["$142.60", "₹11,853 · 25% WHT"], ["+$458", "+₹38,086"]],
    r: ["+28.6%", "+0.84%", "28.3%", "24.1%", "−16.8%", "0.51%"], f: ["3 positions · IBKR", "vs S&P 500 +7.9%"] },
  "Mutual funds": { m: [["₹21,62,168", "cost basis"], ["₹29,05,314", "live NAV"], ["+₹7,43,146", "unrealised"], ["—", "no redemptions"], ["—", "growth plans"], ["+₹8,440", "today"]],
    r: ["+34.4%", "+0.29%", "18.4%", "16.9%", "−14.1%", "0.00%"], f: ["3 schemes · MFCentral", "vs NIFTY 500 +2.4%"] },
  "Crypto": { m: [["₹6,70,000", "cost basis"], ["₹9,18,000", "live"], ["+₹2,48,000", "unrealised"], ["+₹1,15,200", "taxed at 30%"], ["—", "no staking"], ["−₹18,610", "today"]],
    r: ["+37.0%", "−2.03%", "19.7%", "17.2%", "−52.6%", "—"], f: ["3 assets · CoinDCX", "vs BTC −4.2%"] },
  "Retirement": { m: [["₹14,42,000", "contributions"], ["₹16,40,000", "accrued"], ["+₹1,98,000", "interest credited"], ["—", "locked in"], ["—", "reinvested"], ["+₹190", "daily accrual"]],
    r: ["+13.7%", "+0.01%", "8.4%", "8.3%", "0.0%", "—"], f: ["EPF · NPS", "vs 8.25% declared"] },
  "Private": { m: [["₹3,50,000", "cost basis"], ["₹4,10,000", "Q2 mark"], ["+₹60,000", "unrealised"], ["—", "no exit"], ["—", "no distributions"], ["—", "not marked daily"]],
    r: ["+17.1%", "—", "9.1%", "9.1%", "—", "—"], f: ["1 holding · Q2 mark", "unbenchmarked"] },
  "Fixed income": { m: [["₹11,00,000", "contributed"], ["₹12,92,000", "accrued"], ["+₹1,92,000", "interest credited"], ["—", "no withdrawals"], ["₹94,200", "interest FY26"], ["+₹258", "daily accrual"]],
    r: ["+17.5%", "+0.00%", "7.4%", "7.2%", "0.0%", "7.14%"], f: ["PPF · 1 FD", "vs 10Y G-sec 6.9%"] },
  "Commodities": { m: [["₹3,48,000", "cost basis"], ["₹4,96,000", "62 g gold"], ["+₹1,48,000", "unrealised"], ["—", "no redemptions"], ["₹9,600", "SGB 2.5% coupon"], ["−₹1,537", "today"]],
    r: ["+42.5%", "−0.31%", "16.2%", "14.4%", "−11.2%", "2.50%"], f: ["SGB · digital gold", "vs MCX gold +0.2%"] },
  "Real estate": { m: [["₹54,00,000", "purchase + stamp"], ["₹68,00,000", "circle-rate mark"], ["+₹14,00,000", "unrealised"], ["—", "not sold"], ["₹2,64,000", "rent FY26, net"], ["—", "not marked daily"]],
    r: ["+25.9%", "—", "8.1%", "7.6%", "—", "3.88%"], f: ["1 property · self-marked", "vs Pune index +6.4%"] },
  "ESOP": { m: [["₹1,92,000", "strike paid"], ["₹6,40,000", "last 409A"], ["+₹4,48,000", "unrealised"], ["—", "no liquidity event"], ["—", "no dividends"], ["+₹1,856", "mark drift"]],
    r: ["+233.3%", "+0.29%", "41.2%", "33.8%", "−24.0%", "—"], f: ["3,200 vested · 1,800 unvested", "illiquid — no benchmark"] },
  "Cash": { m: [["₹2,86,000", "balance"], ["₹2,86,000", "swept"], ["—", "no mark"], ["—", "n/a"], ["₹8,900", "interest FY26"], ["+₹29", "daily accrual"]],
    r: ["—", "+0.01%", "3.1%", "3.1%", "—", "3.10%"], f: ["1 account · ICICI", "vs liquid fund 6.8%"] },
};

export type TabStat = { k: string; v: string; sub: string; color: string; sep: string };
export type InvestmentStats = { tabStats: TabStat[]; footCount: string; footBench: string };

// Any $ figure anywhere in the strip is re-grouped en-US, so hand-written
// literals can never drift from the values the helpers produce.
function usd(s: string): string {
  return s.replace(/\$([\d,]+(?:\.\d+)?)/g, (_, d: string) => {
    const dec = d.includes(".") ? 2 : 0;
    return "$" + Number(d.replace(/,/g, "")).toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  });
}

const tone = (s: string): string => (s === "—" ? DIM : isNeg(s) ? DOWN : UP);

export function computeInvestmentStats(tab: string): InvestmentStats {
  const base = STATS[tab] ?? STATS["All"];
  const T = TOTALS[tab] ?? TOTALS["All"];
  const lead = (inr: number) => (tab === "US equity" ? dollars(inr) : rupees(inr));
  const trail = (inr: number, fallback: string) => (tab === "US equity" ? rupees(inr) : tab === "All" ? dollars(inr) : fallback);
  const leadS = (inr: number) => (tab === "US equity" ? signed(inr, dollars) : signed(inr, rupees));
  const trailS = (inr: number, fallback: string) => (tab === "US equity" ? signed(inr, rupees) : tab === "All" ? signed(inr, dollars) : fallback);

  const unmarked = Math.abs(T.day) < 1;
  const m = base.m.map((pair, i): StatPair => {
    const out: StatPair = i === 1 ? [lead(T.value), trail(T.value, pair[1])]
      : i === 5 ? (unmarked ? ["—", pair[1]] : [leadS(T.day), trailS(T.day, pair[1])])
      : pair;
    return [usd(out[0]), usd(out[1])];
  });
  const r = base.r.map((v, i) => (i === 1 ? (unmarked ? "—" : pctStr(T.dayPct)) : v));

  const tabStats: TabStat[] = [
    ["Invested", m[0][0], m[0][1], TXT],
    ["Market value", m[1][0], m[1][1], TXT],
    ["Unrealised", m[2][0], m[2][1] + " · " + r[0], tone(m[2][0])],
    ["Realised FY26", m[3][0], m[3][1], tone(m[3][0])],
    ["Dividends FY26", m[4][0], m[4][1], m[4][0] === "—" ? DIM : TXT],
    ["Day P&L", m[5][0], m[5][1] + " · " + r[1], tone(m[5][0])],
    ["XIRR", r[2], "cash-flow weighted", tone(r[2])],
    ["CAGR", r[3], "since first lot", tone(r[3])],
    ["Max drawdown", r[4], "trailing 3Y", r[4] === "—" || r[4] === "0.0%" ? DIM : DOWN],
    ["Yield", r[5], "trailing 12m", TXT],
  ].map(([k, v, sub, color], i, arr) => ({ k, v, sub, color, sep: i === arr.length - 1 ? "none" : "inset -1px 0 0 rgba(233,233,237,0.09)" }));

  return { tabStats, footCount: base.f[0], footBench: base.f[1] };
}
