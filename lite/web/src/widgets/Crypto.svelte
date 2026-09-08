<script lang="ts">
  import { onMount } from "svelte";
  import { createChart, ColorType, CandlestickSeries } from "lightweight-charts";

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
  let chartInstance: any = null;

  const timeframes = ["1D", "5D", "1W", "1M", "3M", "6M", "YTD", "1Y", "5Y", "MAX"];

  // TODO(integration): wire to real /api/crypto route
  async function fetchTopAssets(limit: number): Promise<CryptoAsset[]> {
    // Stub: return mock data for testing
    return [
      {
        id: "bitcoin",
        symbol: "BTC",
        name: "Bitcoin",
        price: 45000,
        changePercent24h: 2.5,
        marketCap: 900000000000,
        volume24h: 25000000000,
        rank: 1,
        sparkline: [44000, 44200, 44500, 44800, 45000, 45200, 45000, 44800, 45100, 45300, 45000, 44900, 45200, 45100, 45000],
      },
      {
        id: "ethereum",
        symbol: "ETH",
        name: "Ethereum",
        price: 2500,
        changePercent24h: 3.2,
        marketCap: 300000000000,
        volume24h: 15000000000,
        rank: 2,
        sparkline: [2450, 2460, 2470, 2480, 2500, 2510, 2500, 2490, 2520, 2530, 2500, 2490, 2510, 2505, 2500],
      },
      {
        id: "binancecoin",
        symbol: "BNB",
        name: "BNB",
        price: 600,
        changePercent24h: 1.8,
        marketCap: 90000000000,
        volume24h: 3000000000,
        rank: 3,
        sparkline: [590, 592, 595, 598, 600, 602, 600, 598, 605, 610, 600, 598, 602, 601, 600],
      },
      {
        id: "solana",
        symbol: "SOL",
        name: "Solana",
        price: 120,
        changePercent24h: -1.5,
        marketCap: 50000000000,
        volume24h: 2000000000,
        rank: 4,
        sparkline: [125, 123, 121, 120, 119, 118, 120, 121, 119, 118, 120, 121, 120, 119, 120],
      },
      {
        id: "cardano",
        symbol: "ADA",
        name: "Cardano",
        price: 0.95,
        changePercent24h: 0.5,
        marketCap: 34000000000,
        volume24h: 1200000000,
        rank: 5,
        sparkline: [0.94, 0.945, 0.95, 0.951, 0.952, 0.951, 0.95, 0.949, 0.952, 0.953, 0.95, 0.949, 0.951, 0.95, 0.95],
      },
    ];
  }

  // TODO(integration): wire to real /api/crypto/dominance route
  async function fetchDominance(): Promise<GlobalStats> {
    // Stub: return mock data for testing
    return { btc: 45.2, eth: 18.5, totalMarketCap: 1300000000000 };
  }

  // TODO(integration): wire to real /api/crypto/ohlcv route
  async function getOHLCV(symbol: string, timeframe: string): Promise<Candle[]> {
    // Stub: return mock candlestick data
    const now = Math.floor(Date.now() / 1000);
    const candles: Candle[] = [];
    for (let i = 100; i >= 0; i--) {
      const time = now - i * 86400; // daily candles
      const base = 44000 + Math.random() * 2000;
      candles.push({
        time,
        open: base + Math.random() * 500,
        high: base + Math.random() * 1000,
        low: base - Math.random() * 1000,
        close: base + Math.random() * 500,
        volume: Math.random() * 50000000000,
      });
    }
    return candles;
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
          background: { type: ColorType.Solid, color: "#0a0a0a" },
          textColor: "#e0e0e0",
        },
        width: chartContainer.clientWidth,
        height: 300,
        timeScale: { timeVisible: true, secondsVisible: true },
      });

      const candleSeries = chartInstance.addSeries(CandlestickSeries, {
        upColor: "#51cf66",
        downColor: "#ff3d3d",
        borderUpColor: "#51cf66",
        borderDownColor: "#ff3d3d",
        wickUpColor: "#51cf66",
        wickDownColor: "#ff3d3d",
      });

      candleSeries.setData(candleData);
      chartInstance.timeScale().fitContent();
    } catch (e) {
      error = e instanceof Error ? e.message : "Chart rendering failed";
    }
  }

  async function changeTimeframe(tf: string) {
    selectedTimeframe = tf;
    try {
      candleData = await getOHLCV(selectedAsset!.symbol, tf);
      loadChart();
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to load chart data";
    }
  }

  onMount(async () => {
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
    return () => window.removeEventListener("resize", handleResize);
  });
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
                    stroke={asset.sparkline[asset.sparkline.length - 1] >= asset.sparkline[0] ? "#51cf66" : "#ff3d3d"}
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
    background: #0a0a0a;
    color: #e0e0e0;
    font-family: monospace;
  }

  .error-banner {
    padding: 0.75rem;
    background: #1a0a0a;
    border: 1px solid #ff3d3d;
    border-radius: 4px;
    color: #ff6b6b;
  }

  .loading {
    text-align: center;
    padding: 2rem;
    color: #888;
  }

  .dominance-header {
    display: flex;
    gap: 2rem;
    padding: 1rem;
    background: #1a1a1a;
    border: 1px solid #333;
    border-radius: 4px;
    border-bottom: 1px solid #333;
  }

  .stat {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .stat .label {
    font-size: 0.75rem;
    color: #888;
    text-transform: uppercase;
  }

  .stat .value {
    font-size: 1rem;
    font-weight: bold;
    color: #51cf66;
  }

  .assets-table {
    width: 100%;
    border-collapse: collapse;
    background: #1a1a1a;
    border: 1px solid #333;
    border-radius: 4px;
    overflow: hidden;
  }

  .assets-table thead {
    background: #0f0f0f;
    border-bottom: 1px solid #333;
  }

  .assets-table th {
    padding: 0.75rem;
    text-align: left;
    font-size: 0.85rem;
    color: #888;
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
    border-left: 3px solid #51cf66;
  }

  .asset-name {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .asset-name .symbol {
    font-weight: bold;
    color: #e0e0e0;
  }

  .asset-name .name {
    font-size: 0.85rem;
    color: #888;
  }

  .price {
    font-weight: 500;
  }

  .change {
    font-weight: 500;
  }

  .change.text-green {
    color: #51cf66;
  }

  .change.text-red {
    color: #ff3d3d;
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
    background: #1a1a1a;
    border: 1px solid #333;
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
    color: #e0e0e0;
  }

  .chart-title .name {
    color: #888;
  }

  .chart-title .price {
    color: #51cf66;
    font-weight: 500;
  }

  .timeframe-buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .tf-btn {
    padding: 0.5rem 0.75rem;
    background: #0f0f0f;
    border: 1px solid #333;
    color: #888;
    font-family: monospace;
    font-size: 0.85rem;
    cursor: pointer;
    border-radius: 3px;
    transition: all 0.2s;
  }

  .tf-btn:hover {
    background: #1a1a1a;
    color: #e0e0e0;
  }

  .tf-btn.active {
    background: #51cf66;
    border-color: #51cf66;
    color: #0a0a0a;
    font-weight: bold;
  }

  .chart-container {
    width: 100%;
    height: 300px;
    border: 1px solid #333;
    border-radius: 3px;
    overflow: hidden;
  }
</style>
