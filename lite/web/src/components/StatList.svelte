<script lang="ts">
  export interface StatItem { k: string; v: string | number; tone?: "gain" | "loss" | "muted"; } export let items: StatItem[] = [];
</script>
<dl>{#each items as item}<div><dt>{item.k}</dt><dd class:item-gain={item.tone === "gain"} class:item-loss={item.tone === "loss"} class:item-muted={item.tone === "muted"}>{item.v}</dd></div>{/each}</dl>
<style>
  dl { display: grid; gap: var(--space-2); margin: 0; } div { display: flex; justify-content: space-between; gap: var(--space-4); } dt { color: var(--color-text-muted); } dd { margin: 0; color: var(--color-text); } .item-gain { color: var(--color-gain); } .item-loss { color: var(--color-loss); } .item-muted { color: var(--color-text-muted); }
</style>
