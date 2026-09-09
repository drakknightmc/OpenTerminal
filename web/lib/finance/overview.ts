// Ported 1:1 from Terminal - Investments.dc.html's Overview-page derivations
// (`sleeves`, `movers`, `reviewPeek`, `netWorth`, `dayLine`).
import { DOWN, UP } from "./colors";
import { TOTALS, dollars, pctStr, rupees, signed } from "./rows";

export type Sleeve = {
  name: string; value: string; weight: string; day: string; dayColor: string;
  native: string; bar: string; href: string;
};

const SLEEVE_DEFS: [name: string, cls: string, native: string, dest: string][] = [
  ["Real estate", "Real estate", "1 property, circle-rate mark", "holdings"],
  ["US equity", "US equity", "", "holdings"],
  ["Indian equity", "Indian equity", "5 positions", "holdings"],
  ["Mutual funds", "Mutual funds", "3 schemes", "holdings"],
  ["EPF · NPS", "Retirement", "accrual", "holdings"],
  ["Fixed income", "Fixed income", "PPF · 1 FD", "holdings"],
  ["Crypto", "Crypto", "3 assets", "holdings"],
  ["ESOP", "ESOP", "3,200 vested", "holdings"],
  ["Commodities", "Commodities", "62 g gold", "holdings"],
  ["Private equity", "Private", "1 holding, Q2 mark", "holdings"],
  ["Cash", "Cash", "ICICI sweep", "holdings"],
];

export function getSleeves(): Sleeve[] {
  const NW = TOTALS["All"].value;
  return SLEEVE_DEFS.map(([name, cls, nativeIn, dest]) => {
    const t = TOTALS[cls];
    const w = (t.value / NW) * 100;
    const native = cls === "US equity" ? dollars(t.value) : nativeIn;
    return {
      name, value: rupees(t.value), weight: w.toFixed(1) + "%",
      day: Math.abs(t.dayPct) < 0.005 ? "—" : pctStr(t.dayPct),
      dayColor: Math.abs(t.dayPct) < 0.005 ? "var(--color-neutral-600)" : t.dayPct < 0 ? DOWN : UP,
      native, bar: Math.round(w) + "%", href: "/" + dest,
    };
  });
}

export type Mover = { sym: string; name: string; pct: string; abs: string; color: string };

export const movers: Mover[] = [
  ["NVDA", "NVIDIA Corp", "+1.92%", "+₹36,145", UP],
  ["RELIANCE", "Reliance Industries", "+0.84%", "+₹11,741", UP],
  ["ETH", "Ethereum", "−2.10%", "−₹10,571", DOWN],
  ["VOO", "Vanguard S&P 500", "+0.41%", "+₹5,946", UP],
  ["TATAMOTORS", "Tata Motors", "+1.14%", "+₹5,353", UP],
].map(([sym, name, pct, abs, color]) => ({ sym, name, pct, abs, color }));

export type ReviewPeek = { src: string; title: string; meta: string };

export const reviewPeek: ReviewPeek[] = [
  ["gmail", "HDFC card statement · Aug", "24 transactions parsed · ₹68,412"],
  ["sms", "Zerodha contract note", "BUY 12 TATAMOTORS @ ₹1,042"],
  ["gmail", "PPFAS SIP debit", "₹25,000 · 328.4 units @ ₹76.12"],
].map(([src, title, meta]) => ({ src, title, meta }));

export function netWorth(): string {
  return rupees(TOTALS["All"].value);
}

export function dayLine(): string {
  return signed(TOTALS["All"].day, rupees) + " today · " + pctStr(TOTALS["All"].dayPct);
}
