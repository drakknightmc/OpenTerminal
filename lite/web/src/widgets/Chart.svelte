<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { createChart, CandlestickSeries, HistogramSeries, LineSeries, type IChartApi, type UTCTimestamp } from "lightweight-charts";
  import { bollinger, rsi, sma, type Candle, type Point } from "../lib/indicators";

  export let symbol: string;

  const TIMEFRAMES = ["1D", "1W", "1M", "6M", "1Y", "MAX"] as const;
  type Timeframe = (typeof TIMEFRAMES)[number];
  type Indicator = "SMA20" | "SMA50" | "RSI";

  const colors = { up: "#00c853", down: "#ff3d3d", sma20: "#ffd966", sma50: "#4fc3f7", rsi: "#ff9900" };
  const toTimestamp = (time: number) => time as UTCTimestamp;
  const formatNumber = (value: number, digits = 2) => value.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const formatVolume = (value: number) => value >= 1_000_000 ? `${(value / 1_000_000).toFixed(1)}M` : value >= 1_000 ? `${(value / 1_000).toFixed(1)}K` : value.toFixed(0);

  let timeframe: Timeframe = "6M";
  let active = new Set<Indicator>(["SMA20", "SMA50", "RSI"]);
  let candles: Candle[] = [];
  let legend: Candle | null = null;
  let loading = true;
  let chartHost: HTMLDivElement;
  let chart: IChartApi | null = null;

  // Wired to /api/market/candles
  async function fetchCandles(ticker: string, selectedTimeframe: string): Promise<Candle[]> {
    const response = await fetch(`/api/market/candles?symbol=${encodeURIComponent(ticker)}&timeframe=${encodeURIComponent(selectedTimeframe)}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.candles || [];
  }

  function toggleIndicator(indicator: Indicator) {
    active = new Set(active);
    if (active.has(indicator)) active.delete(indicator);
    else active.add(indicator);
    renderChart();
  }

  function renderChart() {
    if (!chartHost || candles.length === 0) return;
    chart?.remove();
    chart = createChart(chartHost, {
      autoSize: true,
      layout: { background: { color: "#0a0a0a" }, textColor: "#e0e0e0", fontSize: 11, attributionLogo: false },
      grid: { vertLines: { color: "#1a1a1a" }, horzLines: { color: "#1a1a1a" } },
      rightPriceScale: { borderColor: "#262626" },
      timeScale: { borderColor: "#262626", timeVisible: timeframe === "1D" || timeframe === "1W" },
      crosshair: { mode: 0 },
      handleScroll: { mouseWheel: false, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: true },
      handleScale: { mouseWheel: false, pinch: true, axisPressedMouseMove: true }
    });

    const main = chart.addSeries(CandlestickSeries, {
      upColor: colors.up, downColor: colors.down, borderUpColor: colors.up, borderDownColor: colors.down, wickUpColor: colors.up, wickDownColor: colors.down
    });
    main.setData(candles.map((c) => ({ time: toTimestamp(c.time), open: c.open, high: c.high, low: c.low, close: c.close })));

    const volume = chart.addSeries(HistogramSeries, { priceScaleId: "volume", priceFormat: { type: "volume" } });
    volume.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
    volume.setData(candles.map((c) => ({ time: toTimestamp(c.time), value: c.volume, color: c.close >= c.open ? "rgba(0,200,83,0.45)" : "rgba(255,61,61,0.45)" })));

    const overlay = (points: Point[], color: string) => chart?.addSeries(LineSeries, { color, lineWidth: 1, priceLineVisible: false, lastValueVisible: false }).setData(points.map((p) => ({ time: toTimestamp(p.time), value: p.value })));
    if (active.has("SMA20")) overlay(sma(candles, 20), colors.sma20);
    if (active.has("SMA50")) overlay(sma(candles, 50), colors.sma50);

    if (active.has("RSI")) {
      const rsiSeries = chart.addSeries(LineSeries, { color: colors.rsi, lineWidth: 1, priceLineVisible: false }, 1);
      rsiSeries.setData(rsi(candles).map((p) => ({ time: toTimestamp(p.time), value: p.value })));
    }

    chart.subscribeCrosshairMove((param) => {
      if (!param.time) {
        legend = candles[candles.length - 1];
        return;
      }
      const hit = candles.find((c) => c.time === Number(param.time));
      if (hit) legend = hit;
    });
    chart.timeScale().fitContent();
  }

  async function loadCandles() {
    loading = true;
    candles = await fetchCandles(symbol, timeframe);
    legend = candles[candles.length - 1] ?? null;
    loading = false;
    renderChart();
  }

  $: if (symbol && timeframe) loadCandles();

  onMount(() => renderChart());
  onDestroy(() => chart?.remove());
</script>

<div class="chart-widget">
  <div class="toolbar">
    {#each TIMEFRAMES as option}
      <button class:active={timeframe === option} on:click={() => timeframe = option}>{option}</button>
    {/each}
    <span class="separator"></span>
    <button class:active={active.has("SMA20")} on:click={() => toggleIndicator("SMA20")}>SMA20</button>
    <button class:active={active.has("SMA50")} on:click={() => toggleIndicator("SMA50")}>SMA50</button>
    <button class:active={active.has("RSI")} on:click={() => toggleIndicator("RSI")}>RSI</button>
  </div>
  {#if loading}<div class="message">Loading {symbol}...</div>{/if}
  <div class="plot-wrap">
    {#if legend}
      <div class="legend">
        <span>O <b>{formatNumber(legend.open)}</b></span>
        <span class="high">H <b>{formatNumber(legend.high)}</b></span>
        <span class="low">L <b>{formatNumber(legend.low)}</b></span>
        <span class:high={legend.close >= legend.open} class:low={legend.close < legend.open}>C <b>{formatNumber(legend.close)}</b></span>
        <span>Vol <b>{formatVolume(legend.volume)}</b></span>
      </div>
    {/if}
    <div class="chart" bind:this={chartHost}></div>
  </div>
</div>

<style>
  .chart-widget { display: flex; flex-direction: column; height: 100%; min-height: 320px; background: #0a0a0a; color: #e0e0e0; font: 11px monospace; }
  .toolbar { display: flex; flex-wrap: wrap; gap: 4px; padding: 5px; border-bottom: 1px solid #262626; }
  button { padding: 3px 7px; border: 1px solid #262626; border-radius: 2px; background: #0a0a0a; color: #888; cursor: pointer; font: inherit; }
  button:hover, button.active { border-color: #666; color: #e0e0e0; background: #1a1a1a; }
  .separator { width: 8px; }
  .message { padding: 8px; color: #888; }
  .plot-wrap { position: relative; flex: 1; min-height: 0; }
  .chart { width: 100%; height: 100%; }
  .legend { position: absolute; z-index: 1; top: 7px; left: 8px; display: flex; flex-wrap: wrap; gap: 12px; padding: 4px 6px; background: rgba(10, 10, 10, 0.78); pointer-events: none; }
  .legend span { color: #888; }
  .legend b { color: #e0e0e0; font-weight: normal; }
  .legend .high b { color: #00c853; }
  .legend .low b { color: #ff3d3d; }
  @media (max-width: 520px) { .separator { display: none; } .legend { gap: 7px; } }
</style>
