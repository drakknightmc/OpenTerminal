<script lang="ts">
  import { onMount } from "svelte";

  export let columns: Array<{ key: string; label: string; align?: "left" | "right" | "center" }> = [];
  export let rows: Array<Record<string, unknown>> = [];
  export let totals: Record<string, unknown> | undefined = undefined;
  export let onRowClick: ((row: Record<string, unknown>) => void) | undefined = undefined;
  export let tableKey: string | undefined = undefined;
  type Tone = "gain" | "loss" | "accent" | "muted";
  type Cell = { text: string; tone?: Tone };
  let visibleKeys: string[] = [];

  $: availableKeys = columns.map((column) => column.key);
  $: visibleColumns = columns.filter((column) => visibleKeys.length === 0 || visibleKeys.includes(column.key));

  onMount(() => {
    if (!tableKey) return;
    try {
      const stored = JSON.parse(localStorage.getItem(`openterminal-table-columns:${tableKey}`) ?? "null");
      if (Array.isArray(stored)) {
        const selected = stored.filter((key): key is string => typeof key === "string" && availableKeys.includes(key));
        if (selected.length) visibleKeys = selected;
      }
    } catch { /* corrupted preferences fall back to showing every column */ }
  });

  function isVisible(key: string): boolean {
    return visibleKeys.length === 0 || visibleKeys.includes(key);
  }

  function toggleColumn(key: string): void {
    const selected = visibleColumns.map((column) => column.key);
    if (selected.includes(key)) {
      if (selected.length === 1) return;
      visibleKeys = selected.filter((selectedKey) => selectedKey !== key);
    } else {
      visibleKeys = [...selected, key];
    }
    if (tableKey) {
      try { localStorage.setItem(`openterminal-table-columns:${tableKey}`, JSON.stringify(visibleKeys)); } catch { /* preferences are optional */ }
    }
  }

  function resetColumns(): void {
    visibleKeys = [];
    if (tableKey) {
      try { localStorage.removeItem(`openterminal-table-columns:${tableKey}`); } catch { /* preferences are optional */ }
    }
  }

  function isCell(value: unknown): value is Cell { return typeof value === "object" && value !== null && "text" in value; }
  function activate(row: Record<string, unknown>, event: KeyboardEvent) {
    if ((event.key === "Enter" || event.key === " ") && onRowClick) { event.preventDefault(); onRowClick(row); }
  }
</script>

{#if tableKey}
  <div class="table-tools">
    <details class="column-picker">
      <summary>Columns</summary>
      <div class="column-menu">
        <div class="column-menu-head"><span>Show columns</span><button type="button" on:click={resetColumns}>Reset</button></div>
        {#each columns as column}
          <label><input type="checkbox" checked={isVisible(column.key)} disabled={visibleColumns.length === 1 && isVisible(column.key)} on:change={() => toggleColumn(column.key)} /> <span>{column.label}</span></label>
        {/each}
      </div>
    </details>
  </div>
{/if}
<div class="table-wrap"><table class="table"><thead><tr>{#each visibleColumns as column}<th style={`text-align:${column.align ?? "left"}`}>{column.label}</th>{/each}</tr></thead><tbody>{#each rows as row}<tr class:clickable={onRowClick} role={onRowClick ? "button" : undefined} tabindex={onRowClick ? 0 : undefined} on:click={() => onRowClick?.(row)} on:keydown={(event) => activate(row, event)}>{#each visibleColumns as column}{@const value = row[column.key]}<td style={`text-align:${column.align ?? "left"}`}>{#if isCell(value)}<span class={value.tone ?? ""}>{value.text}</span>{:else}{value ?? "—"}{/if}</td>{/each}</tr>{/each}</tbody>{#if totals}<tfoot><tr>{#each visibleColumns as column}{@const value = totals[column.key]}<td style={`text-align:${column.align ?? "left"}`}>{#if isCell(value)}<span class={value.tone ?? ""}>{value.text}</span>{:else}{value ?? ""}{/if}</td>{/each}</tr></tfoot>{/if}</table></div>
<style>
  .table-tools { display: flex; justify-content: flex-end; margin-bottom: 6px; } .column-picker { position: relative; color: var(--color-text-muted); font-size: 10px; } summary { padding: 4px 8px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); cursor: pointer; list-style: none; } summary::-webkit-details-marker { display: none; } summary::after { content: "⌄"; margin-left: 6px; color: var(--color-text-faint); } .column-picker[open] summary { border-color: var(--color-accent); color: var(--color-text); } .column-menu { position: absolute; z-index: 3; top: calc(100% + 5px); right: 0; display: grid; gap: 7px; min-width: 180px; padding: 10px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); box-shadow: var(--shadow-md); } .column-menu-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 5px; border-bottom: 1px solid var(--color-divider); color: var(--color-text); font-size: 10px; } .column-menu-head button { border: 0; background: transparent; color: var(--color-accent); cursor: pointer; font: inherit; } label { display: flex; align-items: center; gap: 5px; cursor: pointer; } label:has(input:disabled) { color: var(--color-text-faint); cursor: not-allowed; }
  .table-wrap { overflow: auto; } table { width: max-content; min-width: 100%; table-layout: auto; color: var(--color-text-dim); font-size: 12.5px; } th, td { padding: 6px 10px; text-align: left; white-space: nowrap; } th:first-child, td:first-child { padding-left: 4px; } th:last-child, td:last-child { padding-right: 4px; } th { position: sticky; top: 0; background: var(--color-surface); color: var(--color-text-muted); font-size: 10px; } td { font-family: var(--font-mono); } tr:last-child td { border-bottom: 0; } .clickable { cursor: pointer; } .clickable:hover td { color: var(--color-text); background: color-mix(in srgb, var(--color-text) 4%, transparent); } tfoot td { color: var(--color-text); font-weight: 600; } .gain { color: var(--color-gain); } .loss { color: var(--color-loss); } .accent { color: var(--color-accent); } .muted { color: var(--color-text-muted); }
  @media (max-width: 620px) { th, td { padding-block: 7px; } }
</style>
