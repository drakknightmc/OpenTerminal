<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { GridStack, type GridStackNode, type GridStackWidget } from "gridstack";
  import "gridstack/dist/gridstack.min.css";
  import "gridstack/dist/gridstack-extra.min.css";

  import { widgets } from "../store/widgets";
  import type { WidgetInstance, WidgetType } from "../store/widgets";
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

  const CELL_HEIGHT = 56;
  const COLUMNS = 12;

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
    "portfolio:total": "Portfolio: Total",
    "portfolio:icici_direct": "Portfolio: ICICI",
    "portfolio:ibkr": "Portfolio: IBKR",
    "portfolio:groww_mf": "Portfolio: Groww MF",
    ai: "AI Assistant",
    macro: "Macro",
    mutualfunds: "Mutual Funds",
    mutualfund: "Mutual Fund",
    indiamarket: "India Market",
  };

  type Component = { $set: (props: Record<string, unknown>) => void; $destroy: () => void };
  type MountedWidget = { element: HTMLElement; component: Component };

  let gridElement: HTMLElement;
  let grid: GridStack | null = null;
  let mounted: Record<string, MountedWidget> = {};

  $: if (grid && $widgets.widgets) syncWidgets();

  function layoutOf(widget: WidgetInstance): GridStackWidget {
    return {
      id: widget.id,
      x: Number.isInteger(widget.x) ? widget.x : 0,
      y: Number.isInteger(widget.y) ? widget.y : 0,
      w: Number.isInteger(widget.w) ? widget.w : 4,
      h: Number.isInteger(widget.h) ? widget.h : 3,
    };
  }

  function symbolFor(widget: WidgetInstance): string {
    return widget.linked ? ($widgets.activeSymbol || widget.symbol || "AAPL") : (widget.symbol || "AAPL");
  }

  function propsFor(widget: WidgetInstance): Record<string, unknown> {
    if (widget.type === "chart" || widget.type === "quote" || widget.type === "options") {
      return { symbol: symbolFor(widget) };
    }
    if (widget.type === "news" || widget.type === "ai") {
      return { symbol: widget.linked ? $widgets.activeSymbol : widget.symbol };
    }
    if (widget.type === "indiamarket") return { symbol: widget.symbol || "RELIANCE" };
    if (widget.type === "portfolio") return widget.section ? { section: widget.section } : {};
    return {};
  }

  function labelFor(widget: WidgetInstance): string {
    return WIDGET_LABELS[widget.section ? `${widget.type}:${widget.section}` : widget.type] || widget.type;
  }

  function createComponent(type: WidgetType, target: HTMLElement, widget: WidgetInstance): Component {
    const props = propsFor(widget);
    if (type === "chart") return new Chart({ target, props }) as unknown as Component;
    if (type === "quote") return new Quote({ target, props }) as unknown as Component;
    if (type === "watchlist") return new Watchlist({ target }) as unknown as Component;
    if (type === "news") return new News({ target, props }) as unknown as Component;
    if (type === "macro") return new Macro({ target }) as unknown as Component;
    if (type === "screener") return new Screener({ target }) as unknown as Component;
    if (type === "heatmap") return new Heatmap({ target }) as unknown as Component;
    if (type === "crypto") return new Crypto({ target }) as unknown as Component;
    if (type === "options") return new Options({ target, props }) as unknown as Component;
    if (type === "indiamarket") return new IndiaMarket({ target, props }) as unknown as Component;
    if (type === "mutualfund") return new MutualFund({ target }) as unknown as Component;
    if (type === "portfolio") return new Portfolio({ target, props }) as unknown as Component;
    return new AiAssistant({ target, props }) as unknown as Component;
  }

  function mountWidget(widget: WidgetInstance): MountedWidget {
    const item = grid!.addWidget(layoutOf(widget));
    const content = item.querySelector<HTMLElement>(".grid-stack-item-content")!;
    const panel = document.createElement("div");
    panel.className = "terminal-panel";

    const title = document.createElement("div");
    title.className = "panel-title";
    const label = document.createElement("span");
    label.className = "drag-handle";
    label.textContent = labelFor(widget);
    const close = document.createElement("button");
    close.type = "button";
    close.className = "close-btn";
    close.textContent = "✕";
    close.addEventListener("mousedown", (e) => e.stopPropagation());
    close.addEventListener("pointerdown", (e) => e.stopPropagation());
    close.addEventListener("touchstart", (e) => e.stopPropagation());
    close.addEventListener("click", () => widgets.removeWidget(widget.id));
    title.append(label, close);

    const body = document.createElement("div");
    body.className = "widget-body";
    const resizeHandle = document.createElement("div");
    resizeHandle.className = "resize-handle";
    panel.append(title, body, resizeHandle);
    content.replaceChildren(panel);

    const component = createComponent(widget.type, body, widget);
    const result = { element: item, component };
    mounted[widget.id] = result;
    return result;
  }

  function unmountWidget(id: string) {
    const entry = mounted[id];
    if (!entry) return;
    entry.component.$destroy();
    if (entry.element.isConnected) grid?.removeWidget(entry.element, true, false);
    delete mounted[id];
  }

  function syncWidgets() {
    for (const widget of $widgets.widgets) {
      const entry = mounted[widget.id] || mountWidget(widget);
      entry.component.$set(propsFor(widget));
    }
    for (const id of Object.keys(mounted)) {
      if (!$widgets.widgets.some((widget) => widget.id === id)) unmountWidget(id);
    }
    syncLayouts();
  }

  function syncLayouts() {
    if (!grid || grid.getColumn() !== COLUMNS) return;
    for (const widget of $widgets.widgets) {
      const entry = mounted[widget.id];
      const node = entry?.element.gridstackNode;
      const layout = layoutOf(widget);
      if (node && (node.x !== layout.x || node.y !== layout.y || node.w !== layout.w || node.h !== layout.h)) {
        grid.update(entry.element, layout);
      }
    }
  }

  function persistFromNode(node: GridStackNode | undefined) {
    if (!grid || grid.getColumn() !== COLUMNS || !node?.id) return;
    const id = String(node.id);
    const layout = { x: node.x || 0, y: node.y || 0, w: node.w || 1, h: node.h || 1 };
    widgets.updateLayout($widgets.widgets.map((widget) => (widget.id === id ? { ...widget, ...layout } : widget)));
  }

  onMount(() => {
    grid = GridStack.init(
      {
        column: COLUMNS,
        cellHeight: CELL_HEIGHT,
        margin: 6,
        float: false,
        animate: false,
        handle: ".drag-handle",
        columnOpts: {
          breakpointForWindow: true,
          breakpoints: [
            { w: 1200, c: 12 },
            { w: 860, c: 6 },
            { w: 520, c: 4 },
          ],
        },
      },
      gridElement,
    );
    grid.on("dragstop", (_event, element) => persistFromNode(element.gridstackNode));
    grid.on("resizestop", (_event, element) => persistFromNode(element.gridstackNode));
  });

  onDestroy(() => {
    for (const id of Object.keys(mounted)) mounted[id].component.$destroy();
    mounted = {};
    grid?.destroy(true);
    grid = null;
  });
</script>

<div class="workspace-scroll">
  <div class="grid-stack" bind:this={gridElement}></div>
</div>

<style>
  .workspace-scroll {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 12px;
    background: #0a0a0a;
  }

  :global(.grid-stack > .grid-stack-item > .grid-stack-item-content) {
    overflow: hidden;
    background: transparent;
  }

  :global(.terminal-panel) {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: #1a1a1a;
    border: 1px solid #333;
    border-radius: 4px;
    overflow: hidden;
    position: relative;
  }

  :global(.panel-title) {
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

  :global(.drag-handle) {
    cursor: grab;
    flex: 1;
  }

  :global(.drag-handle:active) {
    cursor: grabbing;
  }

  :global(.close-btn) {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    font-size: 12px;
    padding: 0 4px;
    margin-left: 8px;
  }

  :global(.close-btn:hover) {
    color: #ff6b6b;
  }

  :global(.widget-body) {
    flex: 1;
    overflow: auto;
  }

  :global(.resize-handle) {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 16px;
    height: 16px;
    pointer-events: none;
    background: linear-gradient(135deg, transparent 50%, #333 50%);
  }

  :global(.grid-stack > .grid-stack-item > .ui-resizable-se) {
    width: 16px;
    height: 16px;
    right: 0;
    bottom: 0;
  }
</style>
