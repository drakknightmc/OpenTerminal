<script lang="ts">
  import { onMount } from "svelte";
  import { fetchAPI } from "../../lib/api";
  import { money } from "../../lib/format";
  import AreaChart from "../../components/AreaChart.svelte";
  import DataTable from "../../components/DataTable.svelte";
  import SectionPanel from "../../components/SectionPanel.svelte";
  import type { NetWorthSnapshot } from "../types";

  let snapshots: NetWorthSnapshot[] = [];
  let error: string | null = null;
  let loading = true;

  async function load() {
    loading = true;
    error = null;
    try {
      snapshots = (await fetchAPI<{ snapshots: NetWorthSnapshot[] }>("/api/networth/curve?range=1Y")).snapshots;
    } catch (err) {
      error = err && typeof err === "object" && "message" in err ? String((err as { message: unknown }).message) : "Failed to load net worth history";
    } finally {
      loading = false;
    }
  }

  onMount(load);

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
  {#if loading}
    <p class="muted">Loading…</p>
  {:else if error}
    <p class="error">{error}</p>
  {:else if snapshots.length === 0}
    <p class="muted">
      No snapshots yet — the backend takes one automatically once a day. Check back tomorrow, or after a redeploy.
    </p>
  {:else}
    <SectionPanel title="Net worth curve">
      <AreaChart {points} width={720} height={200} />
    </SectionPanel>
    <SectionPanel title="Daily snapshots">
      <DataTable {columns} {rows} />
    </SectionPanel>
  {/if}
</div>

<style>
  .networth { display: grid; gap: var(--space-4); }
  .muted { color: var(--color-text-muted); }
  .error { color: var(--color-loss); }
</style>
