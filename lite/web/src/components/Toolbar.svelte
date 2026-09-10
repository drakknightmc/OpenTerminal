<script lang="ts">export let filter = ""; export let groupBy = "";</script>
<div class="toolbar"><input bind:value={filter} placeholder="Filter" aria-label="Filter" /><select bind:value={groupBy} aria-label="Group by"><option value="">Group by</option><slot name="group-options" /></select><div class="actions"><slot name="actions" /></div></div>
<style>
  .toolbar { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); } input, select { min-width: 0; padding: var(--space-2); border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: var(--color-bg); color: var(--color-text); } .actions { margin-left: auto; }
</style>
