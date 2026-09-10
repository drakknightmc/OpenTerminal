<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { widgets } from "../store/widgets";
  import type { WidgetType } from "../store/widgets";
  import { getWidgets } from "../finance/registry";

  let isOpen = false;
  let query = "";
  let selectedIndex = 0;
  let inputEl: HTMLInputElement;

  const WIDGET_LIST: { type: WidgetType; label: string }[] = getWidgets().map(({ type, label }) => ({ type, label }));

  let symbolResults: { symbol: string; name: string; exchange: string; type: string }[] = [];

  // Wired to /api/market/search
  async function searchSymbols(q: string) {
    if (!q) return [];
    const response = await fetch(`/api/market/search?q=${encodeURIComponent(q)}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.results || [];
  }

  let searchTimer: ReturnType<typeof setTimeout>;
  let searchRequestId = 0;

  function onQueryChange(e: Event) {
    query = (e.target as HTMLInputElement).value;
    selectedIndex = 0;
    clearTimeout(searchTimer);

    if (!query.trim()) {
      symbolResults = [];
      return;
    }

    const currentRequest = ++searchRequestId;
    searchTimer = setTimeout(async () => {
      const results = await searchSymbols(query);
      if (currentRequest === searchRequestId) symbolResults = results;
    }, 250);
  }

  function selectItem() {
    if (symbolResults[selectedIndex]) {
      widgets.setActiveSymbol(symbolResults[selectedIndex].symbol);
    } else {
      const widgetIndex = selectedIndex - symbolResults.length;
      if (widgetIndex >= 0 && widgetIndex < WIDGET_LIST.length) {
        widgets.addWidget(WIDGET_LIST[widgetIndex].type);
      }
    }
    isOpen = false;
    query = "";
    symbolResults = [];
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      isOpen = false;
      query = "";
      symbolResults = [];
    } else if (e.key === "ArrowDown") {
      selectedIndex = Math.min(selectedIndex + 1, symbolResults.length + WIDGET_LIST.length - 1);
    } else if (e.key === "ArrowUp") {
      selectedIndex = Math.max(selectedIndex - 1, 0);
    } else if (e.key === "Enter") {
      selectItem();
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      isOpen = true;
      setTimeout(() => inputEl?.focus(), 0);
    }
  }

  function openFromShell() {
    isOpen = true;
    setTimeout(() => inputEl?.focus(), 0);
  }

  onMount(() => {
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("ledgerline-open-command-palette", openFromShell);
  });

  onDestroy(() => {
    window.removeEventListener("keydown", handleKeyDown);
    document.removeEventListener("ledgerline-open-command-palette", openFromShell);
    clearTimeout(searchTimer);
  });

  $: if (isOpen) {
    setTimeout(() => inputEl?.focus(), 0);
  }
</script>

{#if isOpen}
  <div class="command-palette-overlay" role="presentation" on:click={() => (isOpen = false)} on:keydown={(e) => e.key === "Escape" && (isOpen = false)}>
    <div class="command-palette-box" role="presentation" on:click={(e) => e.stopPropagation()} on:keydown={(e) => e.stopPropagation()}>
      <input
        bind:this={inputEl}
        type="text"
        bind:value={query}
        on:input={onQueryChange}
        on:keydown={onKeyDown}
        placeholder="Search symbols or add widget…"
        class="search-input"
      />
      <div class="results-list">
        {#each symbolResults as result, i}
          <div
            class="result-item"
            role="button"
            tabindex="0"
            class:selected={i === selectedIndex}
            on:click={() => {
              selectedIndex = i;
              selectItem();
            }}
            on:keydown={(e) => e.key === "Enter" && (selectedIndex = i, selectItem())}
          >
            <span class="symbol">{result.symbol}</span>
            <span class="name">{result.name}</span>
            <span class="exchange">{result.exchange}</span>
          </div>
        {/each}
        {#each WIDGET_LIST as widget, i}
          <div
            class="widget-item"
            role="button"
            tabindex="0"
            class:selected={i + symbolResults.length === selectedIndex}
            on:click={() => {
              selectedIndex = i + symbolResults.length;
              selectItem();
            }}
            on:keydown={(e) => e.key === "Enter" && (selectedIndex = i + symbolResults.length, selectItem())}
          >
            <span class="widget-label">{widget.label}</span>
          </div>
        {/each}
        {#if query && symbolResults.length === 0 && query.length > 0}
          <div class="no-results">No symbols found for "{query}"</div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .command-palette-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding-top: 100px;
    z-index: 50;
  }

  .command-palette-box {
    width: 560px;
    background: var(--color-surface);
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
  }

  .search-input {
    width: 100%;
    padding: 12px;
    background: var(--color-surface);
    border: none;
    border-bottom: 1px solid var(--color-border);
    color: var(--color-text);
    font-size: 13px;
    font-family: "Courier New", monospace;
    outline: none;
  }

  .search-input::placeholder {
    color: var(--color-text-muted);
  }

  .results-list {
    max-height: 320px;
    overflow-y: auto;
  }

  .result-item,
  .widget-item {
    padding: 8px 12px;
    cursor: pointer;
    display: flex;
    gap: 12px;
    align-items: center;
    font-size: 12px;
    color: var(--color-text-dim);
  }

  .result-item:hover,
  .widget-item:hover {
    background: var(--color-surface-hover);
  }

  .result-item.selected,
  .widget-item.selected {
    background: color-mix(in srgb, var(--color-accent) 18%, transparent);
    color: var(--color-accent);
  }

  .symbol {
    font-weight: 600;
    color: var(--color-text);
    min-width: 60px;
  }

  .result-item.selected .symbol {
    color: var(--color-accent);
  }

  .name {
    flex: 1;
    opacity: 0.8;
  }

  .exchange {
    opacity: 0.6;
    min-width: 80px;
    text-align: right;
  }

  .widget-label {
    flex: 1;
  }

  .no-results {
    padding: 16px 12px;
    text-align: center;
    color: var(--color-text-muted);
    font-size: 12px;
  }
</style>
