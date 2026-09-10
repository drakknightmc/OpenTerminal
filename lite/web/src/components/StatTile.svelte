<script lang="ts">
  export let label = ""; export let value: string | number = "—"; export let sub = ""; export let bar: number | undefined = undefined; export let onClick: (() => void) | undefined = undefined;
</script>
<button class="tile" class:interactive={onClick} on:click={() => onClick?.()}><span class="label">{label}</span><strong>{value}</strong>{#if sub}<small>{sub}</small>{/if}{#if bar !== undefined}<span class="track"><i style={`width:${Math.max(0, Math.min(100, bar))}%`} /></span>{/if}</button>
<style>
  .tile { display: grid; gap: var(--space-2); padding: var(--space-4); border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); color: var(--color-text); text-align: left; } .interactive { cursor: pointer; } .interactive:hover { background: var(--color-surface-hover); } .label, small { color: var(--color-text-muted); font-size: .75rem; } strong { font-size: 1.3rem; } .track { height: 3px; overflow: hidden; background: var(--color-border); } i { display: block; height: 100%; background: var(--color-accent); }
</style>
