<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { createChart, ColorType, CandlestickSeries, type IChartApi } from "lightweight-charts";

  type CryptoAsset = {
    id: string;
    symbol: string;
    name: string;
    price: number;
    changePercent24h: number | null;
    marketCap: number | null;
    volume24h: number | null;
    rank: number | null;
    sparkline: number[];
  };

  type Candle = { time: number; open: number; high: number; low: number; close: number; volume: number };

  type GlobalStats = { btc: number; eth: number; totalMarketCap?: number };

  let assets: CryptoAsset[] = [];
  let global: GlobalStats = { btc: 0, eth: 0 };
  let error: string | null = null;
  let loading = true;

  let selectedAsset: CryptoAsset | null = null;
  let candleData: Candle[] = [];
  let selectedTimeframe = "1W";
  let chartContainer: HTMLDivElement;
  let chartInstance: IChartApi | null = null;

  function themeColor(name: string, fallback: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  }

  const timeframes = ["1D", "5D", "1W", "1M", "3M", "6M", "YTD", "1Y", "5Y", "MAX"];

  // Wired to /api/crypto
  async function fetchTopAssets(limit: number): Promise<CryptoAsset[]> {
    const response = await fetch(`/api/crypto?limit=${limit}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.assets || [];
  }

  // Wired to /api/crypto/dominance
  async function fetchDominance(): Promise<GlobalStats> {
    const response = await fetch("/api/crypto/dominance");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  // Wired to /api/crypto/ohlcv
  async function getOHLCV(symbol: string, timeframe: string): Promise<Candle[]> {
    const response = await fetch(`/api/crypto/ohlcv?symbol=${encodeURIComponent(symbol)}&timeframe=${encodeURIComponent(timeframe)}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.candles || [];
  }

  function formatNum(val: number | null | undefined, isPrice = false): string {
    if (val === null || val === undefined) return "—";
    if (isPrice && val >= 1) return val.toFixed(2);
    if (isPrice && val < 1) return val.toPrecision(4);
    return val.toFixed(2);
  }

  function formatBig(val: number | null | undefined): string {
    if (val === null || val === undefined) return "—";
    if (val >= 1e9) return (val / 1e9).toFixed(1) + "B";
    if (val >= 1e6) return (val / 1e6).toFixed(1) + "M";
    if (val >= 1e3) return (val / 1e3).toFixed(1) + "K";
    return val.toFixed(0);
  }

  function formatPercent(val: number | null | undefined): string {
    if (val === null || val === undefined) return "—";
    return val.toFixed(2) + "%";
  }

  function getPercentClass(val: number | null | undefined): string {
    if (val === null || val === undefined) return "";
    return val >= 0 ? "text-green" : "text-red";
  }

  function renderSparkline(data: number[]): string {
    if (data.length < 2) return "";
    const w = 60;
    const h = 16;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const pts = data
      .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
      .join(" ");
    return pts;
  }

  function selectAsset(asset: CryptoAsset) {
    selectedAsset = asset;
    loadChart();
  }

  async function loadChart() {
    if (!selectedAsset || !chartContainer) return;
    try {
      if (candleData.length === 0) {
        candleData = await getOHLCV(selectedAsset.symbol, selectedTimeframe);
      }

      // Destroy previous chart if exists
      if (chartInstance) {
        chartInstance.remove();
      }

      // Create new chart
      chartInstance = createChart(chartContainer, {
        layout: {
          background: { type: ColorType.Solid, color: themeColor("--color-bg", "#161826") },
          textColor: themeColor("--color-text", "#e9e9ed"),
        },
        width: chartContainer.clientWidth,
        height: 300,
        timeScale: { timeVisible: true, secondsVisible: true },
      });

      const candleSeries = chartInstance.addSeries(CandlestickSeries, {
        upColor: themeColor("--color-gain", "#57c98c"),
        downColor: themeColor("--color-loss", "#e0736c"),
        borderUpColor: themeColor("--color-gain", "#57c98c"),
        borderDownColor: themeColor("--color-loss", "#e0736c"),
        wickUpColor: themeColor("--color-gain", "#57c98c"),
        wickDownColor: themeColor("--color-loss", "#e0736c"),
      });

      candleSeries.setData(candleData);
      chartInstance.timeScale().fitContent();
    } catch (e) {
      error = e instanceof Error ? e.message : "Chart rendering failed";
    }
  }

  async function changeTimeframe(tf: string) {
    if (!selectedAsset) return;
    selectedTimeframe = tf;
    try {
      candleData = await getOHLCV(selectedAsset.symbol, tf);
      loadChart();
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to load chart data";
    }
  }

  onMount(async () => {
    const refreshChartForTheme = () => { void loadChart(); };
    document.addEventListener("openterminal-theme-change", refreshChartForTheme);
    try {
      [assets, global] = await Promise.all([fetchTopAssets(20), fetchDominance()]);
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to fetch data";
    } finally {
      loading = false;
    }

    // Resize chart on window resize
    const handleResize = () => {
      if (chartInstance && chartContainer) {
        chartInstance.applyOptions({ width: chartContainer.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("openterminal-theme-change", refreshChartForTheme);
    };
  });

  onDestroy(() => chartInstance?.remove());
</script>

<div class="crypto-widget">
  {#if error}
    <div class="error-banner">Error: {error}</div>
  {/if}

  {#if loading}
    <div class="loading">Loading crypto data...</div>
  {:else}
    <!-- Dominance Header -->
    {#if global}
      <div class="dominance-header">
        <div class="stat">
          <span class="label">BTC.D</span>
          <span class="value">{formatPercent(global.btc)}</span>
        </div>
        <div class="stat">
          <span class="label">ETH.D</span>
          <span class="value">{formatPercent(global.eth)}</span>
        </div>
        <div class="stat">
          <span class="label">Total MCap</span>
          <span class="value">{formatBig(global.totalMarketCap)}</span>
        </div>
      </div>
    {/if}

    <!-- Assets Table -->
    <table class="assets-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Asset</th>
          <th>Price</th>
          <th>24h%</th>
          <th>MCap</th>
          <th>Vol 24h</th>
          <th>7d</th>
        </tr>
      </thead>
      <tbody>
        {#each assets as asset (asset.id)}
          <tr
            class="asset-row"
            class:selected={selectedAsset?.id === asset.id}
            on:click={() => selectAsset(asset)}
          >
            <td class="rank">{asset.rank ?? "—"}</td>
            <td class="asset-name">
              <span class="symbol">{asset.symbol}</span>
              <span class="name">{asset.name}</span>
            </td>
            <td class="price">{formatNum(asset.price, true)}</td>
            <td class="change {getPercentClass(asset.changePercent24h)}">
              {formatPercent(asset.changePercent24h)}
            </td>
            <td class="mcap">{formatBig(asset.marketCap)}</td>
            <td class="volume">{formatBig(asset.volume24h)}</td>
            <td class="sparkline-cell">
              {#if asset.sparkline.length > 1}
                <svg width="60" height="16" viewBox="0 0 60 16">
                  <polyline
                    points={renderSparkline(asset.sparkline)}
                    fill="none"
                    stroke={asset.sparkline[asset.sparkline.length - 1] >= asset.sparkline[0] ? "var(--color-gain)" : "var(--color-loss)"}
                    stroke-width="1"
                  />
                </svg>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>

    <!-- OHLCV Chart -->
    {#if selectedAsset}
      <div class="chart-panel">
        <div class="chart-header">
          <div class="chart-title">
            <span class="symbol">{selectedAsset.symbol}</span>
            <span class="name">{selectedAsset.name}</span>
            <span class="price">${formatNum(selectedAsset.price, true)}</span>
          </div>
          <div class="timeframe-buttons">
            {#each timeframes as tf}
              <button
                class="tf-btn"
                class:active={selectedTimeframe === tf}
                on:click={() => changeTimeframe(tf)}
              >
                {tf}
              </button>
            {/each}
          </div>
        </div>
        <div class="chart-container" bind:this={chartContainer}></div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .crypto-widget {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    background: var(--color-bg);
    color: var(--color-text);
    font-family: monospace;
  }

  .error-banner {
    padding: 0.75rem;
    background: #1a0a0a;
    border: 1px solid var(--color-loss);
    border-radius: 4px;
    color: var(--color-loss);
  }

  .loading {
    text-align: center;
    padding: 2rem;
    color: var(--color-text-muted);
  }

  .dominance-header {
    display: flex;
    gap: 2rem;
    padding: 1rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    border-bottom: 1px solid var(--color-border);
  }

  .stat {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .stat .label {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
  }

  .stat .value {
    font-size: 1rem;
    font-weight: bold;
    color: var(--color-gain);
  }

  .assets-table {
    width: 100%;
    border-collapse: collapse;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    overflow: hidden;
  }

  .assets-table thead {
    background: var(--color-surface-raised);
    border-bottom: 1px solid var(--color-border);
  }

  .assets-table th {
    padding: 0.75rem;
    text-align: left;
    font-size: 0.85rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    font-weight: 500;
    letter-spacing: 0.5px;
  }

  .assets-table td {
    padding: 0.75rem;
    border-bottom: 1px solid #222;
    text-align: right;
  }

  .assets-table td.rank,
  .assets-table td.asset-name {
    text-align: left;
  }

  .asset-row {
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .asset-row:hover {
    background: #252525;
  }

  .asset-row.selected {
    background: #1f2f1f;
    border-left: 3px solid var(--color-gain);
  }

  .asset-name {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .asset-name .symbol {
    font-weight: bold;
    color: var(--color-text);
  }

  .asset-name .name {
    font-size: 0.85rem;
    color: var(--color-text-muted);
  }

  .price {
    font-weight: 500;
  }

  .change {
    font-weight: 500;
  }

  .change.text-green {
    color: var(--color-gain);
  }

  .change.text-red {
    color: var(--color-loss);
  }

  .sparkline-cell {
    padding: 0.5rem 0.75rem !important;
    text-align: center;
  }

  .sparkline-cell svg {
    display: block;
    margin: 0 auto;
    height: 1.2rem;
    width: auto;
  }

  .chart-panel {
    margin-top: 1.5rem;
    padding: 1rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 4px;
  }

  .chart-header {
    margin-bottom: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .chart-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
  }

  .chart-title .symbol {
    font-weight: bold;
    color: var(--color-text);
  }

  .chart-title .name {
    color: var(--color-text-muted);
  }

  .chart-title .price {
    color: var(--color-gain);
    font-weight: 500;
  }

  .timeframe-buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .tf-btn {
    padding: 0.5rem 0.75rem;
    background: var(--color-surface-raised);
    border: 1px solid var(--color-border);
    color: var(--color-text-muted);
    font-family: monospace;
    font-size: 0.85rem;
    cursor: pointer;
    border-radius: 3px;
    transition: all 0.2s;
  }

  .tf-btn:hover {
    background: var(--color-surface);
    color: var(--color-text);
  }

  .tf-btn.active {
    background: var(--color-gain);
    border-color: var(--color-gain);
    color: var(--color-bg);
    font-weight: bold;
  }

  .chart-container {
    width: 100%;
    height: 300px;
    border: 1px solid var(--color-border);
    border-radius: 3px;
    overflow: hidden;
  }
</style>
