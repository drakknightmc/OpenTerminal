<script lang="ts">
  import { widgets } from "../store/widgets";
  import type { WidgetType } from "../store/widgets";
  import { onMount } from "svelte";

  interface SidebarItem {
    type: WidgetType;
    label: string;
    key: string;
  }

  const ITEMS: SidebarItem[] = [
    { type: "chart", label: "CHART", key: "⌥1" },
    { type: "quote", label: "QUOTE", key: "⌥2" },
    { type: "news", label: "NEWS", key: "⌥3" },
    { type: "screener", label: "SCREENER", key: "⌥4" },
    { type: "heatmap", label: "HEATMAP", key: "⌥5" },
    { type: "crypto", label: "CRYPTO", key: "⌥6" },
    { type: "options", label: "OPTIONS", key: "⌥7" },
    { type: "portfolio", label: "PORTFOLIO", key: "⌥8" },
    { type: "ai", label: "AI ASSIST", key: "⌥9" },
    { type: "watchlist", label: "WATCHLIST", key: "" },
    { type: "macro", label: "MACRO", key: "" },
    { type: "mutualfund", label: "MUTUAL FUND", key: "" },
    { type: "indiamarket", label: "INDIA MARKET", key: "" },
  ];

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
    {#each ITEMS as item (item.type)}
      <button class="sidebar-item" on:click={() => widgets.addWidget(item.type)}>
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
    background: #1a1a1a;
    border-right: 1px solid #333;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    font-size: 10px;
  }

  .sidebar-header {
    padding: 6px 8px;
    border-bottom: 1px solid #333;
    color: #666;
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
    color: #ccc;
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
    background: #0f0f0f;
    color: #f0a000;
  }

  .label {
    flex: 1;
  }

  .key {
    color: #666;
    font-size: 9px;
    white-space: nowrap;
  }

  .reset-btn {
    background: none;
    border: none;
    border-top: 1px solid #333;
    padding: 8px;
    text-align: left;
    color: #666;
    font-size: 10px;
    cursor: pointer;
    text-transform: uppercase;
    transition: color 100ms;
  }

  .reset-btn:hover {
    color: #ff6b6b;
  }
</style>
