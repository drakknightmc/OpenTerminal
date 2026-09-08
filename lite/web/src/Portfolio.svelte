<script lang="ts">
  import { onMount } from "svelte";

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
    nativeValue: number;
    convertedValue: number;
    unrealizedPnl: number;
    unrealizedPnlPercent: number;
  }

  interface MarketSummary {
    market: Market;
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

  // Opt-in demo data for local UI work; production never uses this value.
  const demoSummary: NetWorthSummary = {
    totalInr: 1843250,
    totalUsd: 22112.34,
    computedAt: new Date().toISOString(),
    byMarket: [
      { market: "us", nativeCurrency: "USD", nativeTotal: 12450, inrValue: 1039800, usdValue: 12450, holdingCount: 2 },
      { market: "india", nativeCurrency: "INR", nativeTotal: 545000, inrValue: 545000, usdValue: 6526, holdingCount: 2 },
      { market: "crypto", nativeCurrency: "USD", nativeTotal: 2820, inrValue: 235620, usdValue: 2820, holdingCount: 1 },
      { market: "mf", nativeCurrency: "INR", nativeTotal: 228450, inrValue: 228450, usdValue: 2736, holdingCount: 1 },
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

  $: primaryTotal = primaryCurrency === "INR" ? summary?.totalInr ?? 0 : summary?.totalUsd ?? 0;

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

    <section class="panel table-panel">
      <div class="section-heading"><h2>Positions</h2><span>{summary.holdings.length} total</span></div>
      <div class="table-scroll">
        <table>
          <thead><tr><th>Market</th><th>Symbol</th><th>Qty</th><th>Avg cost</th><th>Native value</th><th>Unrealized P&amp;L</th></tr></thead>
          <tbody>
            {#if summary.holdings.length === 0}
              <tr><td class="empty" colspan="6">No holdings yet. Add a transaction below.</td></tr>
            {:else}
              {#each summary.holdings as holding}
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
            {/if}
          </tbody>
        </table>
      </div>
    </section>
  {/if}

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
</main>

<style>
  :global(body) { background: #0a0a0a; color: #e0e0e0; font-family: "Courier New", monospace; }
  .portfolio { max-width: 1180px; margin: 0 auto; padding: 28px 18px 56px; }
  .page-header, .section-heading, .market-row, .total-block { display: flex; align-items: center; }
  .page-header { justify-content: space-between; margin-bottom: 20px; }
  .eyebrow, .label, .muted, time, .section-heading > span { color: #888; font-size: 11px; letter-spacing: .08em; }
  h1, h2, p { margin: 0; } h1 { font-size: 24px; margin-top: 5px; } h2 { font-size: 14px; }
  .panel { background: #1a1a1a; border: 1px solid #333; border-radius: 5px; margin-bottom: 16px; }
  .overview { padding: 18px; } .total-block { gap: 14px; flex-wrap: wrap; }
  .total-block strong { font-size: 31px; letter-spacing: -.05em; }
  .total-block .label { align-self: flex-start; margin-top: 7px; }
  button { font: inherit; cursor: pointer; } .currency-toggle { background: transparent; border: 1px solid #555; color: #aaa; padding: 5px 8px; font-size: 11px; }
  .currency-toggle:hover, .submit:hover { border-color: #e0e0e0; color: #fff; }
  .market-row { gap: 8px; margin-top: 22px; overflow-x: auto; }
  .market-card { border-left: 1px solid #333; min-width: 130px; padding-left: 11px; display: grid; gap: 5px; }
  .market-name, .tag { color: #aaa; font-size: 11px; text-transform: uppercase; } .market-card strong { font-size: 16px; }
  .table-panel, .transaction-panel { padding: 16px; } .section-heading { justify-content: space-between; margin-bottom: 12px; }
  .table-scroll { overflow-x: auto; } table { width: 100%; border-collapse: collapse; min-width: 760px; font-size: 12px; }
  th { color: #888; font-size: 10px; font-weight: normal; text-align: left; text-transform: uppercase; padding: 8px; border-bottom: 1px solid #333; }
  td { padding: 10px 8px; border-bottom: 1px solid #292929; white-space: nowrap; } tr:last-child td { border-bottom: 0; }
  .tag { border: 1px solid #444; padding: 3px 5px; } .symbol { font-weight: bold; color: #fff; } small { display: block; color: #555; font-size: 10px; margin-top: 3px; }
  .pnl-gain { color: #51cf66; } .pnl-loss { color: #ff6b6b; } .empty, .state { color: #888; text-align: center; padding: 28px; }
  .pulse { color: #51cf66; } .error, .form-error { color: #ff6b6b; }
  form { display: grid; grid-template-columns: repeat(6, minmax(90px, 1fr)); gap: 10px; align-items: end; }
  label, legend { color: #888; font-size: 11px; } input, select { display: block; box-sizing: border-box; width: 100%; margin-top: 5px; background: #0a0a0a; border: 1px solid #333; color: #e0e0e0; font: inherit; font-size: 12px; padding: 8px; }
  input:focus, select:focus { outline: 1px solid #888; } fieldset { border: 0; padding: 0; margin: 0; display: flex; gap: 9px; align-items: center; } fieldset label { color: #e0e0e0; }
  .radio { display: flex; align-items: center; gap: 4px; } .radio input { width: auto; margin: 0; }
  .submit { background: #e0e0e0; border: 1px solid #e0e0e0; color: #0a0a0a; padding: 8px; font-weight: bold; } .submit:disabled { cursor: wait; opacity: .55; }
  .form-error { font-size: 11px; margin-top: 10px; }
  @media (max-width: 780px) { .page-header { align-items: flex-start; flex-direction: column; gap: 8px; } form { grid-template-columns: repeat(2, 1fr); } fieldset { min-height: 35px; } .submit { grid-column: span 2; } }
</style>
