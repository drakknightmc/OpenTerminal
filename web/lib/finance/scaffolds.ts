// Ported 1:1 from Terminal - Investments.dc.html's `SCAFFOLDS`. One entry
// per not-yet-hand-designed section; each sub-tab renders through the same
// generic template (tab row -> stat strip -> toolbar -> table -> footnote).
// All placeholder data shaped like the real thing — see design/README.md
// and chats/chat1.md for the rationale (not enough to trust, enough to
// build a data source against).

export type ScaffoldTab = {
  stats: [string, string, string][];
  cols: string[];
  rows: string[][];
  note: string;
};

export type ScaffoldEntry = { tabs: Record<string, ScaffoldTab> };

const T = (stats: [string, string, string][], cols: string[], rows: string[][], note: string): ScaffoldTab => ({ stats, cols, rows, note });

export const SCAFFOLDS: Record<string, ScaffoldEntry> = {
  networth: { tabs: {
    "Balance sheet": T(
      [["Assets", "₹2,44,05,205", "19 accounts"], ["Liabilities", "₹6,65,000", "2 loans"], ["Net worth", "₹2,37,40,205", "as of 04 Sep"], ["MoM", "+₹9,84,600", "+4.33%"]],
      ["Line", "Class", "Opening", "Movement", "Closing", "Share"],
      [["Investable assets", "Asset", "₹1,66,21,000", "+₹9,84,205", "₹1,76,05,205", "72.1%"],
       ["Property", "Asset", "₹68,00,000", "—0", "₹68,00,000", "27.9%"],
       ["Home loan", "Liability", "−₹6,82,000", "+₹17,000", "−₹6,65,000", "−2.8%"],
       ["Net worth", "Total", "₹2,27,39,000", "+₹10,01,205", "₹2,37,40,205", "100%"]],
      "Closing balances are monthly-close snapshots, not live sums — the Overview curve reads this table so it stays auditable."),
    "Accounts": T(
      [["Accounts", "19", "11 institutions"], ["Auto-synced", "12", "63%"], ["Manual", "7", "quarterly"], ["Stale >30d", "2", "EPFO, Carta"]],
      ["Account", "Institution", "Kind", "Balance", "Updated", "Method"],
      [["Zerodha equity", "Zerodha", "Broker", "₹38,42,140", "1s ago", "price feed"],
       ["IBKR margin", "IBKR", "Broker", "₹45,10,566", "1s ago", "price feed"],
       ["EPF · UAN", "EPFO", "Retirement", "₹12,84,000", "6d ago", "scrape"],
       ["Carta ESOP", "Carta", "Equity", "₹6,40,000", "41d ago", "manual"],
       ["ICICI savings", "ICICI", "Cash", "₹2,86,000", "4m ago", "sms relay"]],
      "Anything over 30 days stale shows on Overview as a data-quality flag rather than silently ageing."),
    "Monthly close": T(
      [["Closes filed", "11 / 12", "Aug pending"], ["Open items", "3", "all in review"], ["Avg close time", "18 min", "trailing 6m"], ["Last filed", "31 Jul", "by agent"]],
      ["Month", "Assets", "Liabilities", "Net worth", "Change", "Status"],
      [["Aug 2026", "₹2,44,05,205", "₹6,65,000", "₹2,37,40,205", "+4.33%", "pending"],
       ["Jul 2026", "₹2,34,21,000", "₹6,82,000", "₹2,27,39,000", "+2.981%", "filed"],
       ["Jun 2026", "₹2,27,80,000", "₹6,99,000", "₹2,20,81,000", "+1.42%", "filed"],
       ["May 2026", "₹2,24,90,000", "₹7,16,000", "₹2,17,74,000", "−0.61%", "filed"]],
      "A close freezes prices and marks at month end. Nothing recomputes a filed month."),
  } },
  markets: { tabs: {
    "Workspace": T(
      [["NIFTY 50", "24,918", "+0.42%"], ["S&P 500", "6,412", "+0.31%"], ["USDINR", "83.12", "−0.08%"], ["Widgets", "5", "saved layout"]],
      ["Widget", "Type", "Symbol", "Linked", "Provider", "Refresh"],
      [["Chart", "chart", "NVDA", "yes", "nasdaq → yahoo", "1s"],
       ["Quote", "quote", "NVDA", "yes", "nasdaq → yahoo", "1s"],
       ["Watchlist", "watchlist", "—", "no", "tradingview", "5s"],
       ["News", "news", "NVDA", "yes", "yahoo rss → google", "60s"],
       ["Macro", "macro", "—", "no", "fred", "300s"]],
      "The only section that keeps react-grid-layout. It is code-split behind this route, so no other page pays for it."),
    "Watchlist": T(
      [["Symbols", "12", "2 lists"], ["Held", "8", "of 12"], ["Alerts armed", "3", "price + news"], ["Triggered today", "1", "NVDA"]],
      ["Symbol", "Last", "Day", "vs 52w high", "Held", "Alert"],
      [["NVDA", "$174.22", "+1.92%", "−3.1%", "130 sh", "≥ $180"],
       ["TSLA", "$243.10", "−0.88%", "−19.4%", "—", "≤ $220"],
       ["RELIANCE", "₹2,912", "+0.84%", "−6.2%", "480 sh", "—"],
       ["BTC", "₹61,20,000", "−1.24%", "−11.8%", "0.0412", "≥ ₹70,00,000"]],
      "Watchlist entries that match a holding show position size inline, so the list doubles as a monitor."),
    "Screener": T(
      [["Universe", "4,812", "US + NSE"], ["Matching", "37", "current filter"], ["Saved screens", "4", "1 scheduled"], ["Last run", "2m ago", "auto"]],
      ["Symbol", "Sector", "Mkt cap", "P/E", "Day", "Vol vs avg"],
      [["ANET", "Technology", "$118B", "42.1", "+2.31%", "1.8×"],
       ["LRCX", "Semiconductors", "$96B", "24.6", "+1.14%", "1.2×"],
       ["POWERGRID", "Utilities", "₹3.1T", "18.2", "+0.62%", "0.9×"],
       ["CDSL", "Financials", "₹284B", "61.4", "−1.02%", "2.4×"]],
      "Filters run server-side against the provider's scanner; only the matching page is sent to the client."),
    "Heatmap": T(
      [["Sectors", "11", "US market"], ["Advancing", "7", "of 11"], ["Best", "Energy +1.8%", "today"], ["Worst", "Utilities −0.9%", "today"]],
      ["Sector", "Weight", "Day", "5d", "Breadth", "Your exposure"],
      [["Technology", "31.2%", "+0.84%", "+2.1%", "62% up", "18.4%"],
       ["Energy", "3.9%", "+1.81%", "+4.2%", "78% up", "0.0%"],
       ["Financials", "13.1%", "+0.22%", "+0.9%", "54% up", "4.3%"],
       ["Utilities", "2.4%", "−0.91%", "−1.4%", "31% up", "0.0%"]],
      "Your exposure is a look-through of index funds, not just direct holdings."),
  } },
  cashflow: { tabs: {
    "Monthly": T(
      [["Inflow MTD", "₹3,42,000", "2 sources"], ["Outflow MTD", "₹1,86,400", "41 merchants"], ["Net", "+₹1,55,600", "45.5% of inflow"], ["12m avg net", "+₹1,42,300", "41.2%"]],
      ["Month", "Salary", "Other income", "Fixed", "Variable", "Net", "Savings rate"],
      [["Sep 2026", "₹3,00,000", "₹42,000", "₹94,200", "₹92,200", "+₹1,55,600", "45.5%"],
       ["Aug 2026", "₹3,00,000", "₹38,400", "₹94,200", "₹1,12,600", "+₹1,31,600", "38.9%"],
       ["Jul 2026", "₹3,00,000", "₹51,200", "₹94,200", "₹88,400", "+₹1,68,600", "48.0%"],
       ["Jun 2026", "₹3,00,000", "₹29,800", "₹92,000", "₹1,04,900", "+₹1,32,900", "40.3%"]],
      "Fixed is anything subscriptions and loans mark recurring; everything else falls to variable."),
    "Runway": T(
      [["Liquid", "₹15,78,000", "cash + funds"], ["Avg burn", "₹1,74,300", "trailing 6m"], ["Runway", "9.1 mo", "liquid only"], ["With equity", "34.2 mo", "if liquidated"]],
      ["Scenario", "Available", "Monthly burn", "Runway", "Tax on exit", "Note"],
      [["Cash only", "₹2,86,000", "₹1,74,300", "1.6 mo", "₹0", "no disposal"],
       ["Cash + liquid funds", "₹15,78,000", "₹1,74,300", "9.1 mo", "₹42,000", "MF redemption"],
       ["+ listed equity", "₹59,30,000", "₹1,74,300", "34.2 mo", "₹3,84,000", "LTCG at 12.5%"],
       ["Lean burn", "₹15,78,000", "₹1,08,000", "14.6 mo", "₹42,000", "fixed costs only"]],
      "Runway assumes fixed costs continue and variable spend drops to the trailing 12-month floor."),
    "Waterfall": T(
      [["Gross inflow", "₹3,42,000", "Sep"], ["To fixed", "₹94,200", "27.5%"], ["To variable", "₹92,200", "27.0%"], ["To savings", "₹1,55,600", "45.5%"]],
      ["Step", "Amount", "Running", "% of inflow", "vs 12m avg"],
      [["Salary + other", "+₹3,42,000", "₹3,42,000", "100%", "+2.1%"],
       ["Rent + loans", "−₹94,200", "₹2,47,800", "72.5%", "+0.4%"],
       ["Living costs", "−₹92,200", "₹1,55,600", "45.5%", "−8.2%"],
       ["SIP + investing", "−₹1,25,000", "₹30,600", "8.9%", "+0.0%"]],
      "The waterfall ends at unallocated cash, which is what actually lands in the sweep account."),
  } },
  expenses: { tabs: {
    "Ledger": T(
      [["MTD", "₹1,86,400", "41 merchants"], ["vs 6m median", "+12.4%", "₹20,600 over"], ["Uncategorised", "3", "needs a rule"], ["Cards", "3", "2 auto-synced"]],
      ["Date", "Merchant", "Segment", "Account", "Amount", "Source", "Status"],
      [["03 Sep", "Notion Labs", "Software", "ICICI ••4417", "₹1,899", "sms", "unmatched"],
       ["02 Sep", "Blue Tokai", "Dining", "HDFC ••8802", "₹640", "sms", "auto"],
       ["01 Sep", "Landlord — rent", "Rent", "ICICI ••4417", "₹52,000", "gmail", "auto"],
       ["01 Sep", "Amazon.in", "Household", "HDFC ••8802", "₹3,412", "statement", "auto"],
       ["31 Aug", "Indian Oil", "Fuel", "HDFC ••8802", "₹4,100", "sms", "auto"]],
      "Every row traces to a proposal in the review queue, so a wrong category is one click from its source message."),
    "Segments": T(
      [["Segments", "11", "3 growing"], ["Largest", "Rent 27.9%", "₹52,000"], ["Fastest growing", "Dining +38%", "₹9,200 over"], ["Under median", "5", "₹14,100 under"]],
      ["Segment", "MTD", "6m median", "Drift", "Share", "Trend 6m"],
      [["Rent", "₹52,000", "₹52,000", "0.0%", "27.9%", "flat"],
       ["Dining", "₹33,400", "₹24,200", "+38.0%", "17.9%", "rising"],
       ["Groceries", "₹18,600", "₹21,400", "−13.1%", "10.0%", "falling"],
       ["Software", "₹9,840", "₹8,200", "+20.0%", "5.3%", "rising"],
       ["Fuel", "₹4,100", "₹6,900", "−40.6%", "2.2%", "falling"]],
      "Drift compares a segment against its own trailing median, not against a budget you never set."),
    "Merchants": T(
      [["Merchants", "41", "MTD"], ["New this month", "3", "₹6,240"], ["Top merchant", "Landlord", "₹52,000"], ["Normalised", "38 / 41", "3 aliases open"]],
      ["Merchant", "Segment", "MTD", "Txns", "Avg", "First seen"],
      [["Landlord — rent", "Rent", "₹52,000", "1", "₹52,000", "Apr 2023"],
       ["Swiggy", "Dining", "₹12,840", "14", "₹917", "Jun 2021"],
       ["Amazon.in", "Household", "₹8,904", "6", "₹1,484", "Nov 2019"],
       ["Blue Tokai", "Dining", "₹3,840", "6", "₹640", "Feb 2024"]],
      "Aliases (SWIGGY*ORDER, Swiggy Ltd) collapse to one merchant by rule; unresolved aliases show as open."),
    "Rules": T(
      [["Rules", "24", "18 auto-made"], ["Coverage", "96.2%", "of transactions"], ["Conflicts", "1", "needs a decision"], ["Last added", "2d ago", "by agent"]],
      ["Match", "Field", "Segment", "Applied", "Confidence", "Source"],
      [["rzp.notion@*", "vpa", "Software", "12", "0.98", "manual"],
       ["SWIGGY*", "merchant", "Dining", "184", "0.99", "auto"],
       ["*INDIANOIL*", "merchant", "Fuel", "31", "0.97", "auto"],
       ["amount > ₹50,000 + monthly", "pattern", "Rent", "18", "0.92", "auto"]],
      "Rules are ordered; the first match wins. A rule that would reclassify history asks before backfilling."),
  } },
  subs: { tabs: {
    "Active": T(
      [["Monthly", "₹9,840", "14 active"], ["Annualised", "₹1,18,080", "8.7% of spend"], ["Unused 90d", "2", "₹1,690 / mo"], ["Cut candidates", "₹3,210", "per month"]],
      ["Service", "Cadence", "Amount", "Next charge", "Since", "Change 12m", "Usage"],
      [["Notion", "monthly", "₹1,899", "03 Oct", "Mar 2024", "+₹400", "weekly"],
       ["iCloud 2TB", "monthly", "₹749", "09 Sep", "Jan 2022", "+₹150", "passive"],
       ["Adobe CC", "annual", "₹42,000", "18 Nov", "Nov 2021", "+₹6,000", "none 90d"],
       ["Spotify", "monthly", "₹179", "12 Sep", "Aug 2020", "+₹60", "daily"],
       ["AWS Lightsail", "monthly", "₹941", "01 Oct", "Feb 2025", "—", "daily"]],
      "Detected from the expense ledger by cadence, not from a list you maintain. A missed charge shows as a gap, not a deletion."),
    "Upcoming": T(
      [["Next 7 days", "3", "₹2,438"], ["Next 30 days", "9", "₹8,610"], ["Largest", "Adobe CC", "₹42,000 on 18 Nov"], ["Cash needed", "₹50,610", "next 90d"]],
      ["Service", "Charges", "Amount", "Account", "Confidence", "Note"],
      [["iCloud 2TB", "09 Sep", "₹749", "HDFC ••8802", "0.99", "12 of 12 on time"],
       ["Spotify", "12 Sep", "₹179", "HDFC ••8802", "0.99", "stable price"],
       ["Netflix", "14 Sep", "₹1,510", "ICICI ••4417", "0.94", "price rise expected"],
       ["AWS Lightsail", "01 Oct", "₹941", "ICICI ••4417", "0.88", "usage-variable"]],
      "Predicted dates come from observed cadence; a variable-amount service shows its trailing average instead."),
    "Price creep": T(
      [["Rises 12m", "4", "+₹1,120 / mo"], ["Worst", "Adobe CC", "+₹6,000 / yr"], ["Silent rises", "3", "no email found"], ["Total drift", "+16.2%", "since signup"]],
      ["Service", "At signup", "Now", "Change", "Rises", "Last rise", "Notified"],
      [["Adobe CC", "₹36,000", "₹42,000", "+16.7%", "2", "Nov 2025", "email"],
       ["Notion", "₹1,499", "₹1,899", "+26.7%", "1", "Mar 2026", "none found"],
       ["iCloud 2TB", "₹599", "₹749", "+25.0%", "2", "Jan 2026", "none found"],
       ["Spotify", "₹119", "₹179", "+50.4%", "3", "Jul 2026", "none found"]],
      "A rise with no matching email is flagged silent — the most common way recurring spend grows unnoticed."),
    "Cancelled": T(
      [["Cancelled 12m", "6", "₹4,290 / mo saved"], ["Still charging", "1", "needs a dispute"], ["Avg lifetime", "19 mo", "before cancel"], ["Resubscribed", "2", "within 6m"]],
      ["Service", "Cancelled", "Was", "Lifetime", "Total paid", "Status"],
      [["Audible", "12 Aug 2026", "₹199 / mo", "22 mo", "₹4,378", "clean"],
       ["Coursera", "04 Jun 2026", "₹3,999 / yr", "24 mo", "₹7,998", "clean"],
       ["Figma", "18 Mar 2026", "₹1,240 / mo", "14 mo", "₹17,360", "still charging"],
       ["Dropbox", "02 Jan 2026", "₹829 / mo", "31 mo", "₹25,699", "clean"]],
      "A cancelled service that keeps charging is the single highest-value alert this section produces."),
  } },
  income: { tabs: {
    "Sources": T(
      [["Revenue FY26", "₹41,20,000", "4 sources"], ["Salary share", "87.4%", "concentration risk"], ["Ex-salary", "₹5,20,000", "12.6%"], ["Growth YoY", "+11.8%", "all sources"]],
      ["Source", "Revenue FY26", "Direct cost", "Contribution", "Margin", "Share", "Trend"],
      [["Salary", "₹36,00,000", "—", "₹36,00,000", "100%", "87.4%", "flat"],
       ["3D printing", "₹3,84,000", "₹1,46,000", "₹2,38,000", "62%", "9.3%", "+18% YoY"],
       ["Dividends", "₹48,900", "—", "₹48,900", "100%", "1.2%", "+9% YoY"],
       ["Consulting", "₹87,100", "₹4,200", "₹82,900", "95%", "2.1%", "−31% YoY"]],
      "Direct cost pulls filament, power and platform fees out of the expense ledger by rule, so margin is real."),
    "Unit economics": T(
      [["Orders FY26", "148", "3D printing"], ["Avg order", "₹2,595", "+₹180 YoY"], ["Contribution / order", "₹1,608", "62%"], ["Break-even", "34 orders", "per year"]],
      ["Line", "Per order", "Per month", "FY26", "% of revenue"],
      [["Revenue", "₹2,595", "₹32,000", "₹3,84,000", "100%"],
       ["Filament", "₹612", "₹7,548", "₹90,576", "23.6%"],
       ["Power", "₹148", "₹1,826", "₹21,912", "5.7%"],
       ["Platform fees", "₹227", "₹2,801", "₹33,612", "8.8%"],
       ["Contribution", "₹1,608", "₹19,825", "₹2,37,900", "62.0%"]],
      "Printer depreciation sits below contribution as a fixed cost, so unit economics stay comparable month to month."),
    "Invoices": T(
      [["Outstanding", "₹68,400", "4 invoices"], ["Overdue", "₹12,900", "1 invoice"], ["Avg days to pay", "23", "trailing 12m"], ["Raised FY26", "148", "₹3,84,000"]],
      ["Invoice", "Client", "Raised", "Due", "Amount", "Status"],
      [["INV-2026-148", "Marlowe Design", "28 Aug", "27 Sep", "₹24,800", "sent"],
       ["INV-2026-147", "Hexa Robotics", "21 Aug", "20 Sep", "₹18,200", "sent"],
       ["INV-2026-146", "Private buyer", "14 Aug", "13 Sep", "₹12,500", "sent"],
       ["INV-2026-141", "Hexa Robotics", "02 Jul", "01 Aug", "₹12,900", "overdue"]],
      "Paid invoices reconcile against bank credits from the SMS relay, so revenue is recognised on receipt."),
  } },
  statements: { tabs: {
    "P&L": T(
      [["Revenue", "₹41,20,000", "FY26 to date"], ["Expenses", "₹22,36,800", "54.3%"], ["Net", "₹18,83,200", "45.7% margin"], ["vs FY25", "+19.0%", "net"]],
      ["Line", "FY26", "FY25", "Δ", "% of revenue"],
      [["Revenue", "₹41,20,000", "₹36,84,000", "+11.8%", "100%"],
       ["Fixed costs", "₹11,30,400", "₹10,42,000", "+8.5%", "27.4%"],
       ["Variable costs", "₹9,52,400", "₹8,88,600", "+7.2%", "23.1%"],
       ["Finance costs", "₹1,54,000", "₹1,71,000", "−9.9%", "3.7%"],
       ["Net", "₹18,83,200", "₹15,82,400", "+19.0%", "45.7%"]],
      "Unrealised investment gains are excluded from P&L and shown only on the balance sheet."),
    "Balance sheet": T(
      [["Assets", "₹2,44,05,205", "19 accounts"], ["Liabilities", "₹6,65,000", "2 loans"], ["Net worth", "₹2,37,40,205", "as of 04 Sep"], ["Leverage", "2.7%", "debt / assets"]],
      ["Line", "Class", "FY26", "FY25", "Δ"],
      [["Listed investments", "Asset", "₹1,21,76,205", "₹98,40,000", "+23.7%"],
       ["Retirement + fixed income", "Asset", "₹29,32,000", "₹25,10,000", "+16.8%"],
       ["Property", "Asset", "₹68,00,000", "₹64,00,000", "+6.3%"],
       ["Illiquid (ESOP, private)", "Asset", "₹10,50,000", "₹6,80,000", "+54.4%"],
       ["Home loan", "Liability", "−₹6,65,000", "−₹8,84,000", "−24.8%"]],
      "Illiquid assets are shown separately because they cannot fund the runway calculation in Cashflow."),
    "Monthly close": T(
      [["Closes filed", "11 / 12", "Aug pending"], ["Open items", "3", "all in review"], ["Auto-cleared", "9", "of 12 checks"], ["Avg close time", "18 min", "trailing 6m"]],
      ["Check", "Owner", "Status", "Last run", "Blocking"],
      [["All proposals decided", "agent", "3 pending", "4m ago", "yes"],
       ["Prices frozen at month end", "system", "done", "31 Aug", "yes"],
       ["EPFO balance refreshed", "agent", "6d stale", "29 Aug", "yes"],
       ["ESOP mark current", "manual", "41d stale", "26 Jul", "no"],
       ["Bank balances reconciled", "system", "done", "01 Sep", "yes"]],
      "A month cannot be filed while a blocking check is open, which is what keeps the net-worth curve trustworthy."),
    "Notes": T(
      [["Notes", "6", "FY26"], ["Policy changes", "2", "this year"], ["Manual marks", "2", "ESOP, property"], ["Restatements", "0", "since FY24"]],
      ["Note", "Applies to", "Effective", "Reason"],
      [["Property marked at circle rate", "Real estate", "Apr 2024", "no independent valuation"],
       ["ESOP at last 409A", "ESOP", "Jul 2026", "no liquidity event"],
       ["Crypto at INR exchange rate", "Crypto", "Apr 2023", "CoinDCX is the funding venue"],
       ["FX at trade date for lots", "US equity", "Apr 2025", "matches Schedule FA method"]],
      "Every manual mark carries a note. A number without a source or a note should not appear in a filed month."),
  } },
  tax: { tabs: {
    "Realised gains": T(
      [["STCG", "₹1,15,200", "taxed at slab"], ["LTCG", "₹69,000", "20% post-2024"], ["Total realised", "₹1,84,200", "FY26"], ["Tax on realised", "₹45,285", "effective 24.6%"]],
      ["Asset", "Disposed", "Term", "Gain", "Rate", "Tax", "Jurisdiction"],
      [["BTC", "12 Jun 2026", "Short", "₹1,15,200", "30%", "₹34,560", "IN — VDA"],
       ["INFY", "28 Apr 2026", "Long", "₹41,000", "12.5%", "₹5,125", "IN — equity"],
       ["AAPL", "14 Mar 2026", "Long", "₹28,000", "20%", "₹5,600", "US → IN credit"],
       ["Dividends (US)", "FY26", "—", "$4.20", "25% WHT", "credited", "US → IN credit"]],
      "Every disposal on a position page runs through this table first, so the what-if and the filing use one calculation."),
    "Advance tax": T(
      [["Est. liability", "₹2,84,600", "FY26"], ["Paid", "₹1,95,000", "2 instalments"], ["Due 15 Dec", "₹89,600", "3rd instalment"], ["Interest risk", "₹0", "on track"]],
      ["Instalment", "Due", "Required", "Paid", "Shortfall", "Status"],
      [["15 Jun", "15 Jun 2026", "₹42,690", "₹45,000", "₹0", "paid"],
       ["15 Sep", "15 Sep 2026", "₹1,50,000", "₹1,50,000", "₹0", "paid"],
       ["15 Dec", "15 Dec 2026", "₹2,13,450", "₹1,95,000", "₹18,450", "due"],
       ["15 Mar", "15 Mar 2027", "₹2,84,600", "₹1,95,000", "₹89,600", "scheduled"]],
      "Required amounts follow the 15/45/75/100% schedule against the running estimate, which moves as gains are realised."),
    "Schedule FA": T(
      [["Foreign assets", "3", "all IBKR"], ["Peak value", "$57,120", "FY26"], ["Closing value", "$54,269", "31 Dec basis"], ["Income", "$142.60", "dividends"]],
      ["Asset", "Country", "Acquired", "Peak value", "Closing", "Income", "WHT"],
      [["NVDA", "US", "14 Aug 2024", "$24,180", "$22,649", "$0.00", "—"],
       ["AAPL", "US", "09 Nov 2024", "$15,020", "$14,170", "$61.20", "$15.30"],
       ["VOO", "US", "22 Jan 2025", "$17,920", "$17,450", "$81.40", "$20.35"],
       ["IBKR cash", "US", "—", "$1,240", "$318", "—", "—"]],
      "Peak value is the highest month-end balance in the calendar year, which is what the schedule actually asks for."),
    "What-if": T(
      [["Scenario", "Trim NVDA to 3%", "draft"], ["Shares", "72", "of 130"], ["Gain", "₹4,02,100", "long term"], ["Tax", "₹80,420", "at 20%"]],
      ["Lot", "Qty used", "Cost", "Proceeds", "Gain", "Term", "Tax"],
      [["2024-08-14", "56", "$5,387", "$9,756", "+$4,369", "Long", "−₹72,640"],
       ["2025-02-03", "16", "$1,942", "$2,788", "+$846", "Long", "−₹14,060"],
       ["2026-03-11", "0", "$0", "$0", "—", "Short", "₹0"],
       ["Total", "72", "$7,329", "$12,544", "+$5,215", "—", "−₹86,700"]],
      "Lot selection defaults to lowest tax, not FIFO. The chosen lots are what the review queue would write."),
  } },
  connectors: { tabs: {
    "Sources": T(
      [["Live", "4", "of 6 configured"], ["Proposals 30d", "186", "142 auto-applied"], ["Parse rate", "96.2%", "trailing 30d"], ["Failures 7d", "2", "both retried"]],
      ["Connector", "Kind", "Last run", "Parsed", "Confidence", "Policy", "Writes allowed"],
      [["Gmail MCP", "agent", "12m ago", "68 / 71", "0.94 avg", "auto-above-0.9", "expenses, investments"],
       ["SMS relay", "apk", "4m ago", "104 / 108", "0.91 avg", "auto-above-0.9", "expenses, cash"],
       ["IBKR files", "file drop", "1d ago", "17 / 17", "0.98 avg", "always-review", "investments, tax"],
       ["EPFO scrape", "scheduled", "6d ago", "1 / 1", "1.00", "always-review", "retirement"],
       ["Price providers", "read only", "1s ago", "—", "—", "n/a", "none"]],
      "A connector declares which sections it may write to. Anything outside that list is rejected before the queue."),
    "Policies": T(
      [["Always review", "3", "sections"], ["Auto above 0.9", "2", "sections"], ["Fully auto", "0", "by choice"], ["Overrides 30d", "4", "all manual"]],
      ["Section", "Policy", "Threshold", "Auto-applied 30d", "Reverted", "Owner"],
      [["Expenses", "auto-above-0.9", "0.90", "118", "2", "sms relay"],
       ["Investments", "always-review", "—", "0", "0", "broker files"],
       ["Cash", "auto-above-0.9", "0.90", "24", "0", "sms relay"],
       ["Tax", "always-review", "—", "0", "0", "manual"],
       ["Retirement", "always-review", "—", "0", "0", "epfo"]],
      "Auto-applied writes still appear in the review queue with an applied status, so the audit trail is complete."),
    "Runs": T(
      [["Runs 7d", "412", "6 connectors"], ["Failed", "2", "0.5%"], ["Avg latency", "1.8 s", "per run"], ["Next scheduled", "in 11 min", "gmail mcp"]],
      ["Run", "Connector", "Started", "Duration", "Items", "Result"],
      [["#4412", "SMS relay", "04 Sep 14:28", "0.4 s", "3", "ok"],
       ["#4411", "Gmail MCP", "04 Sep 14:16", "6.2 s", "11", "ok"],
       ["#4408", "EPFO scrape", "29 Aug 06:00", "18.4 s", "0", "failed — captcha"],
       ["#4407", "IBKR files", "28 Aug 09:12", "2.1 s", "17", "ok"]],
      "A failed run never partially writes. The whole batch either becomes proposals or is retried."),
  } },
};
