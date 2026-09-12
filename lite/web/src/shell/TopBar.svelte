<script lang="ts">
  import { onMount } from "svelte";
  import { pendingReviewCount, refreshPendingReviewCount } from "../finance/reviewStore";
  import ThemePicker from "./ThemePicker.svelte";

  export let title = "Overview";
  export let baseCurrency = "INR";
  export let fxStatus = "83.12";
  export let reviewCount = 0;
  $: pending = $pendingReviewCount || reviewCount;
  function openPalette() { document.dispatchEvent(new Event("openterminal-open-command-palette")); }
  function toggleAgent() { document.dispatchEvent(new Event("openterminal-toggle-agent")); }
  onMount(() => { void refreshPendingReviewCount(); });
</script>

<header class="topbar">
  <h1>{title}</h1>
  <span class="subtitle">all accounts · {baseCurrency}</span>
  <button class="search" type="button" title="Search (⌘K)" on:click={openPalette}><span>Search holdings, merchants, statements…</span><kbd>⌘K</kbd></button>
  <div class="meta"><span>base <strong>{baseCurrency}</strong></span><span>fx <strong>{fxStatus}</strong></span><span class="market-live">NSE ●</span><span class="market-idle">NYSE ○</span><a class="review" href="/inbox">Review <b>{pending}</b></a><button class="agent btn btn-secondary" type="button" aria-label="Toggle agent panel" on:click={toggleAgent}>Agent</button><ThemePicker /></div>
</header>

<style>
  .topbar { height: 44px; flex: 0 0 44px; display: flex; align-items: center; gap: 14px; padding: 0 16px; background: color-mix(in srgb, var(--color-surface) 72%, var(--color-bg)); box-shadow: inset 0 -1px 0 var(--color-divider); color: var(--color-text); }
  h1 { flex: none; margin: 0; font-size: 13px; font-weight: 500; white-space: nowrap; } .subtitle { min-width: 0; overflow: hidden; color: var(--color-text-muted); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
  .search { display: flex; align-items: center; gap: 8px; flex: 1 1 auto; min-width: 100px; max-width: 320px; height: 28px; padding: 0 9px; overflow: hidden; border: 1px solid var(--color-divider); border-radius: var(--radius-md); background: var(--color-surface); color: var(--color-text-muted); cursor: pointer; font: 11.5px var(--font-body); text-align: left; } .search span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } kbd { color: var(--color-text-faint); font: 10px var(--font-mono); }
  .meta { display: flex; align-items: center; gap: 14px; margin-left: auto; color: var(--color-text-muted); font-size: 11px; white-space: nowrap; } .meta strong { color: var(--color-text); font: 11px var(--font-mono); } .market-live { color: var(--color-gain); } .market-idle { color: var(--color-text-muted); } .review { color: var(--color-text-dim); text-decoration: none; } .review:hover { color: var(--color-text); } .agent { min-height: 27px; padding: 0 10px; font-size: 11.5px; }
  b { display: inline-grid; min-width: 20px; height: 20px; place-items: center; margin-left: 4px; border-radius: 20px; background: var(--color-accent); color: var(--color-bg); font: 600 10px var(--font-mono); }
  @media (max-width: 1050px) { .subtitle, .market-idle { display: none; } } @media (max-width: 760px) { .topbar { padding-inline: 10px; gap: 8px; } .search { max-width: 180px; } .meta > span { display: none; } .meta { gap: 6px; } } @media (max-width: 500px) { .search { display: none; } h1 { font-size: 12px; } .review { font-size: 0; } .review b { font-size: 10px; } .agent { display: none; } }
</style>
