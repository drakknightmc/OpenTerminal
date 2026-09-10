<script lang="ts">
  import { onMount } from "svelte";

  interface OptionRow {
    strike: number | null;
    lastPrice: number | null;
    bid: number | null;
    ask: number | null;
    volume: number | null;
    openInterest: number | null;
    inTheMoney: boolean;
  }

  interface OptionsChain {
    symbol: string;
    underlyingPrice: number | null;
    expirationDates: string[];
    selectedDate: string | null;
    calls: OptionRow[];
    puts: OptionRow[];
  }

  export let symbol: string = "AAPL";

  let data: OptionsChain | null = null;
  let error: string | null = null;
  let loading = true;
  let selectedExpiry: string | null = null;

  // Wired to /api/market/options
  async function fetchOptionsChain(sym: string): Promise<OptionsChain> {
    const response = await fetch(`/api/market/options?symbol=${encodeURIComponent(sym)}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  // Wired to /api/market/quote
  async function fetchCurrentPrice(sym: string): Promise<number | null> {
    const response = await fetch(`/api/market/quote?symbol=${encodeURIComponent(sym)}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.price ?? null;
  }

  onMount(async () => {
    try {
      const chain = await fetchOptionsChain(symbol);
      data = chain;
      selectedExpiry = chain.selectedDate ?? (chain.expirationDates[0] ?? null);
    } catch (e) {
      error = e instanceof Error ? e.message : "Unknown error";
    } finally {
      loading = false;
    }
  });

  function fmt(value: number | null): string {
    if (value === null || value === undefined) return "—";
    if (Math.abs(value) < 1) return value.toFixed(2);
    return value.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  }

  function fmtBig(value: number | null): string {
    if (value === null || value === undefined) return "—";
    if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + "M";
    if (value >= 1_000) return (value / 1_000).toFixed(1) + "K";
    return value.toFixed(0);
  }

  // Group options by expiry and build strike map
  $: currentExpiry = selectedExpiry ?? data?.selectedDate ?? data?.expirationDates?.[0] ?? null;
  $: callsForExpiry = data?.calls ?? [];
  $: putsForExpiry = data?.puts ?? [];

  function getStrikePairs(): Array<{ strike: number; call?: OptionRow; put?: OptionRow }> {
    const byStrike = new Map<number, { call?: OptionRow; put?: OptionRow }>();
    for (const c of callsForExpiry) {
      if (c.strike !== null) {
        byStrike.set(c.strike, { ...byStrike.get(c.strike), call: c });
      }
    }
    for (const p of putsForExpiry) {
      if (p.strike !== null) {
        byStrike.set(p.strike, { ...byStrike.get(p.strike), put: p });
      }
    }
    const strikes = [...byStrike.keys()].sort((a, b) => a - b);
    return strikes.map((strike) => ({
      strike,
      ...byStrike.get(strike)!,
    }));
  }
</script>

<div class="options-widget">
  {#if loading}
    <div class="loading">Loading option chain…</div>
  {:else if error}
    <div class="error-box">
      <div class="error-title">Option chain unavailable for {symbol}</div>
      <div class="error-detail">{error}</div>
    </div>
  {:else if data}
    <div class="header">
      <div class="header-row">
        <span class="label">Underlying</span>
        <span class="value">{fmt(data.underlyingPrice)}</span>
        <span class="label" style="margin-left: 2rem;">Expiry</span>
        <select bind:value={selectedExpiry} class="expiry-select">
          {#each data.expirationDates as date (date)}
            <option value={date}>{date}</option>
          {/each}
        </select>
      </div>
    </div>

    <table class="options-table">
      <thead>
        <tr class="header-row-main">
          <th colSpan="5" class="section-header calls-header">CALLS</th>
          <th class="strike-header">STRIKE</th>
          <th colSpan="5" class="section-header puts-header">PUTS</th>
        </tr>
        <tr class="col-header-row">
          <th>Bid</th>
          <th>Ask</th>
          <th>Vol</th>
          <th>OI</th>
          <th>Last</th>
          <th></th>
          <th>Last</th>
          <th>Bid</th>
          <th>Ask</th>
          <th>Vol</th>
          <th>OI</th>
        </tr>
      </thead>
      <tbody>
        {#each getStrikePairs() as row (row.strike)}
          <tr>
            <td class:itm={row.call?.inTheMoney}>{fmt(row.call?.bid)}</td>
            <td class:itm={row.call?.inTheMoney}>{fmt(row.call?.ask)}</td>
            <td class:itm={row.call?.inTheMoney}>{fmtBig(row.call?.volume)}</td>
            <td class:itm={row.call?.inTheMoney}>{fmtBig(row.call?.openInterest)}</td>
            <td class:itm={row.call?.inTheMoney}>{fmt(row.call?.lastPrice)}</td>
            <td class="strike-cell">{fmt(row.strike)}</td>
            <td class:itm-put={row.put?.inTheMoney}>{fmt(row.put?.lastPrice)}</td>
            <td class:itm-put={row.put?.inTheMoney}>{fmt(row.put?.bid)}</td>
            <td class:itm-put={row.put?.inTheMoney}>{fmt(row.put?.ask)}</td>
            <td class:itm-put={row.put?.inTheMoney}>{fmtBig(row.put?.volume)}</td>
            <td class:itm-put={row.put?.inTheMoney}>{fmtBig(row.put?.openInterest)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <div class="loading">No data</div>
  {/if}
</div>

<style>
  .options-widget {
    padding: 1rem;
    color: var(--color-text);
    font-family: "Courier New", monospace;
  }

  .loading {
    color: var(--color-text-muted);
    padding: 1rem;
    text-align: center;
  }

  .error-box {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    padding: 1.5rem;
    margin-bottom: 1rem;
  }

  .error-title {
    color: var(--color-loss);
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .error-detail {
    color: var(--color-text-muted);
    font-size: 0.9rem;
  }

  .header {
    margin-bottom: 1rem;
    padding: 0.5rem 0;
  }

  .header-row {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .label {
    color: var(--color-text-muted);
    font-weight: 500;
    font-size: 0.9rem;
  }

  .value {
    color: var(--color-accent);
    font-weight: 600;
  }

  .expiry-select {
    background: var(--color-surface);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    padding: 0.4rem 0.6rem;
    border-radius: 4px;
    font-family: "Courier New", monospace;
    font-size: 0.9rem;
    cursor: pointer;
  }

  .expiry-select:hover {
    border-color: var(--color-text-faint);
  }

  .options-table {
    width: 100%;
    border-collapse: collapse;
    background: var(--color-bg);
    margin-top: 0.5rem;
  }

  .options-table th,
  .options-table td {
    padding: 0.6rem 0.8rem;
    text-align: right;
    border: 1px solid #222;
    font-size: 0.85rem;
  }

  .options-table th {
    background: var(--color-surface);
    color: var(--color-text-dim);
    font-weight: 600;
    padding: 0.75rem 0.8rem;
  }

  .header-row-main th {
    padding: 0.5rem 0.8rem;
    font-size: 0.8rem;
  }

  .section-header {
    text-align: center;
    font-weight: 700;
    padding: 0.75rem 0 !important;
  }

  .calls-header {
    color: var(--color-gain);
  }

  .puts-header {
    color: var(--color-loss);
  }

  .strike-header {
    color: var(--color-accent);
    text-align: center;
  }

  .col-header-row th {
    padding: 0.5rem 0.8rem;
    font-size: 0.75rem;
    color: var(--color-text-faint);
  }

  .options-table tbody tr:hover {
    background: #151515;
  }

  .options-table tbody td {
    color: var(--color-text);
  }

  td:last-child {
    border-right: none;
  }

  td:first-child {
    border-left: none;
  }

  .strike-cell {
    text-align: center;
    font-weight: 600;
    color: var(--color-accent);
    background: #111 !important;
    border-left: 1px solid var(--color-border) !important;
    border-right: 1px solid var(--color-border) !important;
  }

  /* ITM highlighting for calls (green) */
  td.itm {
    background: #0d2010;
    color: #5fe96b;
  }

  /* ITM highlighting for puts (red) */
  td.itm-put {
    background: #200d0d;
    color: #ff9999;
  }
</style>
