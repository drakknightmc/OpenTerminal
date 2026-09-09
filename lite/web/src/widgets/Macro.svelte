<script lang="ts">
  import { onMount } from "svelte";

  type TreasuryYield = {
    maturity: "2Y" | "5Y" | "10Y" | "30Y";
    yield: number;
  };

  type Vix = {
    value: number;
    change: number;
  };

  let yields: TreasuryYield[] = [];
  let vix: Vix | null = null;
  let loading = true;

  // Wired to /api/macro/treasuries
  async function fetchTreasuryYields(): Promise<TreasuryYield[]> {
    const response = await fetch("/api/macro/treasuries");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.yields || [];
  }

  // Wired to /api/macro/vix
  async function fetchVix(): Promise<Vix | null> {
    const response = await fetch("/api/macro/vix");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  const chart = { width: 520, height: 220, left: 48, right: 16, top: 18, bottom: 36 };

  $: minYield = yields.length ? Math.floor(Math.min(...yields.map((point) => point.yield)) - 0.5) : 0;
  $: maxYield = yields.length ? Math.ceil(Math.max(...yields.map((point) => point.yield)) + 0.5) : 5;
  $: plotWidth = chart.width - chart.left - chart.right;
  $: plotHeight = chart.height - chart.top - chart.bottom;
  $: yieldPoints = yields.map((point, index) => ({
    ...point,
    x: chart.left + (yields.length > 1 ? (index / (yields.length - 1)) * plotWidth : plotWidth / 2),
    y: chart.top + ((maxYield - point.yield) / (maxYield - minYield || 1)) * plotHeight
  }));
  $: linePoints = yieldPoints.map((point) => `${point.x},${point.y}`).join(" ");

  onMount(async () => {
    yields = await fetchTreasuryYields();
    vix = await fetchVix();
    loading = false;
  });
</script>

<section class="macro-card" aria-label="Macro indicators">
  <h2>Treasury Yield Curve</h2>
  {#if loading}
    <p class="muted">Loading macro data...</p>
  {:else}
    <svg viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" aria-label="Treasury yield curve">
      <text class="axis-label" x="10" y={chart.top + plotHeight / 2} transform={`rotate(-90 10 ${chart.top + plotHeight / 2})`}>Yield %</text>
      <line class="axis" x1={chart.left} y1={chart.top + plotHeight} x2={chart.width - chart.right} y2={chart.top + plotHeight} />
      <polyline class="curve" points={linePoints} />
      {#each yieldPoints as point}
        <circle class="point" cx={point.x} cy={point.y} r="3" />
        <text class="x-label" x={point.x} y={chart.height - 12} text-anchor="middle">{point.maturity}</text>
        <text class="y-label" x={point.x} y={point.y - 8} text-anchor="middle">{point.yield.toFixed(2)}</text>
      {/each}
    </svg>

    <div class="vix-row">
      <span class="vix-label">VIX</span>
      {#if vix}
        <span class="vix-value">{vix.value.toFixed(1)}</span>
        <span class:positive={vix.change >= 0} class:negative={vix.change < 0}>
          {vix.change >= 0 ? "+" : ""}{vix.change.toFixed(1)}
        </span>
      {:else}
        <span class="muted">Unavailable</span>
      {/if}
    </div>
  {/if}
</section>

<style>
  .macro-card {
    background: #1a1a1a;
    border: 1px solid #333;
    color: #e0e0e0;
    padding: 0.8rem;
  }

  h2 {
    margin: 0 0 0.45rem;
    font-size: 0.9rem;
    font-weight: 500;
  }

  svg {
    display: block;
    width: 100%;
    min-height: 180px;
  }

  .axis { stroke: #555; stroke-width: 1; }
  .curve { fill: none; stroke: #ff9900; stroke-width: 2; }
  .point { fill: #ff9900; }
  .axis-label, .x-label, .y-label { fill: #888; font-size: 11px; }
  .y-label { fill: #aaa; }

  .vix-row {
    display: flex;
    align-items: baseline;
    gap: 0.55rem;
    border-top: 1px solid #333;
    padding-top: 0.65rem;
    font-family: "Courier New", monospace;
  }

  .vix-label, .muted { color: #888; }
  .vix-value { font-size: 1.15rem; }
  .positive { color: #51cf66; }
  .negative { color: #ff6b6b; }
  .muted { font-size: 0.8rem; }
</style>
