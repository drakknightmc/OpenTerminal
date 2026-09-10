<script lang="ts">
  export let columns: Array<{ key: string; label: string; align?: "left" | "right" | "center" }> = [];
  export let rows: Array<Record<string, unknown>> = [];
  export let totals: Record<string, unknown> | undefined = undefined;
  export let onRowClick: ((row: Record<string, unknown>) => void) | undefined = undefined;
</script>

<div class="table-wrap"><table class="table"><thead><tr>{#each columns as column}<th style={`text-align:${column.align ?? "left"}`}>{column.label}</th>{/each}</tr></thead><tbody>{#each rows as row}<tr class:clickable={onRowClick} on:click={() => onRowClick?.(row)}>{#each columns as column}<td style={`text-align:${column.align ?? "left"}`}>{row[column.key] ?? "—"}</td>{/each}</tr>{/each}</tbody>{#if totals}<tfoot><tr>{#each columns as column}<td style={`text-align:${column.align ?? "left"}`}>{totals[column.key] ?? ""}</td>{/each}</tr></tfoot>{/if}</table></div>
<style>
  .table-wrap { overflow: auto; } table { min-width: 100%; color: var(--color-text-dim); font-size: 12.5px; } th, td { padding: 5px 8px; text-align: left; white-space: nowrap; } th:first-child, td:first-child { padding-left: 0; } th:last-child, td:last-child { padding-right: 0; } th { position: sticky; top: 0; background: var(--color-surface); color: var(--color-text-muted); font-size: 10px; } td { font-family: var(--font-mono); } tr:last-child td { border-bottom: 0; } .clickable { cursor: pointer; } .clickable:hover td { color: var(--color-text); background: color-mix(in srgb, var(--color-text) 4%, transparent); } tfoot td { color: var(--color-text); font-weight: 600; }
  @media (max-width: 620px) { th, td { padding-block: 7px; } }
</style>
