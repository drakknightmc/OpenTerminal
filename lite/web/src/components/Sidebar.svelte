<script lang="ts">
  import { widgets } from "../store/widgets";
  import type { PortfolioSection, WidgetType } from "../store/widgets";
  import { onMount } from "svelte";
  import { getWidgets } from "../finance/registry";

  interface SidebarItem {
    type: WidgetType;
    label: string;
    key: string;
    section?: PortfolioSection;
  }

  const ITEMS: SidebarItem[] = getWidgets().flatMap((definition) => [
    { type: definition.type, label: definition.label.toUpperCase(), key: definition.shortcut ?? "" },
    ...(definition.type === "portfolio" ? [
    { type: "portfolio", label: "PORTFOLIO: TOTAL", key: "", section: "total" },
    { type: "portfolio", label: "PORTFOLIO: ICICI", key: "", section: "icici_direct" },
    { type: "portfolio", label: "PORTFOLIO: IBKR", key: "", section: "ibkr" },
    { type: "portfolio", label: "PORTFOLIO: GROWW MF", key: "", section: "groww_mf" },
    ] : []),
  ]);

  const KEY_MAP: Record<string, WidgetType> = {
    "1": "chart",
    "2": "quote",
    "3": "news",
    "4": "screener",
    "5": "heatmap",
    "6": "crypto",
    "7": "options",
    "8": "portfolio",
    "9": "ai",
  };

  onMount(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.altKey && e.key in KEY_MAP) {
        e.preventDefault();
        widgets.addWidget(KEY_MAP[e.key]);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });
</script>

<nav class="sidebar">
  <div class="sidebar-header">Add widget</div>
  <div class="sidebar-items">
    {#each ITEMS as item (item.section ?? item.type)}
      <button class="sidebar-item" on:click={() => widgets.addWidget(item.type, item.section)}>
        <span class="label">{item.label}</span>
        {#if item.key}
          <span class="key">{item.key}</span>
        {/if}
      </button>
    {/each}
  </div>
  <button class="reset-btn" on:click={() => widgets.resetWorkspace()}>
    RESET LAYOUT
  </button>
</nav>

<style>
  .sidebar {
    width: 128px;
    background: var(--color-surface);
    border-right: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    font-size: 10px;
  }

  .sidebar-header {
    padding: 6px 8px;
    border-bottom: 1px solid var(--color-border);
    color: var(--color-text-muted);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .sidebar-items {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  .sidebar-item {
    background: none;
    border: none;
    padding: 8px;
    text-align: left;
    color: var(--color-text-dim);
    font-size: 10px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 4px;
    border-bottom: 1px solid transparent;
    transition: all 100ms;
  }

  .sidebar-item:hover {
    background: var(--color-surface-hover);
    color: var(--color-accent);
  }

  .label {
    flex: 1;
  }

  .key {
    color: var(--color-text-muted);
    font-size: 9px;
    white-space: nowrap;
  }

  .reset-btn {
    background: none;
    border: none;
    border-top: 1px solid var(--color-border);
    padding: 8px;
    text-align: left;
    color: var(--color-text-muted);
    font-size: 10px;
    cursor: pointer;
    text-transform: uppercase;
    transition: color 100ms;
  }

  .reset-btn:hover {
    color: var(--color-loss);
  }
</style>
