// Ported 1:1 from Terminal - Investments.dc.html's `queue` (review-queue
// proposals).
export type QueueItem = {
  src: string; title: string; conf: string; confBg: string; confFg: string;
  parsed: string; raw: string; writes: string;
};

export const queue: QueueItem[] = ([
  ["gmail", "HDFC Bank card statement · August", "high 0.96", "#233d33", "#a9e6c6",
   "24 transactions · ₹68,412 total · 3 new merchants",
   "Statement PDF, hdfcbank.net · received 02 Sep 09:14",
   "expenses.transactions ×24, accounts.card_hdfc.balance"],
  ["sms", "Zerodha contract note", "high 0.94", "#233d33", "#a9e6c6",
   "BUY 12 TATAMOTORS @ ₹1,042.30 · ₹12,507.60 · order 2509021144",
   "VM-ZERODHA · 02 Sep 15:41",
   "investments.lots +1, cash.zerodha −₹12,507.60"],
  ["gmail", "PPFAS Flexi Cap SIP allotment", "high 0.91", "#233d33", "#a9e6c6",
   "₹25,000 · 328.42 units @ ₹76.12 · folio 4491882",
   "CAMS allotment mail · 01 Sep 06:02",
   "investments.mf_lots +1, cashflow.sip"],
  ["sms", "UPI debit ₹1,899 — unmatched merchant", "low 0.42", "#4a2f2d", "#f0c1bd",
   "₹1,899 · VPA rzp.notion@icici · category guess: Software",
   "AD-ICICIB · 03 Sep 11:27",
   "expenses.transactions +1 · needs category"],
  ["file", "IBKR activity statement Q2", "medium 0.78", "#3a3320", "#ecdca6",
   "17 trades · 2 dividends · $4.20 withholding · FX at trade date",
   "Dropped into ~/statements/ibkr · 04 Sep",
   "investments.lots ×17, tax.foreign_withholding"],
] as [string, string, string, string, string, string, string, string][]).map(
  ([src, title, conf, confBg, confFg, parsed, raw, writes]) => ({ src, title, conf, confBg, confFg, parsed, raw, writes })
);
