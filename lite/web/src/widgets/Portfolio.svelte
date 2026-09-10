<script lang="ts">
  import { onMount } from "svelte";
  import type { PortfolioSection } from "../store/widgets";

  export let section: PortfolioSection | undefined;

  type Market = "us" | "india" | "crypto" | "mf";
  type Currency = "USD" | "INR";
  type TransactionType = "buy" | "sell";

  interface HoldingWithValue {
    id: number;
    market: Market;
    symbol: string;
    currency: Currency;
    quantity: number;
    avg_cost: number;
    created_at: string;
    updated_at: string;
    source?: string;
    sourceLabel?: string;
    nativeValue: number;
    convertedValue: number;
    unrealizedPnl: number;
    unrealizedPnlPercent: number;
  }

  interface MarketSummary {
    market: Market;
    source: string;
    sourceLabel: string;
    nativeCurrency: Currency;
    nativeTotal: number;
    inrValue: number;
    usdValue: number;
    holdingCount: number;
  }

  interface NetWorthSummary {
    totalInr: number;
    totalUsd: number;
    byMarket: MarketSummary[];
    holdings: HoldingWithValue[];
    computedAt: string;
  }

  interface TransactionInput {
    market: Market;
    symbol: string;
    type: TransactionType;
    quantity: number;
    price: number;
    date: string;
    notes?: string;
  }

  const markets: Market[] = ["us", "india", "crypto", "mf"];
  const marketLabels: Record<Market, string> = {
    us: "US",
    india: "India",
    crypto: "Crypto",
    mf: "MF",
  };

  const sourceSections: PortfolioSection[] = ["icici_direct", "ibkr", "groww_mf"];
  const sourceLabels: Record<PortfolioSection, string> = {
    total: "Total",
    icici_direct: "ICICI Direct",
    ibkr: "IBKR",
    groww_mf: "Groww MF",
  };

  // Opt-in demo data for local UI work; production never uses this value.
  const demoSummary: NetWorthSummary = {
    totalInr: 1843250,
    totalUsd: 22112.34,
    computedAt: new Date().toISOString(),
    byMarket: [
      { market: "us", source: "demo", sourceLabel: "Demo", nativeCurrency: "USD", nativeTotal: 12450, inrValue: 1039800, usdValue: 12450, holdingCount: 2 },
      { market: "india", source: "demo", sourceLabel: "Demo", nativeCurrency: "INR", nativeTotal: 545000, inrValue: 545000, usdValue: 6526, holdingCount: 2 },
      { market: "crypto", source: "demo", sourceLabel: "Demo", nativeCurrency: "USD", nativeTotal: 2820, inrValue: 235620, usdValue: 2820, holdingCount: 1 },
      { market: "mf", source: "demo", sourceLabel: "Demo", nativeCurrency: "INR", nativeTotal: 228450, inrValue: 228450, usdValue: 2736, holdingCount: 1 },
    ],
    holdings: [],
  };

  let summary: NetWorthSummary | null = null;
  let primaryCurrency: Currency = "INR";
  let loading = true;
  let error: string | null = null;
  let submitting = false;
  let formError: string | null = null;
  let form: TransactionInput = {
    market: "us",
    symbol: "",
    type: "buy",
    quantity: 1,
    price: 0,
    date: new Date().toISOString().slice(0, 10),
  };

  async function fetchNetWorth(): Promise<NetWorthSummary> {
    // TODO: Add cache and refresh controls once the portfolio route is live.
    const response = await fetch("/api/portfolio/networth");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  async function addTransaction(tx: TransactionInput): Promise<void> {
    // TODO: Add optimistic updates when transaction validation is exposed by the API.
    const response = await fetch("/api/portfolio/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tx),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  }

  async function loadPortfolio() {
    loading = true;
    error = null;
    try {
      summary = await fetchNetWorth();
    } catch (e) {
      if (import.meta.env.DEV && import.meta.env.VITE_PORTFOLIO_DEMO === "true") {
        summary = demoSummary;
      } else {
        error = e instanceof Error ? e.message : "Unable to load portfolio";
      }
    } finally {
      loading = false;
    }
  }

  async function submitTransaction() {
    formError = null;
    if (!form.symbol.trim() || form.quantity <= 0 || form.price < 0 || !form.date) {
      formError = "Enter a symbol, positive quantity, price, and date.";
      return;
    }

    submitting = true;
    try {
      await addTransaction({ ...form, symbol: form.symbol.trim().toUpperCase() });
      form.symbol = "";
      await loadPortfolio();
    } catch (e) {
      formError = e instanceof Error ? e.message : "Unable to add transaction";
    } finally {
      submitting = false;
    }
  }

  function formatNumber(value: number, maximumFractionDigits = 2): string {
    const absolute = Math.abs(value);
    if (absolute >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
    if (absolute >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (absolute >= 100_000) return `${(value / 1_000).toFixed(1)}K`;
    return new Intl.NumberFormat("en-IN", { maximumFractionDigits }).format(value);
  }

  function money(value: number, currency: Currency): string {
    return `${currency === "INR" ? "₹" : "$"}${formatNumber(value)}`;
  }

  function otherCurrency(currency: Currency): Currency {
    return currency === "INR" ? "USD" : "INR";
  }

  function marketSummary(market: Market): MarketSummary | undefined {
    return summary?.byMarket.find((item) => item.market === market);
  }

  function sourceSummary(sourceId: PortfolioSection) {
    if (!summary) return null;
    const holdings = summary.holdings.filter((h) => h.source === sourceId);
    if (holdings.length === 0) return null;
    const inr = holdings.reduce((total, h) => {
      if (!h.currency) return total;
      return total + (h.currency === "INR" ? h.nativeValue : h.convertedValue);
    }, 0);
    const usd = holdings.reduce((total, h) => {
      if (!h.currency) return total;
      return total + (h.currency === "USD" ? h.nativeValue : h.convertedValue);
    }, 0);
    const nativeTotal = primaryCurrency === "INR" ? inr : usd;
    return { nativeTotal, nativeCurrency: primaryCurrency, count: holdings.length };
  }

  $: primaryTotal = primaryCurrency === "INR" ? summary?.totalInr ?? 0 : summary?.totalUsd ?? 0;
  $: visibleHoldings = section && section !== "total"
    ? summary?.holdings.filter((holding) => holding.source === section) ?? []
    : summary?.holdings ?? [];
  $: sectionInr = visibleHoldings.reduce(
    (total, holding) => total + (holding.currency === "INR" ? holding.nativeValue : holding.convertedValue),
    0,
  );
  $: sectionUsd = visibleHoldings.reduce(
    (total, holding) => total + (holding.currency === "USD" ? holding.nativeValue : holding.convertedValue),
    0,
  );
  $: holdingGroups = summary ? Array.from(
    visibleHoldings.reduce((groups, holding) => {
      const key = `${holding.sourceLabel ?? "Manual"}/${marketLabels[holding.market]}`;
      const group = groups.get(key) ?? { key, label: key, holdings: [] as HoldingWithValue[] };
      group.holdings.push(holding);
      groups.set(key, group);
      return groups;
    }, new Map<string, { key: string; label: string; holdings: HoldingWithValue[] }>()).values()
  ) : [];

  onMount(loadPortfolio);
</script>

<main class="portfolio">
  <header class="page-header">
    <div>
      <p class="eyebrow">PORTFOLIO // NET WORTH</p>
      <h1>Holdings</h1>
    </div>
    {#if summary}
      <time datetime={summary.computedAt}>Updated {new Date(summary.computedAt).toLocaleTimeString()}</time>
    {/if}
  </header>

  {#if loading}
    <section class="panel state"><span class="pulse">_</span> Loading portfolio...</section>
  {:else if error}
    <section class="panel state error">Error: {error}</section>
  {:else if summary}
    {#if section === "total"}
      <section class="panel overview">
        <div class="total-block">
          <span class="label">TOTAL INR</span>
          <strong>{money(summary.totalInr, "INR")}</strong>
          <span class="label">TOTAL USD</span>
          <strong>{money(summary.totalUsd, "USD")}</strong>
          <button class="currency-toggle" type="button" on:click={() => (primaryCurrency = otherCurrency(primaryCurrency))}>
            Primary: {primaryCurrency}
          </button>
        </div>
        <div class="market-row">
          {#each sourceSections as source}
            {@const item = sourceSummary(source)}
            <div class="market-card">
              <span class="market-name">{sourceLabels[source]}</span>
              <strong>{item ? money(item.nativeTotal, item.nativeCurrency) : "--"}</strong>
              <span class="muted">{item?.count ?? 0} holding{item?.count === 1 ? "" : "s"}</span>
            </div>
          {/each}
        </div>
      </section>
    {:else if section}
      <section class="panel overview">
        <div class="total-block">
          <span class="label">SUBTOTAL INR</span>
          <strong>{money(sectionInr, "INR")}</strong>
          <span class="label">SUBTOTAL USD</span>
          <strong>{money(sectionUsd, "USD")}</strong>
        </div>
      </section>
    {:else}
      <section class="panel overview">
        <div class="total-block">
          <span class="label">TOTAL {primaryCurrency}</span>
          <strong>{money(primaryTotal, primaryCurrency)}</strong>
          <button class="currency-toggle" type="button" on:click={() => (primaryCurrency = otherCurrency(primaryCurrency))}>
            Show {otherCurrency(primaryCurrency)}
          </button>
        </div>
        <div class="market-row">
          {#each markets as market}
            {@const item = marketSummary(market)}
            <div class="market-card">
              <span class="market-name">{marketLabels[market]}</span>
              <strong>{item ? money(item.nativeTotal, item.nativeCurrency) : "--"}</strong>
              <span class="muted">{item?.holdingCount ?? 0} holding{item?.holdingCount === 1 ? "" : "s"}</span>
            </div>
          {/each}
        </div>
      </section>
    {/if}

    {#if section !== "total"}
    <section class="panel table-panel">
      <div class="section-heading"><h2>Positions</h2><span>{visibleHoldings.length} total</span></div>
      <div class="table-scroll">
        <table>
          <thead><tr><th>Market</th><th>Symbol</th><th>Qty</th><th>Avg cost</th><th>Native value</th><th>Unrealized P&amp;L</th></tr></thead>
          <tbody>
            {#if visibleHoldings.length === 0}
              <tr><td class="empty" colspan="6">No holdings yet. Add a transaction below.</td></tr>
             {:else}
              {#each holdingGroups as group}
                <tr class="group-row"><td colspan="6">{group.label}</td></tr>
                {#each group.holdings as holding}
                <tr>
                  <td><span class="tag">{holding.market}</span></td>
                  <td class="symbol">{holding.symbol}</td>
                  <td>{formatNumber(holding.quantity, 4)}</td>
                  <td>{money(holding.avg_cost, holding.currency)}</td>
                  <td><strong>{money(holding.nativeValue, holding.currency)}</strong><small>{money(holding.convertedValue, otherCurrency(holding.currency))}</small></td>
                  <td class:pnl-gain={holding.unrealizedPnl >= 0} class:pnl-loss={holding.unrealizedPnl < 0}>
                    <strong>{holding.unrealizedPnl >= 0 ? "+" : ""}{money(holding.unrealizedPnl, holding.currency)}</strong>
                    <small>{(holding.unrealizedPnlPercent * 100).toFixed(2)}%</small>
                  </td>
                </tr>
                {/each}
              {/each}
            {/if}
          </tbody>
        </table>
      </div>
    </section>
    {/if}
  {/if}

  {#if !section}
  <section class="panel transaction-panel">
    <div class="section-heading"><h2>Add transaction</h2><span>BUY / SELL</span></div>
    <form on:submit|preventDefault={submitTransaction}>
      <label>Market<select bind:value={form.market}>{#each markets as market}<option value={market}>{marketLabels[market]}</option>{/each}</select></label>
      <label>Symbol<input bind:value={form.symbol} placeholder="AAPL" autocomplete="off" /></label>
      <fieldset><legend>Type</legend><label class="radio"><input type="radio" bind:group={form.type} value="buy" /> Buy</label><label class="radio"><input type="radio" bind:group={form.type} value="sell" /> Sell</label></fieldset>
      <label>Quantity<input type="number" min="0.0001" step="any" bind:value={form.quantity} /></label>
      <label>Price<input type="number" min="0" step="any" bind:value={form.price} /></label>
      <label>Date<input type="date" bind:value={form.date} /></label>
      <button class="submit" type="submit" disabled={submitting}>{submitting ? "Adding..." : "Add transaction"}</button>
    </form>
    {#if formError}<p class="form-error">{formError}</p>{/if}
  </section>
  {/if}
</main>

<style>
  :global(body) { background: var(--color-bg); color: var(--color-text); font-family: "Courier New", monospace; }
  .portfolio { max-width: 1180px; margin: 0 auto; padding: 16px 14px 20px; }
  .page-header, .section-heading, .market-row, .total-block { display: flex; align-items: center; }
  .page-header { justify-content: space-between; margin-bottom: 20px; }
  .eyebrow, .label, .muted, time, .section-heading > span { color: var(--color-text-muted); font-size: 11px; letter-spacing: .08em; }
  h1, h2, p { margin: 0; } h1 { font-size: 24px; margin-top: 5px; } h2 { font-size: 14px; }
  .panel { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 5px; margin-bottom: 10px; }
  .overview { padding: 12px; } .total-block { gap: 14px; flex-wrap: wrap; }
  .total-block strong { font-size: 31px; letter-spacing: -.05em; }
  .total-block .label { align-self: flex-start; margin-top: 7px; }
  button { font: inherit; cursor: pointer; } .currency-toggle { background: transparent; border: 1px solid var(--color-text-faint); color: var(--color-text-dim); padding: 5px 8px; font-size: 11px; }
  .currency-toggle:hover, .submit:hover { border-color: var(--color-text); color: #fff; }
  .market-row { gap: 8px; margin-top: 12px; overflow-x: auto; }
  .market-card { border-left: 1px solid var(--color-border); min-width: 130px; padding-left: 11px; display: grid; gap: 5px; }
  .market-name, .tag { color: var(--color-text-dim); font-size: 11px; text-transform: uppercase; } .market-card strong { font-size: 16px; }
  .table-panel, .transaction-panel { padding: 16px; } .section-heading { justify-content: space-between; margin-bottom: 12px; }
  .table-scroll { overflow-x: auto; } table { width: 100%; border-collapse: collapse; min-width: 760px; font-size: 12px; }
  th { color: var(--color-text-muted); font-size: 10px; font-weight: normal; text-align: left; text-transform: uppercase; padding: 8px; border-bottom: 1px solid var(--color-border); }
  td { padding: 10px 8px; border-bottom: 1px solid #292929; white-space: nowrap; } tr:last-child td { border-bottom: 0; }
  .tag { border: 1px solid #444; padding: 3px 5px; } .symbol { font-weight: bold; color: #fff; } small { display: block; color: var(--color-text-faint); font-size: 10px; margin-top: 3px; }
  .group-row td { background: #111; color: var(--color-text-dim); font-size: 10px; letter-spacing: .08em; text-transform: uppercase; padding-top: 14px; }
  .pnl-gain { color: var(--color-gain); } .pnl-loss { color: var(--color-loss); } .empty, .state { color: var(--color-text-muted); text-align: center; padding: 28px; }
  .pulse { color: var(--color-gain); } .error, .form-error { color: var(--color-loss); }
  form { display: grid; grid-template-columns: repeat(6, minmax(90px, 1fr)); gap: 10px; align-items: end; }
  label, legend { color: var(--color-text-muted); font-size: 11px; } input, select { display: block; box-sizing: border-box; width: 100%; margin-top: 5px; background: var(--color-bg); border: 1px solid var(--color-border); color: var(--color-text); font: inherit; font-size: 12px; padding: 8px; }
  input:focus, select:focus { outline: 1px solid var(--color-text-muted); } fieldset { border: 0; padding: 0; margin: 0; display: flex; gap: 9px; align-items: center; } fieldset label { color: var(--color-text); }
  .radio { display: flex; align-items: center; gap: 4px; } .radio input { width: auto; margin: 0; }
  .submit { background: var(--color-text); border: 1px solid var(--color-text); color: var(--color-bg); padding: 8px; font-weight: bold; } .submit:disabled { cursor: wait; opacity: .55; }
  .form-error { font-size: 11px; margin-top: 10px; }
  @media (max-width: 780px) { .page-header { align-items: flex-start; flex-direction: column; gap: 8px; } form { grid-template-columns: repeat(2, 1fr); } fieldset { min-height: 35px; } .submit { grid-column: span 2; } }
</style>
