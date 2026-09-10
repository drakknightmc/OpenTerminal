<script lang="ts">export let title = ""; export let actions = "";</script>
<section><header><h2>{title}</h2>{#if actions}<span>{actions}</span>{/if}</header><div class="body"><slot /></div></section>
<style>
  section { border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); } header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-4); border-bottom: 1px solid var(--color-border); } h2 { margin: 0; color: var(--color-text); font-size: .9rem; } header span { color: var(--color-text-muted); } .body { padding: var(--space-4); }
</style>
