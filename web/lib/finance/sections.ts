// Left-rail section registry, ported 1:1 from Terminal - Investments.dc.html's
// `SECTIONS`. Drives the Rail nav, and — for sections without a hand-built
// page — the generic ScaffoldSection's title/subtitle/module-path footer.

export type StubInfo = [title: string, body: string, modulePath: string];

export type SectionItem = {
  id: string;
  label: string;
  badge?: string;
  stub?: StubInfo;
};

export type SectionGroup = { g: string; items: SectionItem[] };

export const SECTIONS: SectionGroup[] = [
  { g: "Position", items: [
    { id: "overview", label: "Overview" },
    { id: "holdings", label: "Investments" },
    { id: "networth", label: "Net worth", stub: ["Net worth", "Balance-sheet view of every account with a monthly close snapshot, so the curve is auditable rather than derived on the fly.", "modules/networth"] },
    { id: "markets", label: "Markets", badge: "wkspc", stub: ["Markets", "The one section that keeps the OpenTerminal widget workspace: chart, quote, screener, heatmap, options, tape. Widget-level add-ons live here and nowhere else.", "modules/markets (widget host)"] },
  ]},
  { g: "Flow", items: [
    { id: "cashflow", label: "Cashflow", badge: "P2", stub: ["Cashflow", "Money in against money out by month, with runway and a salary-to-savings waterfall.", "modules/cashflow"] },
    { id: "expenses", label: "Expenses", badge: "P2", stub: ["Expenses", "Merchant-level ledger fed by the SMS relay and card statements, with segment drift: which category grew, by how much, against its own trailing median.", "modules/expenses"] },
    { id: "subs", label: "Subscriptions", badge: "P2", stub: ["Subscriptions", "Recurring detection over the expense ledger — cadence, next charge, price increases since signup, and a cut list ranked by rupees per unused month.", "modules/subscriptions"] },
    { id: "income", label: "Income", badge: "P3", stub: ["Income", "Salary, 3D printing, and any other source as its own P&L line with unit economics: revenue, direct cost, contribution margin per source.", "modules/income"] },
  ]},
  { g: "Books", items: [
    { id: "statements", label: "Statements", badge: "P3", stub: ["Statements", "A personal P&L, a balance sheet, and a monthly close checklist. Same numbers as everywhere else, presented the way a finance team would read them.", "modules/statements"] },
    { id: "tax", label: "Tax", badge: "P3", stub: ["Tax", "Realised gains by term and jurisdiction, advance-tax schedule, Schedule FA for foreign holdings, and a lot-level what-if.", "modules/tax"] },
  ]},
  { g: "System", items: [
    { id: "inbox", label: "Review queue", badge: "7" },
    { id: "connectors", label: "Connectors", stub: ["Connectors", "Gmail MCP, the SMS relay APK, broker CSV drops, EPFO scrape and price providers — each with its last run, parse rate, and the writes it is allowed to make.", "modules/connectors"] },
  ]},
];

export const SECTION_IDS = SECTIONS.flatMap((s) => s.items.map((i) => i.id));

export function findStub(id: string): SectionItem | undefined {
  return SECTIONS.flatMap((s) => s.items).find((i) => i.id === id && i.stub);
}

export const TITLES: Record<string, [string, string]> = {
  overview: ["Overview", "all accounts · INR"],
  holdings: ["Investments", "24 positions · 11 accounts"],
  inbox: ["Review queue", "7 pending writes"],
};

export function titleFor(id: string): [string, string] {
  if (TITLES[id]) return TITLES[id];
  const stub = findStub(id);
  if (stub?.stub) return [stub.stub[0], stub.stub[2]];
  return ["", ""];
}
