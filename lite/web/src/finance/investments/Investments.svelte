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

  $: visible = activeClass === "all" ? positions : positions.filter((p) => p.class === activeClass);

  const columns = [
    { key: "label", label: "Symbol" },
    { key: "class", label: "Class" },
    { key: "quantity", label: "Qty" },
    { key: "native", label: "Native" },
    { key: "valueINR", label: "Value (₹)" },
    { key: "day", label: "Day" },
  ];

  $: rows = visible.map((p) => ({
    label: p.label,
    class: ASSET_CLASS_LABELS[p.class],
    quantity: p.quantity ? p.quantity.toLocaleString() : "—",
    native: p.nativeValue ? money(p.nativeValue, p.currency) : "—",
    valueINR: money(p.valueINR, "INR"),
    day: p.dayPct === null ? "—" : formatPercent(p.dayPct),
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
  <TabBar {tabs} value={activeClass} onChange={selectClass} />

  {#if loading}
    <p class="muted">Loading…</p>
  {:else if error}
    <p class="error">{error}</p>
  {:else if rows.length === 0}
    <p class="muted">No positions in this class yet.</p>
  {:else}
    <DataTable {columns} rows={rows} onRowClick={rows.some((r) => r.__symbol) ? onRowClick : undefined} />
  {/if}
</div>

<style>
  .investments { display: grid; gap: var(--space-4); }
  .muted { color: var(--color-text-muted); }
  .error { color: var(--color-loss); }
</style>
