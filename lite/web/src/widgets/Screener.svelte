<script lang="ts">
  import { onMount } from "svelte";

  export interface ScreenerRow {
    symbol: string;
    name: string;
    price: number;
    changePercent: number;
    volume: number;
    marketCap: number;
    sector: string;
    exchange: string;
  }

  interface ScreenerFilters {
    sector?: string;
    marketCapMin?: number;
    volumeMin?: number;
    changePercentMin?: number;
  }

  type SortKey = keyof ScreenerRow;

  export let rows: ScreenerRow[] = [];

  let filteredRows: ScreenerRow[] = [];
  let loading = true;
  let error: string | null = null;
  let initialized = false;
  let requestId = 0;

  let sector = "all";
  let marketCapMin = "";
  let volumeMin = "";
  let changePercentMin = "";
  let sortKey: SortKey = "marketCap";
  let sortDirection: "asc" | "desc" = "desc";

  $: sectors = Array.from(new Set(allRows.map((row) => row.sector).filter(Boolean))).sort();
  $: filters = {
    sector: sector === "all" ? undefined : sector,
    marketCapMin: parseMinimum(marketCapMin),
    volumeMin: parseMinimum(volumeMin),
    changePercentMin: parseMinimum(changePercentMin),
  } satisfies ScreenerFilters;
  $: filterSignature = JSON.stringify(filters);
  $: inputRows = rows;

  // Reload when a control changes or the parent supplies a new row list.
  $: if (initialized && (filterSignature || inputRows)) {
    void loadRows(filters);
  }

  onMount(() => {
    initialized = true;
    void loadRows(filters);
  });

  function parseMinimum(value: string): number | undefined {
    const parsed = Number(value);
    return value.trim() !== "" && Number.isFinite(parsed) ? parsed : undefined;
  }

  // Wired to /api/market/screener. The backend has no server-side sector/cap/volume/change
  // filtering (only `limit`) — fetch the full screen once and filter client-side below.
  let allRows: ScreenerRow[] = [];
  let fetchedOnce = false;

  async function fetchScreener(filters: ScreenerFilters): Promise<ScreenerRow[]> {
    if (!fetchedOnce) {
      const response = await fetch(`/api/market/screener`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      allRows = data.rows || [];
      fetchedOnce = true;
    }

    return allRows.filter((row) => {
      return (
        (!filters.sector || row.sector === filters.sector) &&
        (filters.marketCapMin === undefined || row.marketCap >= filters.marketCapMin * 1_000_000_000) &&
        (filters.volumeMin === undefined || row.volume >= filters.volumeMin * 1_000_000) &&
        (filters.changePercentMin === undefined || row.changePercent >= filters.changePercentMin)
      );
    });
  }

  async function loadRows(nextFilters: ScreenerFilters): Promise<void> {
    const currentRequest = ++requestId;
    loading = true;
    error = null;

    try {
      const result = await fetchScreener(nextFilters);
      if (currentRequest === requestId) filteredRows = result;
    } catch (cause) {
      if (currentRequest === requestId) {
        error = cause instanceof Error ? cause.message : "Unable to load screener data";
        filteredRows = [];
      }
    } finally {
      if (currentRequest === requestId) loading = false;
    }
  }

  function sortBy(key: string): void {
    const typedKey = key as SortKey;
    if (sortKey === typedKey) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortKey = typedKey;
      sortDirection = "asc";
    }
  }

  function valueForSort(row: ScreenerRow, key: SortKey): string | number {
    return row[key];
  }

  $: sortedRows = [...filteredRows].sort((left, right) => {
    const leftValue = valueForSort(left, sortKey);
    const rightValue = valueForSort(right, sortKey);
    const comparison =
      typeof leftValue === "number" && typeof rightValue === "number"
        ? leftValue - rightValue
        : String(leftValue).localeCompare(String(rightValue));
    return sortDirection === "asc" ? comparison : -comparison;
  });

  function formatNumber(value: number, maximumFractionDigits = 2): string {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(value);
  }

  function formatMarketCap(value: number): string {
    return `$${formatNumber(value / 1_000_000_000)}B`;
  }

  function formatVolume(value: number): string {
    return `${formatNumber(value / 1_000_000, 1)}M`;
  }

  function sortIndicator(key: string): string {
    if (sortKey !== (key as SortKey)) return "";
    return sortDirection === "asc" ? " ↑" : " ↓";
  }
</script>

<section class="screener" aria-label="Stock market screener">
  <div class="heading">
    <div>
      <p class="eyebrow">MARKET SCREENER</p>
      <h2>Stocks</h2>
    </div>
    <span class="count">{sortedRows.length} results</span>
  </div>

  <div class="filters" aria-label="Screener filters">
    <label>
      <span>Sector</span>
      <select bind:value={sector}>
        <option value="all">All sectors</option>
        {#each sectors as sectorName}
          <option value={sectorName}>{sectorName}</option>
        {/each}
      </select>
    </label>
    <label>
      <span>Min market cap ($B)</span>
      <input bind:value={marketCapMin} type="number" min="0" step="0.1" placeholder="0" />
    </label>
    <label>
      <span>Min volume (M)</span>
      <input bind:value={volumeMin} type="number" min="0" step="0.1" placeholder="0" />
    </label>
    <label>
      <span>Min change (%)</span>
      <input bind:value={changePercentMin} type="number" step="0.1" placeholder="-" />
    </label>
  </div>

  {#if loading}
    <div class="state" role="status">Loading screener data...</div>
  {:else if error}
    <div class="state error" role="alert">Unable to load screener data: {error}</div>
  {:else if sortedRows.length === 0}
    <div class="state">No stocks match the selected filters.</div>
  {:else}
    <div class="table-wrap">
      <div class="table" role="table" aria-label="Stock screener results">
        <div class="table-row table-header" role="row">
          {#each [
            ["symbol", "Symbol"],
            ["name", "Name"],
            ["price", "Price"],
            ["changePercent", "% Change"],
            ["volume", "Volume"],
            ["marketCap", "Market Cap"],
            ["sector", "Sector"],
            ["exchange", "Exchange"],
          ] as [key, label]}
            <button class="header-cell" type="button" on:click={() => sortBy(key)} aria-label={`Sort by ${label}`}>
              {label}<span class="sort-indicator">{sortIndicator(key)}</span>
            </button>
          {/each}
        </div>
        {#each sortedRows as row (row.symbol)}
          <div class="table-row" role="row">
            <span class="cell symbol" role="cell">{row.symbol}</span>
            <span class="cell name" role="cell">{row.name}</span>
            <span class="cell value" role="cell">${formatNumber(row.price)}</span>
            <span class:positive={row.changePercent > 0} class:negative={row.changePercent < 0} class="cell value" role="cell">
              {row.changePercent > 0 ? "+" : ""}{formatNumber(row.changePercent)}%
            </span>
            <span class="cell value" role="cell">{formatVolume(row.volume)}</span>
            <span class="cell value" role="cell">{formatMarketCap(row.marketCap)}</span>
            <span class="cell" role="cell">{row.sector}</span>
            <span class="cell" role="cell">{row.exchange}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</section>

<style>
  .screener {
    --muted: #8b8b8b;
    --green: #51cf66;
    --red: #ff6b6b;
    width: 100%;
    box-sizing: border-box;
    padding: 1.25rem;
    background: #1a1a1a;
    border: 1px solid #333;
    color: #e0e0e0;
    font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  }

  .heading,
  .filters {
    display: flex;
    align-items: end;
    gap: 1rem;
  }

  .heading {
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .eyebrow {
    margin: 0 0 0.25rem;
    color: var(--muted);
    font: 0.7rem/1.2 "Courier New", monospace;
    letter-spacing: 0.12em;
  }

  h2 {
    margin: 0;
    font-size: 1.35rem;
    font-weight: 600;
  }

  .count {
    color: var(--muted);
    font: 0.8rem "Courier New", monospace;
  }

  .filters {
    flex-wrap: wrap;
    margin-bottom: 1rem;
    padding: 0.8rem;
    border: 1px solid #333;
    background: #161616;
  }

  label {
    display: grid;
    gap: 0.35rem;
    min-width: 9rem;
    color: var(--muted);
    font-size: 0.75rem;
  }

  input,
  select {
    box-sizing: border-box;
    min-height: 2rem;
    padding: 0.35rem 0.5rem;
    border: 1px solid #444;
    border-radius: 2px;
    outline: none;
    background: #202020;
    color: #e0e0e0;
    font: 0.82rem "Courier New", monospace;
  }

  input:focus,
  select:focus,
  .header-cell:focus-visible {
    border-color: #888;
    box-shadow: 0 0 0 1px #888;
  }

  .table-wrap {
    overflow-x: auto;
  }

  .table {
    min-width: 850px;
  }

  .table-row {
    display: grid;
    grid-template-columns: 0.85fr 1.8fr 0.9fr 0.9fr 1fr 1.1fr 1.2fr 0.8fr;
    align-items: center;
    border-bottom: 1px solid #333;
  }

  .table-row:last-child {
    border-bottom: 0;
  }

  .table-header {
    border-top: 1px solid #333;
    background: #202020;
  }

  .header-cell,
  .cell {
    min-width: 0;
    padding: 0.7rem 0.55rem;
    text-align: left;
  }

  .header-cell {
    border: 0;
    background: transparent;
    color: var(--muted);
    cursor: pointer;
    font: 0.7rem "Courier New", monospace;
    text-transform: uppercase;
  }

  .header-cell:hover {
    color: #e0e0e0;
  }

  .sort-indicator {
    color: #e0e0e0;
  }

  .cell {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.82rem;
  }

  .symbol,
  .value {
    font-family: "Courier New", monospace;
  }

  .symbol {
    color: #fff;
    font-weight: 700;
  }

  .name {
    color: #c5c5c5;
  }

  .positive {
    color: var(--green);
  }

  .negative {
    color: var(--red);
  }

  .state {
    padding: 2rem 1rem;
    border: 1px solid #333;
    color: var(--muted);
    text-align: center;
    font: 0.85rem "Courier New", monospace;
  }

  .error {
    color: var(--red);
  }

  @media (max-width: 700px) {
    .screener {
      padding: 0.8rem;
    }

    .filters {
      align-items: stretch;
      flex-direction: column;
    }

    label {
      width: 100%;
    }
  }
</style>
