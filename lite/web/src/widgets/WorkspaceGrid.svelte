<script lang="ts">
  import { widgets } from "../store/widgets";
  import type { WidgetInstance } from "../store/widgets";
  import Chart from "./Chart.svelte";
  import Quote from "./Quote.svelte";
  import Watchlist from "./Watchlist.svelte";
  import News from "./News.svelte";
  import Macro from "./Macro.svelte";
  import Screener from "./Screener.svelte";
  import Heatmap from "./Heatmap.svelte";
  import Crypto from "./Crypto.svelte";
  import Options from "./Options.svelte";
  import IndiaMarket from "./IndiaMarket.svelte";
  import MutualFund from "./MutualFund.svelte";
  import Portfolio from "./Portfolio.svelte";
  import AiAssistant from "./AiAssistant.svelte";

  let dragging: { id: string; startX: number; startY: number; startX0: number; startY0: number; colWidth?: number; rowHeight?: number } | null = null;
  let resizing: { id: string; startX: number; startY: number; startW: number; startH: number; colWidth?: number; rowHeight?: number } | null = null;
  let gridContainer: HTMLElement | null = null;
  let pendingFrame: number | null = null;
  $: liveWidgets = $widgets.widgets;

  const WIDGET_LABELS: Record<string, string> = {
    chart: "Chart",
    quote: "Quote",
    watchlist: "Watchlist",
    news: "News",
    heatmap: "Heatmap",
    screener: "Screener",
    crypto: "Crypto",
    options: "Options",
    portfolio: "Portfolio",
    ai: "AI Assistant",
    macro: "Macro",
    mutualfunds: "Mutual Funds",
    mutualfund: "Mutual Fund",
    indiamarket: "India Market",
  };

  const GAP = 4;
  const COLS = 12;
  const ROW_HEIGHT = 30;

  function getGridMetrics(): { colWidth: number; rowHeight: number } {
    if (!gridContainer) return { colWidth: 0, rowHeight: ROW_HEIGHT + GAP };
    const containerWidth = gridContainer.offsetWidth;
    const colWidth = (containerWidth - (COLS - 1) * GAP) / COLS;
    return { colWidth, rowHeight: ROW_HEIGHT + GAP };
  }

  function startDrag(e: MouseEvent, id: string) {
    if ((e.target as HTMLElement).classList.contains("resize-handle")) return;
    const widget = $widgets.widgets.find((w) => w.id === id);
    if (widget) {
      const { colWidth, rowHeight } = getGridMetrics();
      dragging = { id, startX: e.clientX, startY: e.clientY, startX0: widget.x, startY0: widget.y, colWidth, rowHeight };
    }
  }

  function startResize(e: MouseEvent, id: string) {
    e.stopPropagation();
    const widget = $widgets.widgets.find((w) => w.id === id);
    if (widget) {
      const { colWidth, rowHeight } = getGridMetrics();
      resizing = { id, startX: e.clientX, startY: e.clientY, startW: widget.w, startH: widget.h, colWidth, rowHeight };
    }
  }

  function onMouseMove(e: MouseEvent) {
    if (dragging && dragging.colWidth && dragging.rowHeight) {
      const dx = e.clientX - dragging.startX;
      const dy = e.clientY - dragging.startY;
      const { colWidth, rowHeight } = dragging;

      const widget = liveWidgets.find((w) => w.id === dragging!.id);
      if (widget) {
        const gridDx = Math.round(dx / colWidth);
        const gridDy = Math.round(dy / rowHeight);

        let newX = dragging.startX0 + gridDx;
        let newY = dragging.startY0 + gridDy;

        // Clamp to grid bounds
        newX = Math.max(0, Math.min(newX, COLS - widget.w));
        newY = Math.max(0, newY);

        widget.x = newX;
        widget.y = newY;

        // Batch visual updates with requestAnimationFrame instead of triggering on every mousemove
        if (pendingFrame === null) {
          pendingFrame = requestAnimationFrame(() => {
            liveWidgets = liveWidgets;
            pendingFrame = null;
          });
        }
      }
    }
    if (resizing && resizing.colWidth && resizing.rowHeight) {
      const dx = e.clientX - resizing.startX;
      const dy = e.clientY - resizing.startY;
      const { colWidth, rowHeight } = resizing;

      const widget = liveWidgets.find((w) => w.id === resizing!.id);
      if (widget) {
        const gridDx = Math.round(dx / colWidth);
        const gridDy = Math.round(dy / rowHeight);

        let newW = Math.max(2, resizing.startW + gridDx);
        let newH = Math.max(3, resizing.startH + gridDy);

        // Clamp width to grid edge
        newW = Math.min(newW, COLS - widget.x);

        widget.w = newW;
        widget.h = newH;

        // Batch visual updates with requestAnimationFrame instead of triggering on every mousemove
        if (pendingFrame === null) {
          pendingFrame = requestAnimationFrame(() => {
            liveWidgets = liveWidgets;
            pendingFrame = null;
          });
        }
      }
    }
  }

  function onMouseUp() {
    if (pendingFrame !== null) {
      cancelAnimationFrame(pendingFrame);
      pendingFrame = null;
    }
    if (dragging || resizing) {
      liveWidgets = liveWidgets;
      widgets.updateLayout(liveWidgets);
    }
    dragging = null;
    resizing = null;
  }
</script>

<svelte:window on:mousemove={onMouseMove} on:mouseup={onMouseUp} />

<div class="workspace-grid" bind:this={gridContainer}>
  {#each $widgets.widgets as widget (widget.id)}
    <div
      class="widget-container"
      style={`grid-column: ${widget.x + 1} / span ${widget.w}; grid-row: ${widget.y + 1} / span ${widget.h};`}
      on:mousedown={(e) => startDrag(e, widget.id)}
    >
      <div class="terminal-panel">
        <div class="panel-title">
          <span>{WIDGET_LABELS[widget.type]}</span>
          <button
            on:click={() => widgets.removeWidget(widget.id)}
            class="close-btn"
          >
            ✕
          </button>
        </div>
        <div class="widget-body">
          {#if widget.type === "chart"}
            <Chart symbol={widget.linked ? ($widgets.activeSymbol || widget.symbol || "AAPL") : (widget.symbol || "AAPL")} />
          {:else if widget.type === "quote"}
            <Quote symbol={widget.linked ? ($widgets.activeSymbol || widget.symbol || "AAPL") : (widget.symbol || "AAPL")} />
          {:else if widget.type === "watchlist"}
            <Watchlist />
          {:else if widget.type === "news"}
            <News symbol={widget.linked ? $widgets.activeSymbol : widget.symbol} />
          {:else if widget.type === "macro"}
            <Macro />
          {:else if widget.type === "screener"}
            <Screener />
          {:else if widget.type === "heatmap"}
            <Heatmap />
          {:else if widget.type === "crypto"}
            <Crypto />
          {:else if widget.type === "options"}
            <Options symbol={widget.linked ? ($widgets.activeSymbol || widget.symbol || "AAPL") : (widget.symbol || "AAPL")} />
          {:else if widget.type === "indiamarket"}
            <IndiaMarket symbol={widget.symbol || "RELIANCE"} />
          {:else if widget.type === "mutualfund"}
            <MutualFund />
          {:else if widget.type === "portfolio"}
            <Portfolio />
          {:else if widget.type === "ai"}
            <AiAssistant symbol={widget.linked ? $widgets.activeSymbol : widget.symbol} />
          {/if}
        </div>
        <div class="resize-handle" on:mousedown={(e) => startResize(e, widget.id)}></div>
      </div>
    </div>
  {/each}
</div>

<style>
  .workspace-grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    grid-auto-rows: 30px;
    gap: 4px;
    padding: 4px;
    flex: 1;
    overflow: auto;
    background: #0a0a0a;
  }

  .widget-container {
    min-height: 0;
    display: flex;
    user-select: none;
  }

  .terminal-panel {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: #1a1a1a;
    border: 1px solid #333;
    border-radius: 4px;
    overflow: hidden;
    cursor: grab;
    position: relative;
  }

  .terminal-panel:active {
    cursor: grabbing;
  }

  .panel-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 8px;
    background: #0f0f0f;
    border-bottom: 1px solid #333;
    font-size: 11px;
    font-weight: 600;
    color: #e0e0e0;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .close-btn {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    font-size: 12px;
    padding: 0 4px;
    margin-left: 8px;
  }

  .close-btn:hover {
    color: #ff6b6b;
  }

  .widget-body {
    flex: 1;
    overflow: auto;
  }

  .resize-handle {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 16px;
    height: 16px;
    cursor: nwse-resize;
    background: linear-gradient(135deg, transparent 50%, #333 50%);
  }
</style>
