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

  /**
   * Fetch the options chain data.
   * TODO(integration): wire to real /api/market/options route
   */
  async function fetchOptionsChain(sym: string): Promise<OptionsChain> {
    // Stub implementation — will be wired to real API
    console.log("TODO: fetch from /api/market/options/" + sym);
    await new Promise((resolve) => setTimeout(resolve, 500));
    throw new Error("TODO(integration): not yet connected to /api/market/options");
  }

  /**
   * Fetch current stock price for ITM highlighting.
   * TODO(integration): wire to real /api/market/quote route
   */
  async function fetchCurrentPrice(sym: string): Promise<number | null> {
    // Stub implementation — will be wired to real API
    console.log("TODO: fetch quote from /api/market/quote/" + sym);
    await new Promise((resolve) => setTimeout(resolve, 500));
    return null;
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

  $: {
    // Build strike → row map
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
  }

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
    color: #e0e0e0;
    font-family: "Courier New", monospace;
  }

  .loading {
    color: #888;
    padding: 1rem;
    text-align: center;
  }

  .error-box {
    background: #1a1a1a;
    border: 1px solid #333;
    border-radius: 4px;
    padding: 1.5rem;
    margin-bottom: 1rem;
  }

  .error-title {
    color: #ff6b6b;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .error-detail {
    color: #888;
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
    color: #888;
    font-weight: 500;
    font-size: 0.9rem;
  }

  .value {
    color: #ffc107;
    font-weight: 600;
  }

  .expiry-select {
    background: #1a1a1a;
    color: #e0e0e0;
    border: 1px solid #333;
    padding: 0.4rem 0.6rem;
    border-radius: 4px;
    font-family: "Courier New", monospace;
    font-size: 0.9rem;
    cursor: pointer;
  }

  .expiry-select:hover {
    border-color: #555;
  }

  .options-table {
    width: 100%;
    border-collapse: collapse;
    background: #0a0a0a;
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
    background: #1a1a1a;
    color: #aaa;
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
    color: #51cf66;
  }

  .puts-header {
    color: #ff6b6b;
  }

  .strike-header {
    color: #ffc107;
    text-align: center;
  }

  .col-header-row th {
    padding: 0.5rem 0.8rem;
    font-size: 0.75rem;
    color: #666;
  }

  .options-table tbody tr:hover {
    background: #151515;
  }

  .options-table tbody td {
    color: #e0e0e0;
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
    color: #ffc107;
    background: #111 !important;
    border-left: 1px solid #333 !important;
    border-right: 1px solid #333 !important;
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
