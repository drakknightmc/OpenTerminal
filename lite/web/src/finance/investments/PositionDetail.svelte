<script lang="ts">
  import { onMount } from "svelte";
  import { fetchAPI } from "../../lib/api";
  import { money, formatPercent } from "../../lib/format";
  import StatList from "../../components/StatList.svelte";
  import SectionPanel from "../../components/SectionPanel.svelte";
  import { ASSET_CLASS_LABELS, type Position } from "../types";

  export let symbol: string;

  let position: Position | null = null;
  let error: string | null = null;
  let loading = true;

  async function load(sym: string) {
    loading = true;
    error = null;
    position = null;
    try {
      position = await fetchAPI<Position>(`/api/investments/${encodeURIComponent(sym)}`);
    } catch (err) {
      error = err && typeof err === "object" && "message" in err ? String((err as { message: unknown }).message) : "Position not found";
    } finally {
      loading = false;
    }
  }

  $: load(symbol);

  $: items = position
    ? [
        { k: "Class", v: ASSET_CLASS_LABELS[position.class] },
        { k: "Quantity", v: position.quantity ? position.quantity.toLocaleString() : "—" },
        { k: "Native value", v: money(position.nativeValue, position.currency) },
        { k: "Value (₹)", v: money(position.valueINR, "INR") },
        {
          k: "Day change",
          v: position.dayPct === null ? "—" : `${formatPercent(position.dayPct)} (${money(position.dayAbsINR, "INR")})`,
          tone: position.dayPct === null ? "muted" : position.dayPct >= 0 ? "gain" : "loss",
        },
        { k: "Source", v: position.live ? "Live quote" : "Last known price" },
      ]
    : [];
</script>

<div class="position-detail">
  <a href="/investments" class="back">← Investments</a>

  {#if loading}
    <p class="muted">Loading…</p>
  {:else if error}
    <p class="error">{error}</p>
  {:else if position}
    <h2>{position.label}</h2>
    <SectionPanel title="Position">
      <StatList {items} />
      <p class="note">
        Average-cost only for now — no lot-level purchase history is tracked yet by either the broker import or manual
        crypto entries.
      </p>
    </SectionPanel>
  {/if}
</div>

<style>
  .position-detail { display: grid; gap: var(--space-4); max-width: 520px; }
  .back { color: var(--color-text-muted); font-size: 0.8rem; text-decoration: none; }
  .back:hover { color: var(--color-text); }
  h2 { margin: 0; color: var(--color-text); font-family: var(--font-mono, monospace); }
  .muted { color: var(--color-text-muted); }
  .error { color: var(--color-loss); }
  .note { margin: var(--space-3) 0 0; color: var(--color-text-faint); font-size: 0.75rem; }
</style>
