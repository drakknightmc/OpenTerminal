<script context="module" lang="ts">
  export interface Quote {
    symbol: string;
    price: number;
    changePercent: number;
    open: number;
    high: number;
    low: number;
    bid: number;
    ask: number;
    volume: number;
    marketCap: number;
    pe: number | null;
    eps: number | null;
    yield: number | null;
    week52Low: number;
    week52High: number;
    beta: number | null;
    sharesOutstanding: number | null;
  }

  // Wired to /api/market/quote
  export async function fetchQuote(symbol: string): Promise<Quote> {
    const response = await fetch(`/api/market/quote?symbol=${encodeURIComponent(symbol)}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }
</script>

<script lang="ts">
  import { onDestroy } from "svelte";

  export let symbol: string;

  let quote: Quote | null = null;
  let error = "";
  let loading = true;
  let activeSymbol = "";
  let flashing = new Set<string>();
  let refreshTimer: ReturnType<typeof setInterval> | undefined;
  let flashTimers: ReturnType<typeof setTimeout>[] = [];

  function fieldValue(q: Quote, key: keyof Quote): number | null {
    const value = q[key];
    return typeof value === "number" ? value : null;
  }

  const fields: { key: keyof Quote; label: string; format: (value: number | null) => string }[] = [
    { key: "open", label: "Open", format: formatPrice },
    { key: "high", label: "High", format: formatPrice },
    { key: "low", label: "Low", format: formatPrice },
    { key: "bid", label: "Bid", format: formatPrice },
    { key: "ask", label: "Ask", format: formatPrice },
    { key: "volume", label: "Volume", format: formatCompact },
    { key: "marketCap", label: "Market cap", format: formatCompact },
    { key: "pe", label: "P/E", format: formatRatio },
    { key: "eps", label: "EPS", format: formatPrice },
    { key: "yield", label: "Yield", format: formatPercent },
    { key: "week52Low", label: "52w low", format: formatPrice },
    { key: "week52High", label: "52w high", format: formatPrice },
    { key: "beta", label: "Beta", format: formatRatio },
    { key: "sharesOutstanding", label: "Shares out", format: formatCompact }
  ];

  $: if (symbol && symbol !== activeSymbol) {
    activeSymbol = symbol;
    void loadQuote(symbol);
  }

  async function loadQuote(nextSymbol: string) {
    loading = !quote;
    error = "";

    try {
      const nextQuote = await fetchQuote(nextSymbol);
      const changed = quote
        ? fields.filter(({ key }) => quote?.[key] !== nextQuote[key]).map(({ key }) => key)
        : [];
      quote = nextQuote;
      triggerFlash(changed);
    } catch (reason) {
      error = reason instanceof Error ? reason.message : "Unable to load quote";
    } finally {
      loading = false;
    }

    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(() => void loadQuote(activeSymbol), 30_000);
  }

  function triggerFlash(keys: string[]) {
    if (!keys.length) return;
    flashing = new Set(keys);
    flashTimers.forEach(clearTimeout);
    flashTimers = [setTimeout(() => (flashing = new Set()), 650)];
  }

  function formatPrice(value: number | null) {
    return value == null ? "--" : `$${value.toFixed(2)}`;
  }

  function formatPercent(value: number | null) {
    return value == null ? "--" : `${value.toFixed(2)}%`;
  }

  function formatRatio(value: number | null) {
    return value == null ? "--" : value.toFixed(2);
  }

  function formatCompact(value: number | null) {
    if (value == null) return "--";
    return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(value);
  }

  onDestroy(() => {
    if (refreshTimer) clearInterval(refreshTimer);
    flashTimers.forEach(clearTimeout);
  });
</script>

<section class="quote" aria-label={`${symbol} quote`}>
  {#if loading && !quote}
    <div class="message">Loading quote...</div>
  {:else if error && !quote}
    <div class="message error">{error}</div>
  {:else if quote}
    <header class="summary">
      <div>
        <p class="symbol">{quote.symbol}</p>
        <p class:flash={flashing.has("price")} class="price">{formatPrice(quote.price)}</p>
      </div>
      <p class:negative={quote.changePercent < 0} class:flash={flashing.has("changePercent")} class="change">
        {quote.changePercent >= 0 ? "+" : ""}{quote.changePercent.toFixed(2)}%
      </p>
    </header>

    <div class="details">
      {#each fields as field}
        <div class:flash={flashing.has(field.key)} class="metric">
          <span class="label">{field.label}</span>
          <strong>{field.format(fieldValue(quote, field.key))}</strong>
        </div>
      {/each}
    </div>
  {/if}
</section>

<style>
  .quote {
    box-sizing: border-box;
    width: 100%;
    max-width: 560px;
    padding: 1.25rem;
    border: 1px solid #303030;
    border-radius: 10px;
    background: var(--color-surface);
    color: var(--color-text);
    font-family: system-ui, sans-serif;
  }

  .summary {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1rem;
    padding-bottom: 1.25rem;
    border-bottom: 1px solid #303030;
  }

  .symbol,
  .price,
  .change {
    margin: 0;
  }

  .symbol {
    color: var(--color-text-muted);
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.12em;
  }

  .price {
    margin-top: 0.25rem;
    font-size: clamp(2rem, 7vw, 3rem);
    font-weight: 800;
    letter-spacing: -0.04em;
  }

  .change {
    padding-bottom: 0.35rem;
    color: #55c878;
    font-size: 1.25rem;
    font-weight: 800;
  }

  .change.negative {
    color: #f06b6b;
  }

  .details {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem 1rem;
    padding-top: 1.25rem;
  }

  .metric {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
    min-width: 0;
    padding: 0.25rem 0;
    border-radius: 4px;
    transition: background-color 150ms ease;
  }

  .label {
    overflow: hidden;
    color: var(--color-text-muted);
    font-size: 0.78rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .metric strong {
    color: var(--color-text);
    font-size: 0.9rem;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .flash {
    animation: value-flash 650ms ease-out;
  }

  .message {
    padding: 2rem 1rem;
    color: var(--color-text-muted);
    text-align: center;
  }

  .error {
    color: #f06b6b;
  }

  @keyframes value-flash {
    0% { background-color: #5c5124; }
    100% { background-color: transparent; }
  }

  @media (max-width: 380px) {
    .quote { padding: 1rem; }
    .details { gap: 0.5rem; }
    .metric { display: block; }
    .metric strong { display: block; margin-top: 0.15rem; }
  }
</style>
