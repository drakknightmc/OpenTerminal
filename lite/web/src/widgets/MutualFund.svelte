<script lang="ts">
  import { onDestroy } from "svelte";

  export type SchemeResult = {
    schemeCode: number;
    schemeName: string;
  };

  export type NavEntry = {
    date: string;
    nav: number;
  };

  type FundMetadata = {
    fundHouse?: string;
    category?: string;
  };

  // Wired to /api/mf/search
  async function fetchSearchSchemes(query: string): Promise<SchemeResult[]> {
    const response = await fetch(`/api/mf/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.results || [];
  }

  // Wired to /api/mf/nav/:schemeCode
  async function fetchNavHistory(schemeCode: number): Promise<{ history: NavEntry[] } & FundMetadata> {
    const response = await fetch(`/api/mf/nav/${schemeCode}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return { history: data.history || [], fundHouse: data.fundHouse, category: data.category };
  }

  let query = "";
  let matches: SchemeResult[] = [];
  let selected: SchemeResult | null = null;
  let history: NavEntry[] = [];
  let metadata: FundMetadata = {};
  let searching = false;
  let loadingHistory = false;
  let error: string | null = null;
  let searchTimer: ReturnType<typeof setTimeout> | undefined;

  $: latest = history.length > 0 ? history[history.length - 1] : null;
  $: chart = makeChart(history);

  function handleInput(event: Event) {
    query = (event.currentTarget as HTMLInputElement).value;
    selected = null;
    history = [];
    metadata = {};
    error = null;
    matches = [];

    if (searchTimer) clearTimeout(searchTimer);
    if (!query.trim()) return;

    searching = true;
    searchTimer = setTimeout(async () => {
      try {
        matches = await fetchSearchSchemes(query.trim());
      } catch (reason) {
        error = reason instanceof Error ? reason.message : "Unable to search schemes";
      } finally {
        searching = false;
      }
    }, 300);
  }

  async function selectScheme(scheme: SchemeResult) {
    selected = scheme;
    query = scheme.schemeName;
    matches = [];
    error = null;
    loadingHistory = true;
    history = [];

    try {
      const result = await fetchNavHistory(scheme.schemeCode);
      history = result.history.sort((left, right) =>
        dateKey(left.date).localeCompare(dateKey(right.date)),
      );
      metadata = { fundHouse: result.fundHouse, category: result.category };
    } catch (reason) {
      error = reason instanceof Error ? reason.message : "Unable to load NAV history";
    } finally {
      loadingHistory = false;
    }
  }

  function dateKey(date: string): string {
    const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(date);
    return match ? `${match[3]}-${match[2]}-${match[1]}` : date;
  }

  function makeChart(entries: NavEntry[]) {
    const width = 640;
    const height = 260;
    const padding = { top: 20, right: 20, bottom: 38, left: 58 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    if (!entries.length) {
      return { width, height, padding, points: "", min: 0, max: 0 };
    }

    const values = entries.map((entry) => entry.nav);
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const range = rawMax - rawMin || Math.max(rawMax * 0.02, 1);
    const min = rawMin - range * 0.08;
    const max = rawMax + range * 0.08;
    const points = entries
      .map((entry, index) => {
        const x = padding.left + (entries.length === 1 ? plotWidth / 2 : (index / (entries.length - 1)) * plotWidth);
        const y = padding.top + ((max - entry.nav) / (max - min)) * plotHeight;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");

    return { width, height, padding, points, min, max };
  }

  onDestroy(() => {
    if (searchTimer) clearTimeout(searchTimer);
  });
</script>

<section class="widget" aria-labelledby="mutual-fund-title">
  <div class="widget-header">
    <div>
      <p class="eyebrow">MARKET DATA / INDIA</p>
      <h2 id="mutual-fund-title">Mutual fund</h2>
    </div>
    <span class="currency">₹ INR</span>
  </div>

  <div class="search-wrap">
    <label for="scheme-search">Search schemes</label>
    <input
      id="scheme-search"
      type="search"
      value={query}
      on:input={handleInput}
      placeholder="Type a fund name or scheme code"
      autocomplete="off"
    />
    {#if searching}
      <span class="search-status">searching...</span>
    {/if}
    {#if matches.length > 0}
      <div class="results" role="listbox" aria-label="Mutual fund schemes">
        {#each matches as scheme}
          <button type="button" on:click={() => selectScheme(scheme)}>
            <span>{scheme.schemeName}</span>
            <small>#{scheme.schemeCode}</small>
          </button>
        {/each}
      </div>
    {/if}
  </div>

  {#if error}
    <p class="error">Error: {error}</p>
  {:else if selected}
    <div class="fund-summary">
      <div>
        <p class="label">Selected scheme</p>
        <h3>{selected.schemeName}</h3>
      </div>
      <div class="details">
        <div><span class="label">Fund house</span><strong>{metadata.fundHouse ?? "—"}</strong></div>
        <div><span class="label">Category</span><strong>{metadata.category ?? "—"}</strong></div>
        <div><span class="label">Latest NAV</span><strong>{latest ? `₹${latest.nav.toFixed(4)}` : "—"}</strong></div>
        <div><span class="label">As of</span><strong>{latest?.date ?? "—"}</strong></div>
      </div>
    </div>

    <div class="chart-panel">
      <div class="chart-heading">
        <span>NAV history</span>
        {#if loadingHistory}<span class="search-status">loading...</span>{/if}
      </div>
      {#if chart.points}
        <svg viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" aria-label="NAV history line chart">
          <line class="axis" x1={chart.padding.left} y1={chart.padding.top} x2={chart.padding.left} y2={chart.height - chart.padding.bottom} />
          <line class="axis" x1={chart.padding.left} y1={chart.height - chart.padding.bottom} x2={chart.width - chart.padding.right} y2={chart.height - chart.padding.bottom} />
          <polyline class="line" points={chart.points} />
          <text x="8" y={chart.padding.top + 5}>₹{chart.max.toFixed(2)}</text>
          <text x="8" y={chart.height - chart.padding.bottom}>{`₹${chart.min.toFixed(2)}`}</text>
          <text x={chart.padding.left} y={chart.height - 8}>{history[0]?.date}</text>
          <text text-anchor="end" x={chart.width - chart.padding.right} y={chart.height - 8}>{history[history.length - 1]?.date}</text>
        </svg>
      {:else if !loadingHistory}
        <p class="empty">No NAV history available.</p>
      {/if}
    </div>
  {:else}
    <p class="empty">Search for an Indian mutual fund scheme to inspect its NAV.</p>
  {/if}
</section>

<style>
  :global(body) { background: var(--color-bg); color: var(--color-text); }
  .widget { max-width: 760px; padding: 1.25rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 8px; font-family: "Courier New", monospace; }
  .widget-header, .chart-heading { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
  .eyebrow, .label, .search-status { color: var(--color-text-muted); font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; }
  .eyebrow { margin: 0 0 0.35rem; }
  h2, h3 { margin: 0; font-weight: 600; }
  h2 { font-size: 1.25rem; }
  h3 { margin-top: 0.35rem; font-size: 0.95rem; line-height: 1.5; }
  .currency { color: var(--color-gain); font-size: 0.8rem; }
  .search-wrap { position: relative; margin-top: 1.5rem; }
  label { display: block; margin-bottom: 0.45rem; color: var(--color-text-muted); font-size: 0.78rem; }
  input { box-sizing: border-box; width: 100%; padding: 0.75rem; border: 1px solid var(--color-border); border-radius: 4px; outline: none; background: var(--color-bg); color: var(--color-text); font: inherit; }
  input:focus { border-color: var(--color-text-muted); }
  .search-status { position: absolute; right: 0.75rem; bottom: 0.8rem; letter-spacing: normal; text-transform: none; }
  .results { position: absolute; z-index: 2; top: 100%; right: 0; left: 0; overflow: hidden; border: 1px solid var(--color-border); background: var(--color-surface); }
  .results button { display: flex; width: 100%; justify-content: space-between; gap: 1rem; padding: 0.7rem 0.75rem; border: 0; border-bottom: 1px solid var(--color-border); background: transparent; color: var(--color-text); text-align: left; font: inherit; cursor: pointer; }
  .results button:last-child { border-bottom: 0; }
  .results button:hover { background: var(--color-border); }
  .results small { color: var(--color-text-muted); }
  .fund-summary { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--color-border); }
  .details { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-top: 1rem; }
  .details div { min-width: 0; }
  .details .label { display: block; margin-bottom: 0.35rem; letter-spacing: normal; text-transform: none; }
  strong { display: block; overflow: hidden; color: var(--color-text); font-weight: 400; text-overflow: ellipsis; white-space: nowrap; }
  .chart-panel { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--color-border); }
  .chart-heading { color: var(--color-text); font-size: 0.8rem; }
  svg { display: block; width: 100%; height: auto; margin-top: 0.75rem; overflow: visible; }
  .axis { stroke: var(--color-border); stroke-width: 1; }
  .line { fill: none; stroke: var(--color-gain); stroke-width: 2; vector-effect: non-scaling-stroke; }
  text { fill: var(--color-text-muted); font: 10px "Courier New", monospace; }
  .empty, .error { margin: 1.5rem 0 0; color: var(--color-text-muted); font-size: 0.85rem; }
  .error { color: var(--color-loss); }
  @media (max-width: 600px) { .details { grid-template-columns: repeat(2, 1fr); } .widget { padding: 1rem; } }
</style>
