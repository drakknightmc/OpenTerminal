<script lang="ts">
  export let title = "Overview";
  export let baseCurrency = "USD";
  export let fxStatus = "FX pending";
  export let reviewCount = 0;
</script>

<header class="topbar">
  <h1>{title}</h1>
  <div class="meta"><span>{baseCurrency}</span><span>{fxStatus}</span><span class="review">Review queue <b>{reviewCount}</b></span></div>
</header>

<style>
  .topbar { height: 44px; flex: 0 0 44px; display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); padding: 0 var(--space-5); background: var(--color-surface); border-bottom: 1px solid var(--color-border); color: var(--color-text); }
  h1 { margin: 0; font-size: 0.95rem; font-weight: 600; }
  .meta { display: flex; align-items: center; gap: var(--space-4); color: var(--color-text-muted); font-size: 0.75rem; }
  .review { color: var(--color-text-dim); }
  b { display: inline-grid; min-width: 1.25rem; height: 1.25rem; place-items: center; margin-left: var(--space-1); border-radius: 99px; background: var(--color-accent); color: var(--color-bg); font-size: 0.7rem; }
</style>
