<script lang="ts">
  export let columns: Array<{ key: string; label: string }> = [];
  export let rows: Array<Record<string, unknown>> = [];
  export let totals: Record<string, unknown> | undefined = undefined;
  export let onRowClick: ((row: Record<string, unknown>) => void) | undefined = undefined;
</script>

<div class="table-wrap"><table><thead><tr>{#each columns as column}<th>{column.label}</th>{/each}</tr></thead><tbody>{#each rows as row}<tr class:clickable={onRowClick} on:click={() => onRowClick?.(row)}>{#each columns as column}<td>{row[column.key] ?? "—"}</td>{/each}</tr>{/each}</tbody>{#if totals}<tfoot><tr>{#each columns as column}<td>{totals[column.key] ?? ""}</td>{/each}</tr></tfoot>{/if}</table></div>
<style>
  .table-wrap { overflow: auto; border: 1px solid var(--color-border); border-radius: var(--radius-md); } table { width: 100%; border-collapse: collapse; color: var(--color-text-dim); font-size: .8rem; } th, td { padding: var(--space-3); border-bottom: 1px solid var(--color-border); text-align: left; white-space: nowrap; } th { position: sticky; top: 0; background: var(--color-surface-raised); color: var(--color-text-muted); font-size: .7rem; text-transform: uppercase; } tr:last-child td { border-bottom: 0; } .clickable { cursor: pointer; } .clickable:hover td { background: var(--color-surface-hover); color: var(--color-text); } tfoot td { background: var(--color-surface-raised); color: var(--color-text); font-weight: 600; }
</style>
