<script lang="ts">
  import { onMount } from "svelte";

  type Quote = {
    price: number;
    changePercent: number;
    volume: number;
  };

  type FetchQuote = (symbol: string) => Promise<Quote>;

  const STORAGE_KEY = "openterminal-watchlist";

  // Wired to /api/market/quote; exportable for testing
  export let fetchQuote: FetchQuote = async (symbol: string) => {
    const response = await fetch(`/api/market/quote?symbol=${encodeURIComponent(symbol)}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return {
      price: data.price ?? 0,
      changePercent: data.changePercent ?? 0,
      volume: data.volume ?? 0
    };
  };

  let symbols: string[] = [];
  let quotes: Record<string, Quote> = {};
  let flashing: Record<string, boolean> = {};
  let symbolInput = "";
  let loading: Record<string, boolean> = {};
  let flashTimers: Record<string, ReturnType<typeof setTimeout>> = {};

  onMount(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          symbols = parsed.filter((symbol): symbol is string => typeof symbol === "string");
          void refreshAll();
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  });

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(symbols));
    } catch (err) {
      // Storage quota exceeded or unavailable; silently degrade to in-memory only
      if (err instanceof Error && err.name === "QuotaExceededError") {
        console.warn("localStorage quota exceeded; watchlist will not persist");
      }
    }
  }

  function addSymbol() {
    const symbol = symbolInput.trim().toUpperCase();
    if (!symbol || symbols.includes(symbol)) return;

    symbols = [...symbols, symbol];
    symbolInput = "";
    persist();
    void refreshQuote(symbol);
  }

  function removeSymbol(symbol: string) {
    symbols = symbols.filter((item) => item !== symbol);
    const { [symbol]: _quote, ...remainingQuotes } = quotes;
    const { [symbol]: _loading, ...remainingLoading } = loading;
    quotes = remainingQuotes;
    loading = remainingLoading;
    persist();
  }

  function clearWatchlist() {
    symbols = [];
    quotes = {};
    loading = {};
    persist();
  }

  async function refreshQuote(symbol: string) {
    loading = { ...loading, [symbol]: true };

    try {
      const quote = await fetchQuote(symbol);
      const previous = quotes[symbol];
      quotes = { ...quotes, [symbol]: quote };

      if (previous && (previous.price !== quote.price || previous.changePercent !== quote.changePercent)) {
        flashing = { ...flashing, [symbol]: true };
        clearTimeout(flashTimers[symbol]);
        flashTimers[symbol] = setTimeout(() => {
          flashing = { ...flashing, [symbol]: false };
        }, 700);
      }
    } finally {
      loading = { ...loading, [symbol]: false };
    }
  }

  async function refreshAll() {
    await Promise.all(symbols.map((symbol) => refreshQuote(symbol)));
  }

  function formatNumber(value: number) {
    return new Intl.NumberFormat("en-US").format(value);
  }

  function formatPrice(value: number) {
    return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
</script>

<section class="watchlist" aria-labelledby="watchlist-title">
  <header>
    <h2 id="watchlist-title">Watchlist</h2>
    <button class="clear-button" type="button" on:click={clearWatchlist} disabled={symbols.length === 0}>
      Clear
    </button>
  </header>

  <form class="add-form" on:submit|preventDefault={addSymbol}>
    <label for="watchlist-symbol">Symbol</label>
    <input id="watchlist-symbol" bind:value={symbolInput} placeholder="AAPL" autocomplete="off" />
    <button type="submit" disabled={!symbolInput.trim()}>Add</button>
  </form>

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th scope="col">Symbol</th>
          <th scope="col">Price</th>
          <th scope="col">Change%</th>
          <th scope="col">Volume</th>
          <th scope="col"><span class="sr-only">Actions</span></th>
        </tr>
      </thead>
      <tbody>
        {#each symbols as symbol}
          {@const quote = quotes[symbol]}
          <tr class:flash={flashing[symbol]}>
            <th scope="row">{symbol}</th>
            <td>{quote ? formatPrice(quote.price) : loading[symbol] ? "Loading..." : "-"}</td>
            <td class:positive={quote && quote.changePercent > 0} class:negative={quote && quote.changePercent < 0}>
              {quote ? `${quote.changePercent.toFixed(2)}%` : "-"}
            </td>
            <td>{quote ? formatNumber(quote.volume) : "-"}</td>
            <td>
              <button class="delete-button" type="button" on:click={() => removeSymbol(symbol)} aria-label={`Delete ${symbol}`}>
                Delete
              </button>
            </td>
          </tr>
        {:else}
          <tr>
            <td class="empty" colspan="5">Add a symbol to start watching.</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</section>

<style>
  .watchlist { background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 1.25rem; }
  header, .add-form { align-items: center; display: flex; gap: 0.75rem; }
  header { justify-content: space-between; margin-bottom: 1rem; }
  h2 { font-size: 1.25rem; margin: 0; }
  label, th, .empty { color: #888; }
  label { font-size: 0.8rem; }
  input { background: #111; border: 1px solid #444; border-radius: 4px; color: #e0e0e0; min-width: 0; padding: 0.55rem 0.7rem; width: 8rem; }
  button { background: #303030; border: 1px solid #555; border-radius: 4px; color: #e0e0e0; cursor: pointer; padding: 0.55rem 0.8rem; }
  button:hover:not(:disabled) { background: #414141; }
  button:disabled { cursor: not-allowed; opacity: 0.45; }
  .clear-button, .delete-button { color: #aaa; font-size: 0.8rem; }
  .table-wrap { margin-top: 1.25rem; overflow-x: auto; }
  table { border-collapse: collapse; min-width: 560px; text-align: right; width: 100%; }
  th, td { border-bottom: 1px solid #333; padding: 0.8rem 0.6rem; white-space: nowrap; }
  th:first-child, td:first-child { text-align: left; }
  thead th { font-size: 0.75rem; font-weight: 500; text-transform: uppercase; }
  tbody th { color: #e0e0e0; font-family: monospace; font-weight: 600; }
  .positive { color: #63d297; }
  .negative { color: #ff7777; }
  .flash { animation: quote-flash 700ms ease-out; }
  .empty { padding: 2rem; text-align: center; }
  .sr-only { height: 1px; margin: -1px; overflow: hidden; position: absolute; width: 1px; clip: rect(0, 0, 0, 0); }

  @keyframes quote-flash { 0% { background: #514b22; } 100% { background: transparent; } }

  @media (max-width: 600px) {
    .add-form { align-items: flex-start; flex-wrap: wrap; }
    .add-form label { flex-basis: 100%; }
    input { flex: 1; }
  }
</style>
