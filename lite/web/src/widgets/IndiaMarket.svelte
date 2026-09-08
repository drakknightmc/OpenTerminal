<script lang="ts">
  import { onMount } from "svelte";

  export type IndiaIndex = {
    name: string;
    value: number;
    change: number;
    changePercent: number;
  };

  export type IndiaQuote = {
    symbol: string;
    price: number | null;
    change: number | null;
    changePercent: number | null;
    open: number | null;
    high: number | null;
    low: number | null;
    previousClose: number | null;
    volume: number | null;
    currency: "INR";
    exchange: "NSE" | "BSE";
    marketState: string | null;
    time: number | null;
    source: string;
  };

  export let symbol = "RELIANCE";

  let indices: IndiaIndex[] = [];
  let quote: IndiaQuote | null = null;
  let searchSymbol = symbol;
  let loading = true;
  let error: string | null = null;

  // TODO: Replace this development fixture with /api/india/indices.
  async function fetchIndices(): Promise<IndiaIndex[]> {
    return [
      { name: "NIFTY 50", value: 24_812.35, change: 142.25, changePercent: 0.58 },
      { name: "SENSEX", value: 81_455.4, change: 489.8, changePercent: 0.6 },
    ];
  }

  // TODO: Replace this development fixture with /api/india/quote/SYMBOL.
  async function fetchIndiaQuote(symbolName: string): Promise<IndiaQuote> {
    return {
      symbol: symbolName,
      price: 1_425.6,
      change: 18.35,
      changePercent: 1.3,
      open: 1_411.25,
      high: 1_438.9,
      low: 1_405.1,
      previousClose: 1_407.25,
      volume: 8_452_190,
      currency: "INR",
      exchange: "NSE",
      marketState: "REGULAR",
      time: Date.now(),
      source: "development fixture",
    };
  }

  async function loadMarket(nextSymbol: string): Promise<void> {
    loading = true;
    error = null;

    try {
      const [nextIndices, nextQuote] = await Promise.all([
        fetchIndices(),
        fetchIndiaQuote(nextSymbol),
      ]);
      indices = nextIndices;
      quote = nextQuote;
      symbol = nextSymbol;
    } catch (e) {
      error = e instanceof Error ? e.message : "Unable to load Indian market data";
    } finally {
      loading = false;
    }
  }

  function submitSearch(): void {
    const nextSymbol = searchSymbol.trim().toUpperCase();
    if (nextSymbol && nextSymbol !== symbol) loadMarket(nextSymbol);
  }

  function formatNumber(value: number | null, maximumFractionDigits = 2): string {
    return value === null
      ? "--"
      : value.toLocaleString("en-IN", { maximumFractionDigits });
  }

  function changeClass(value: number | null): string {
    return value !== null && value >= 0 ? "positive" : "negative";
  }

  onMount(() => loadMarket(symbol.toUpperCase()));
</script>

<section class="market-widget" aria-label="Indian equities market">
  <header class="widget-header">
    <div>
      <p class="eyebrow">INDIA / EQUITIES</p>
      <h2>Indian Market</h2>
    </div>
    <span class="currency">₹ INR</span>
  </header>

  <div class="indices" aria-label="Market indices">
    {#each indices as index}
      <article class="index-card">
        <span class="label">{index.name}</span>
        <strong class="value">{formatNumber(index.value)}</strong>
        <span class={changeClass(index.change)}>
          {index.change >= 0 ? "+" : ""}{formatNumber(index.change)}
          ({index.changePercent >= 0 ? "+" : ""}{formatNumber(index.changePercent)}%)
        </span>
      </article>
    {/each}
  </div>

  <div class="panel quote-panel">
    {#if loading}
      <p class="loading">Loading market data...</p>
    {:else if error}
      <p class="error">Error: {error}</p>
    {:else if quote}
      <div class="quote-heading">
        <div>
          <span class="label">{quote.exchange} / {quote.symbol}</span>
          <strong class="price">₹{formatNumber(quote.price)}</strong>
        </div>
        <div class="quote-change">
          <span class={changeClass(quote.changePercent)}>
            {quote.changePercent !== null && quote.changePercent >= 0 ? "+" : ""}{formatNumber(quote.changePercent)}%
          </span>
          <span class="label">{quote.marketState ?? "UNKNOWN"}</span>
        </div>
      </div>

      <div class="ohlc-grid">
        <div><span class="label">Open</span><span class="value">₹{formatNumber(quote.open)}</span></div>
        <div><span class="label">High</span><span class="value">₹{formatNumber(quote.high)}</span></div>
        <div><span class="label">Low</span><span class="value">₹{formatNumber(quote.low)}</span></div>
        <div><span class="label">Volume</span><span class="value">{formatNumber(quote.volume, 0)}</span></div>
      </div>
    {/if}
  </div>

  <form class="search" on:submit|preventDefault={submitSearch}>
    <label class="label" for="india-symbol">Symbol</label>
    <div class="search-row">
      <input id="india-symbol" bind:value={searchSymbol} placeholder="RELIANCE" aria-label="Indian equity symbol" />
      <button type="submit">Load</button>
    </div>
  </form>
</section>

<style>
  :global(body) { background: #0a0a0a; color: #e0e0e0; }
  .market-widget { max-width: 720px; margin: 0 auto; font-family: system-ui, sans-serif; }
  .widget-header, .quote-heading, .search-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
  .widget-header { margin-bottom: 1rem; }
  .eyebrow, .label { color: #888; font-size: 0.75rem; letter-spacing: 0.08em; }
  .eyebrow { margin: 0 0 0.25rem; }
  h2 { margin: 0; font-size: 1.35rem; }
  .currency { color: #51cf66; font: 0.85rem "Courier New", monospace; }
  .indices { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; margin-bottom: 0.75rem; }
  .panel, .index-card { background: #1a1a1a; border: 1px solid #333; border-radius: 8px; }
  .index-card { padding: 1rem; display: grid; gap: 0.4rem; }
  .value, .price, .positive, .negative { font-family: "Courier New", monospace; }
  .value { color: #e0e0e0; }
  .positive { color: #51cf66; }
  .negative { color: #ff6b6b; }
  .quote-panel { padding: 1.25rem; min-height: 150px; }
  .price { display: block; font-size: 1.8rem; margin-top: 0.35rem; }
  .quote-change { display: grid; gap: 0.4rem; text-align: right; }
  .ohlc-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; border-top: 1px solid #333; margin-top: 1.25rem; padding-top: 1rem; }
  .ohlc-grid div { display: grid; gap: 0.35rem; }
  .search { margin-top: 1rem; }
  .search-row { margin-top: 0.4rem; }
  input, button { border: 1px solid #333; border-radius: 6px; background: #1a1a1a; color: #e0e0e0; font: 0.95rem "Courier New", monospace; padding: 0.7rem 0.8rem; }
  input { min-width: 0; flex: 1; text-transform: uppercase; }
  button { cursor: pointer; color: #51cf66; }
  button:hover { border-color: #51cf66; }
  .loading { color: #888; }
  .error { color: #ff6b6b; }
  @media (max-width: 520px) { .indices, .ohlc-grid { grid-template-columns: repeat(2, 1fr); } }
</style>
