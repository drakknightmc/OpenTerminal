// Holdings data, ported 1:1 from Terminal - Investments.dc.html's `ROWS`,
// `CLASS_OF`, `FX` and formatting helpers. Placeholder data matching the
// design prototype — see design/README.md: "every number in the prototype
// is a server-computed rollup" — a real backend should replace this module
// without changing the shape consumers read (holdings rows + TOTALS).

// [sym, name, acct, qty, avg, ltp, day%, valueUsd, valueInr, pnl, pnlPct, xirr, wt]
export const ROWS: string[][] = [
  ["RELIANCE", "Reliance Industries", "NSE · Zerodha", "480", "₹2,684", "₹2,912", "+0.84%", "₹13,97,760", "", "+₹1,09,440", "+8.5%", "14.2%", "5.9%"],
  ["HDFCBANK", "HDFC Bank", "NSE · Zerodha", "520", "₹1,510", "₹1,678", "+0.21%", "₹8,72,560", "", "+₹87,360", "+11.1%", "9.8%", "3.7%"],
  ["INFY", "Infosys", "NSE · Zerodha", "460", "₹1,432", "₹1,389", "−0.62%", "₹6,38,940", "", "−₹19,780", "−3.0%", "−2.1%", "2.7%"],
  ["NVDA", "NVIDIA Corp", "NASDAQ · IBKR", "130", "$118.40", "$174.22", "+1.92%", "$22,649", "₹18,82,551", "+$7,257", "+47.1%", "61.4%", "7.9%"],
  ["AAPL", "Apple Inc", "NASDAQ · IBKR", "62", "$196.10", "$228.55", "−0.34%", "$14,170", "₹11,77,819", "+$2,012", "+16.5%", "12.7%", "5.0%"],
  ["VOO", "Vanguard S&P 500", "NYSE · IBKR", "31", "$472.20", "$562.90", "+0.41%", "$17,450", "₹14,50,196", "+$2,812", "+19.2%", "15.9%", "6.1%"],
  ["PPFAS-FC", "Parag Parikh Flexi Cap", "MF · MFCentral", "7,900.0", "₹58.94", "₹76.12", "+0.37%", "₹6,01,348", "", "+₹1,35,722", "+29.1%", "18.4%", "2.5%"],
  ["BTC", "Bitcoin", "CoinDCX", "0.0412", "₹49,10,000", "₹61,20,000", "−1.24%", "₹2,52,144", "", "+₹49,852", "+24.6%", "31.0%", "1.1%"],
  ["ETH", "Ethereum", "CoinDCX", "1.85", "₹2,38,400", "₹2,72,100", "−2.10%", "₹5,03,385", "", "+₹62,345", "+14.1%", "11.2%", "2.1%"],
  ["EPF", "Employees' Provident Fund", "EPFO · UAN", "—", "—", "8.25% p.a.", "+0.01%", "₹12,84,000", "", "+₹1,02,300", "+8.6%", "8.3%", "5.4%"],
  ["TATAMOTORS", "Tata Motors", "NSE · Zerodha", "420", "₹1,042", "₹1,118", "+1.14%", "₹4,69,560", "", "+₹31,920", "+7.3%", "11.4%", "2.0%"],
  ["ITC", "ITC Ltd", "NSE · Zerodha", "990", "₹412", "₹468", "+0.33%", "₹4,63,320", "", "+₹55,440", "+13.6%", "10.2%", "2.0%"],
  ["HDFC-SC", "HDFC Small Cap", "MF · MFCentral", "6,200.0", "₹92.40", "₹118.60", "+0.44%", "₹7,35,320", "", "+₹1,62,440", "+28.4%", "16.8%", "3.1%"],
  ["NIFTY-IDX", "Nippon India Index", "MF · MFCentral", "9,315.0", "₹142.10", "₹168.40", "+0.19%", "₹15,68,646", "", "+₹2,44,984", "+18.5%", "13.1%", "6.6%"],
  ["SOL", "Solana", "CoinDCX", "18.4", "₹9,820", "₹8,840", "−3.02%", "₹1,62,656", "", "−₹18,032", "−9.9%", "−6.4%", "0.7%"],
  ["NPS-T1", "NPS Tier I · Scheme E", "NPS · PRAN", "—", "—", "12.4% p.a.", "+0.02%", "₹3,56,000", "", "+₹95,700", "+36.7%", "12.4%", "1.5%"],
  ["KLPT-U", "Kalpataru Labs (unlisted)", "Private · demat", "1,200", "₹291.67", "₹341.67", "—", "₹4,10,000", "", "+₹60,000", "+17.1%", "9.1%", "1.7%"],
  ["PPF", "Public Provident Fund", "PPF · SBI", "—", "₹6,80,000", "7.1% p.a.", "+0.02%", "₹8,42,000", "", "+₹1,62,000", "+23.8%", "7.1%", "3.5%"],
  ["FD-SBI", "Fixed deposit · 7.25%", "FD · SBI", "—", "₹4,20,000", "7.25% p.a.", "+0.02%", "₹4,50,000", "", "+₹30,000", "+7.1%", "7.3%", "1.9%"],
  ["SGB-31", "Sovereign Gold Bond 2.5% 2031", "SGB · demat", "48 g", "₹5,417", "₹8,000", "−0.31%", "₹3,84,000", "", "+₹1,24,000", "+47.7%", "16.2%", "1.6%"],
  ["DGOLD", "Digital gold", "MMTC-PAMP", "14 g", "₹6,286", "₹8,000", "−0.31%", "₹1,12,000", "", "+₹24,000", "+27.3%", "11.8%", "0.5%"],
  ["FLAT-PN", "Flat · Baner, Pune", "Property · deed", "1", "₹54,00,000", "₹68,00,000", "—", "₹68,00,000", "", "+₹14,00,000", "+25.9%", "8.1%", "28.6%"],
  ["ESOP-V", "Employer ESOP · vested", "ESOP · Carta", "3,200", "₹60.00", "₹200.00", "+0.29%", "₹6,40,000", "", "+₹4,48,000", "+233.3%", "41.2%", "2.7%"],
  ["CASH", "Savings + sweep", "ICICI ••4417", "—", "—", "3.1% p.a.", "+0.01%", "₹2,86,000", "", "—", "—", "3.1%", "1.2%"],
];

export const CLASS_OF: Record<string, string> = {
  RELIANCE: "Indian equity", HDFCBANK: "Indian equity", INFY: "Indian equity",
  TATAMOTORS: "Indian equity", ITC: "Indian equity",
  NVDA: "US equity", AAPL: "US equity", VOO: "US equity",
  "PPFAS-FC": "Mutual funds", "HDFC-SC": "Mutual funds", "NIFTY-IDX": "Mutual funds",
  BTC: "Crypto", ETH: "Crypto", SOL: "Crypto",
  EPF: "Retirement", "NPS-T1": "Retirement",
  "KLPT-U": "Private",
  PPF: "Fixed income", "FD-SBI": "Fixed income",
  "SGB-31": "Commodities", DGOLD: "Commodities",
  "FLAT-PN": "Real estate", "ESOP-V": "ESOP", CASH: "Cash",
};

export const FX = 83.12;

export const numOf = (s: string): number => {
  const n = Number(String(s).replace(/[^0-9.]/g, ""));
  return isFinite(n) ? n : 0;
};
export const signOf = (s: string): number => (String(s).trim().startsWith("−") ? -1 : 1);
export const inrOf = (r: string[]): number => (r[8] && r[8].trim() ? numOf(r[8]) : numOf(r[7]));
export const pctOf = (r: string[]): number => (r[6] === "—" ? 0 : signOf(r[6]) * numOf(r[6]));
export const rupees = (v: number): string => "₹" + Math.round(v).toLocaleString("en-IN");
export const dollars = (v: number): string => "$" + Math.round(v / FX).toLocaleString("en-US");
export const signed = (v: number, f2: (n: number) => string): string => (v < 0 ? "−" : "+") + f2(Math.abs(v));
export const pctStr = (p: number): string => (p < 0 ? "−" : "+") + Math.abs(p).toFixed(2) + "%";
export const isNeg = (s: string): boolean => typeof s === "string" && s.trim().startsWith("−");

export type ClassTotals = { value: number; day: number; n: number; dayPct: number };

export const TOTALS: Record<string, ClassTotals> = (() => {
  const acc: Record<string, ClassTotals> = {};
  for (const r of ROWS) {
    const cls = CLASS_OF[r[0]];
    const v = inrOf(r);
    const d = (v * pctOf(r)) / 100;
    for (const k of [cls, "All"]) {
      acc[k] = acc[k] || { value: 0, day: 0, n: 0, dayPct: 0 };
      acc[k].value += v;
      acc[k].day += d;
      acc[k].n += 1;
    }
  }
  for (const k in acc) acc[k].dayPct = acc[k].value ? (acc[k].day / acc[k].value) * 100 : 0;
  return acc;
})();
