<script lang="ts">export let title = ""; export let actions = "";</script>
<section class="panel"><header><h2>{title}</h2>{#if actions}<span class="actions">{actions}</span>{/if}</header><div class="body"><slot /></div></section>
<style>
  .panel { border: 0; border-radius: var(--radius-md); background: color-mix(in srgb, var(--color-surface) 88%, var(--color-bg)); box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-text) 7%, transparent); }
  header { display: flex; justify-content: space-between; align-items: baseline; gap: var(--space-3); padding: var(--space-4) var(--space-4) var(--space-3); }
  h2 { margin: 0; color: var(--color-text-dim); font-size: 13px; letter-spacing: .08em; text-transform: uppercase; }
  .actions { color: var(--color-text-faint); font: 11px var(--font-mono); }
  .body { padding: 0 var(--space-4) var(--space-4); }
</style>
