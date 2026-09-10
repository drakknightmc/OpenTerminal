<script lang="ts">
  export let abs = 0; export let pct: number | undefined = undefined; export let invert = false; const tone = () => (invert ? abs < 0 : abs > 0) ? "gain" : (invert ? abs > 0 : abs < 0) ? "loss" : "flat";
</script>
<span class={tone()}>{abs > 0 ? "+" : ""}{abs.toFixed(2)}{#if pct !== undefined} <small>({pct > 0 ? "+" : ""}{pct.toFixed(2)}%)</small>{/if}</span>
<style>
  span { color: var(--color-text-muted); } .gain { color: var(--color-gain); } .loss { color: var(--color-loss); } small { font-size: .75em; }
</style>
