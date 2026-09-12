<script lang="ts">
  import { onMount } from "svelte";
  import { fetchAPI } from "../../lib/api";
  import { money, formatPercent } from "../../lib/format";
  import TabBar from "../../components/TabBar.svelte";
  import DataTable from "../../components/DataTable.svelte";
  import { navigate } from "../../lib/router";
  import { ASSET_CLASS_LABELS, type AssetClass, type Position } from "../types";

  let positions: Position[] = [];
  let error: string | null = null;
  let loading = true;
  let activeClass: AssetClass | "all" = "all";
  let filter = "";

  async function load() {
    loading = true;
    error = null;
    try {
      positions = (await fetchAPI<{ positions: Position[] }>("/api/investments")).positions;
    } catch (err) {
      error = err && typeof err === "object" && "message" in err ? String((err as { message: unknown }).message) : "Failed to load investments";
    } finally {
      loading = false;
    }
  }

  onMount(load);

  const classOrder: AssetClass[] = ["us_equity", "india_equity", "mutual_funds", "crypto", "fixed_income", "cash"];

  $: tabs = [
    { label: "All", value: "all", count: positions.length },
    ...classOrder.map((c) => ({ label: ASSET_CLASS_LABELS[c], value: c, count: positions.filter((p) => p.class === c).length })),
  ];

  $: visible = (activeClass === "all" ? positions : positions.filter((p) => p.class === activeClass))
    .filter((p) => !filter.trim() || `${p.label} ${p.symbol}`.toLowerCase().includes(filter.trim().toLowerCase()));

  const columns = [
    { key: "label", label: "Instrument" },
    { key: "account", label: "Account" },
    { key: "quantity", label: "Qty", align: "right" as const },
    { key: "avgCost", label: "Avg cost", align: "right" as const },
    { key: "last", label: "Last", align: "right" as const },
    { key: "day", label: "Day", align: "right" as const },
    { key: "value", label: "Value", align: "right" as const },
    { key: "unrealised", label: "Unrealised", align: "right" as const },
    { key: "xirr", label: "XIRR", align: "right" as const },
    { key: "weight", label: "Wt", align: "right" as const },
  ];

  $: rows = visible.map((p) => ({
    label: p.label,
    account: p.account ?? ASSET_CLASS_LABELS[p.class],
    quantity: p.quantity ? p.quantity.toLocaleString() : "—",
    avgCost: p.avgCost !== null && p.avgCost !== undefined ? money(p.avgCost, p.currency) : "—",
    last: p.lastPrice !== null && p.lastPrice !== undefined && p.lastPrice !== 0 ? money(p.lastPrice, p.currency) : "—",
    day: p.dayPct === null ? "—" : { text: formatPercent(p.dayPct), tone: p.dayPct >= 0 ? "gain" : "loss" },
    value: money(p.valueINR, "INR"),
    unrealised: p.unrealisedINR !== null && p.unrealisedINR !== undefined ? { text: money(p.unrealisedINR, "INR"), tone: p.unrealisedINR >= 0 ? "gain" : "loss" } : "—",
    xirr: "—",
    weight: p.weight ? formatPercent(p.weight * 100, 1) : "—",
    __symbol: p.symbol,
  }));

  function onRowClick(row: Record<string, unknown>) {
    const symbol = row.__symbol as string;
    if (symbol) navigate(`/investments/${encodeURIComponent(symbol)}`);
  }

  function selectClass(value: string) {
    activeClass = (value as AssetClass | "all") ?? "all";
  }
</script>

<div class="investments">
  <div class="heading"><div><span class="eyebrow">POSITION LEDGER</span><h2>Investments</h2><p>Every marked position across your connected accounts.</p></div><div class="actions"><input bind:value={filter} placeholder="Filter…" aria-label="Filter investments" /><button class="btn btn-secondary" type="button">Group: asset class</button><button class="btn btn-primary" type="button">Add lot</button></div></div>
  <TabBar {tabs} value={activeClass} onChange={selectClass} />
  <div class="stats"><div><span>Positions</span><strong>{visible.length}</strong></div><div><span>Value (INR)</span><strong>{money(visible.reduce((total, position) => total + position.valueINR, 0), "INR")}</strong></div><div><span>Live marked</span><strong>{visible.filter((position) => position.live).length}/{visible.length}</strong></div><div><span>Day change</span><strong class:gain={visible.some((position) => (position.dayPct ?? 0) > 0)}>{money(visible.reduce((total, position) => total + position.dayAbsINR, 0), "INR")}</strong></div></div>

  {#if loading}
    <p class="muted">Loading…</p>
  {:else if error}
    <p class="error">{error}</p>
  {:else if rows.length === 0}
    <p class="muted">No positions in this class yet.</p>
  {:else}
    <DataTable {columns} rows={rows} tableKey="investments" onRowClick={rows.some((r) => r.__symbol) ? onRowClick : undefined} />
    <footer><span>{rows.length} positions shown</span><span>Prices <b>{visible.filter((position) => position.live).length ? "live" : "stored"}</b></span><span>Base <b>INR</b></span></footer>
  {/if}
</div>

<style>
  .investments { display: grid; gap: 0; min-width: 0; }
  .heading { display: flex; align-items: flex-end; gap: 18px; padding: 4px 0 14px; flex-wrap: wrap; }
  .heading > div:first-child { flex: 1; min-width: 220px; }
  .eyebrow { display: block; color: var(--color-accent); font-size: 10px; letter-spacing: .1em; }
  h2 { margin: 3px 0 2px; font-size: 24px; }
  p { margin: 0; color: var(--color-text-muted); font-size: 12px; }
  .actions { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
  input { width: 130px; min-height: 28px; padding: 4px 8px; border: 1px solid var(--color-divider); border-radius: var(--radius-md); background: var(--color-surface); color: var(--color-text); font: 11px var(--font-body); }
  .btn { min-height: 28px; padding: 4px 9px; }
  .stats { display: flex; align-items: stretch; gap: 0; overflow-x: auto; padding: 10px 0; margin: 0 0 8px; border-top: 1px solid var(--color-divider); border-bottom: 1px solid var(--color-divider); }
  .stats > div { min-width: 130px; padding: 0 15px; border-right: 1px solid var(--color-divider); white-space: nowrap; }
  .stats > div:first-child { padding-left: 0; } .stats > div:last-child { border-right: 0; }
  .stats span { display: block; color: var(--color-text-muted); font-size: 9.5px; letter-spacing: .09em; text-transform: uppercase; }
  .stats strong { display: block; margin-top: 3px; font: 14.5px var(--font-mono); }
  .gain { color: var(--color-gain); }
  .muted { color: var(--color-text-muted); }
  .error { color: var(--color-loss); }
  footer { display: flex; gap: 20px; padding: 9px 0; border-top: 1px solid var(--color-divider); color: var(--color-text-muted); font-size: 11px; } footer span:nth-child(2) { margin-left: auto; } footer b { color: var(--color-text); font: 11px var(--font-mono); font-weight: 400; }
  :global(.investments .table) { min-width: 1080px; }
  @media (max-width: 560px) { footer { gap: 10px; font-size: 10px; } }
</style>
