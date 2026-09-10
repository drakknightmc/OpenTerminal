<script lang="ts">
  import { fetchAPI } from "../../lib/api";
  import { money } from "../../lib/format";
  import AreaChart from "../../components/AreaChart.svelte";
  import DataTable from "../../components/DataTable.svelte";
  import SectionPanel from "../../components/SectionPanel.svelte";
  import type { NetWorthSnapshot } from "../types";

  let snapshots: NetWorthSnapshot[] = [];
  let error: string | null = null;
  let loading = true;
  let range = "1Y";

  async function load() {
    loading = true;
    error = null;
    try {
      snapshots = (await fetchAPI<{ snapshots: NetWorthSnapshot[] }>(`/api/networth/curve?range=${range}`)).snapshots;
    } catch (err) {
      error = err && typeof err === "object" && "message" in err ? String((err as { message: unknown }).message) : "Failed to load net worth history";
    } finally {
      loading = false;
    }
  }

  $: if (range) void load();

  $: points = snapshots.map((s) => s.totalINR);

  const columns = [
    { key: "date", label: "Date" },
    { key: "totalINR", label: "Net worth (₹)" },
    { key: "totalUSD", label: "Net worth ($)" },
  ];

  $: rows = [...snapshots]
    .reverse()
    .map((s) => ({ date: s.snapshotDate, totalINR: money(s.totalINR, "INR"), totalUSD: money(s.totalUSD, "USD") }));
</script>

<div class="networth">
  <div class="heading"><div><span class="eyebrow">BALANCE SHEET</span><h2>Net worth</h2><p>Auditable closing balances over time, in your base currency.</p></div><div class="ranges">{#each ["1M", "3M", "6M", "1Y"] as option}<button class:active={range === option} on:click={() => (range = option)}>{option}</button>{/each}</div></div>
  {#if loading}
    <div class="loading-state"><span class="pulse"></span><span>Loading balance history…</span></div>
  {:else if error}
    <p class="error">{error}</p>
  {:else if snapshots.length === 0}
    <p class="muted empty">
      No snapshots yet — the backend takes one automatically once a day. Check back tomorrow, or after a redeploy.
    </p>
  {:else}
    <SectionPanel title="Net worth curve" actions={`${snapshots.length} closes`}>
      <div class="chart"><AreaChart {points} width={720} height={220} /></div>
    </SectionPanel>
    <SectionPanel title="Daily snapshots">
      <DataTable {columns} {rows} />
    </SectionPanel>
  {/if}
</div>

<style>
  .networth { display: grid; gap: 0; max-width: 1000px; }
  .heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 18px; padding: 4px 0 16px; flex-wrap: wrap; }
  .eyebrow { color: var(--color-accent); font-size: 10px; letter-spacing: .1em; }
  h2 { margin: 3px 0 2px; font-size: 24px; } p { margin: 0; color: var(--color-text-muted); font-size: 12px; }
  .ranges { display: flex; gap: 3px; } .ranges button { padding: 5px 8px; border: 0; border-bottom: 2px solid transparent; background: transparent; color: var(--color-text-muted); cursor: pointer; font: 11px var(--font-mono); } .ranges button.active { border-color: var(--color-accent); color: var(--color-text); }
  .chart { overflow-x: auto; } .chart :global(svg) { display: block; width: 100%; min-width: 560px; }
  .empty { padding: 24px 0; } .loading-state { display: flex; align-items: center; gap: 8px; padding: 12px 0; color: var(--color-text-muted); font: 12px var(--font-mono); } .pulse { width: 6px; height: 6px; border-radius: 50%; background: var(--color-accent); }
  .muted { color: var(--color-text-muted); }
  .error { color: var(--color-loss); }
</style>
