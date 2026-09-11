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
  let requestID = 0;

  const classLabels: Record<string, string> = {
    us_equity: "US equity", india_equity: "Indian equity", mutual_funds: "Mutual funds",
    crypto: "Crypto", fixed_income: "Fixed income", cash: "Cash",
  };

  async function load() {
    const request = ++requestID;
    loading = true;
    error = null;
    try {
      const response = await fetchAPI<{ snapshots: NetWorthSnapshot[] }>(`/api/networth/curve?range=${range}`);
      if (request === requestID) snapshots = response.snapshots;
    } catch (err) {
      if (request === requestID) error = err && typeof err === "object" && "message" in err ? String((err as { message: unknown }).message) : "Failed to load net worth history";
    } finally {
      if (request === requestID) loading = false;
    }
  }

  $: if (range) void load();

  $: points = snapshots.map((s) => s.totalINR);

  $: latest = snapshots[snapshots.length - 1] ?? null;
  $: balanceRows = latest ? (() => {
    try {
      const breakdown = JSON.parse(latest.breakdownJson) as Record<string, number>;
      return Object.entries(classLabels).map(([key, label]) => ({
        line: label,
        class: "Asset",
        closing: money(breakdown[key] ?? 0, "INR"),
        share: latest.totalINR ? `${((breakdown[key] ?? 0) / latest.totalINR * 100).toFixed(1)}%` : "—",
      }));
    } catch { return []; }
  })() : [];

  const columns = [
    { key: "date", label: "Date" },
    { key: "totalINR", label: "Net worth (₹)" },
    { key: "totalUSD", label: "Net worth ($)" },
  ];

  const balanceColumns = [
    { key: "line", label: "Line" }, { key: "class", label: "Class" },
    { key: "closing", label: "Closing" }, { key: "share", label: "Share" },
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
      <div class="chart">{#if points.length > 1}<AreaChart {points} width={720} height={220} />{:else}<div class="chart-empty">One close recorded · trend starts with the next close</div>{/if}</div>
    </SectionPanel>
    <SectionPanel title="Balance sheet" actions={`as of ${latest?.snapshotDate ?? "—"}`}>
      {#if balanceRows.length}<DataTable columns={balanceColumns} rows={balanceRows} totals={{ line: "Net worth", class: "Total", closing: money(latest?.totalINR ?? 0, "INR"), share: "100%" }} />{:else}<p class="muted">This snapshot has no class breakdown.</p>{/if}
    </SectionPanel>
    <SectionPanel title="Daily snapshots">
      <DataTable {columns} {rows} />
    </SectionPanel>
  {/if}
</div>

<style>
  .networth { display: grid; gap: 0; width: 100%; }
  .heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 18px; padding: 4px 0 16px; flex-wrap: wrap; }
  .eyebrow { color: var(--color-accent); font-size: 10px; letter-spacing: .1em; }
  h2 { margin: 3px 0 2px; font-size: 24px; } p { margin: 0; color: var(--color-text-muted); font-size: 12px; }
  .ranges { display: flex; gap: 3px; } .ranges button { padding: 5px 8px; border: 0; border-bottom: 2px solid transparent; background: transparent; color: var(--color-text-muted); cursor: pointer; font: 11px var(--font-mono); } .ranges button.active { border-color: var(--color-accent); color: var(--color-text); }
  .chart { overflow-x: auto; } .chart :global(svg) { display: block; width: 100%; min-width: 560px; } .chart-empty { display: grid; width: 100%; min-width: 0; height: 220px; padding: 0 16px; box-sizing: border-box; place-items: center; border-bottom: 1px solid var(--color-border); color: var(--color-text-faint); font: 11px var(--font-mono); line-height: 1.4; text-align: center; }
  .empty { padding: 24px 0; } .loading-state { display: flex; align-items: center; gap: 8px; padding: 12px 0; color: var(--color-text-muted); font: 12px var(--font-mono); } .pulse { width: 6px; height: 6px; border-radius: 50%; background: var(--color-accent); }
  .muted { color: var(--color-text-muted); }
  .error { color: var(--color-loss); }
</style>
