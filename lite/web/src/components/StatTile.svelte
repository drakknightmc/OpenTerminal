<script lang="ts">
  export let label = ""; export let value: string | number = "—"; export let sub = ""; export let bar: number | undefined = undefined; export let onClick: (() => void) | undefined = undefined;
</script>
<button class="tile card" class:interactive={onClick} on:click={() => onClick?.()}><span class="label">{label}</span><strong>{value}</strong>{#if sub}<small>{sub}</small>{/if}{#if bar !== undefined}<span class="track"><i style={`width:${Math.max(0, Math.min(100, bar))}%`} /></span>{/if}</button>
<style>
  .tile.card { display: grid; width: 100%; gap: 2px; padding: 11px 12px 10px; border: 0; color: var(--color-text); text-align: left; align-items: stretch; }
  .interactive { cursor: pointer; } .tile:hover { box-shadow: 0 0 0 1px var(--color-border-strong); }
  .label, small { color: var(--color-text-dim); font-size: 11.5px; } strong { margin-top: 3px; font: 20px var(--font-mono); letter-spacing: -.01em; } small { margin-top: 3px; color: var(--color-text-faint); font: 11px var(--font-mono); }
  .track { height: 2px; overflow: hidden; margin-top: 7px; background: color-mix(in srgb, var(--color-text) 8%, transparent); } i { display: block; height: 100%; background: var(--color-accent-600, var(--color-accent)); }
</style>
