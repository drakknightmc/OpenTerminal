<script lang="ts">
  import { onMount } from "svelte";
  import { fetchAPI } from "../../lib/api";
  import { money, formatPercent } from "../../lib/format";
  import StatTile from "../../components/StatTile.svelte";
  import DataTable from "../../components/DataTable.svelte";
  import ProposalCard from "../../components/ProposalCard.svelte";
  import SectionPanel from "../../components/SectionPanel.svelte";
  import AreaChart from "../../components/AreaChart.svelte";
  import { navigate } from "../../lib/router";
  import type { Overview } from "../types";

  let overview: Overview | null = null;
  let error: string | null = null;
  let loading = true;
  let snapshots: Array<{ totalINR: number }> = [];

  async function load() {
    loading = true;
    error = null;
    try {
      const [overviewResponse, curveResponse] = await Promise.all([
        fetchAPI<Overview>("/api/overview"),
        fetchAPI<{ snapshots: Array<{ totalINR: number }> }>("/api/networth/curve?range=1Y"),
      ]);
      overview = overviewResponse;
      snapshots = curveResponse.snapshots;
    } catch (err) {
      error = err && typeof err === "object" && "message" in err ? String((err as { message: unknown }).message) : "Failed to load overview";
    } finally {
      loading = false;
    }
  }

  onMount(load);

  const moverColumns = [
    { key: "symbol", label: "Symbol" },
    { key: "day", label: "Day" },
    { key: "contribution", label: "Contribution", align: "right" as const },
  ];

  $: moverRows = (overview?.movers ?? []).map((m) => ({
    symbol: m.label || m.symbol,
    name: m.label || m.symbol,
    day: { text: formatPercent(m.dayPct), tone: m.dayPct >= 0 ? "gain" : "loss" },
    contribution: { text: money(m.dayAbsINR, "INR"), tone: m.dayAbsINR >= 0 ? "gain" : "loss" },
  }));
</script>

<div class="overview">
  {#if loading}
    <div class="loading-state"><span class="pulse"></span><span>Loading your position snapshot…</span></div>
  {:else if error}
    <p class="error">{error}</p>
  {:else if overview}
    <section class="hero">
      <div class="hero-copy"><span class="label">Net worth</span><strong class="value">{money(overview.netWorthINR, "INR")}</strong>
      <div class="sub">
        <span class:gain={overview.dayChangeINR > 0} class:loss={overview.dayChangeINR < 0}>
          {overview.dayChangeINR >= 0 ? "+" : ""}{money(overview.dayChangeINR, "INR")} today · {formatPercent(overview.dayChangePct)}
        </span>
        <span class="muted">{money(overview.netWorthUSD, "USD")}</span>
        <span class="muted">XIRR —</span>
      </div>
      </div>
      <div class="curve" aria-label="Net worth history">
        {#if snapshots.length}<AreaChart points={snapshots.map((snapshot) => snapshot.totalINR)} width={560} height={76} />{:else}<div class="curve-empty">No closing snapshots yet</div>{/if}
        <div class="curve-labels"><span>1Y ago</span><span>6M</span><span>3M</span><span>today</span></div>
      </div>
    </section>

    <div class="tiles">
      {#each overview.sleeves as sleeve (sleeve.class)}
        <StatTile
          label={sleeve.label}
          value={money(sleeve.valueINR, "INR")}
          weight={`${(sleeve.weight * 100).toFixed(1)}%`}
          sub={`${sleeve.dayPct === null ? "—" : formatPercent(sleeve.dayPct)} · ${sleeve.native}`}
          bar={sleeve.weight * 100}
          onClick={() => navigate("/investments")}
        />
      {/each}
    </div>

    <div class="lower">
          <SectionPanel title="Today's movers" actions="by contribution to net worth">
        {#if moverRows.length === 0}
          <p class="muted">No marked positions yet.</p>
        {:else}
          <DataTable columns={[...moverColumns.slice(0, 1), { key: "name", label: "Name" }, ...moverColumns.slice(1)]} rows={moverRows} />
        {/if}
      </SectionPanel>

      <SectionPanel title="Needs review" actions={overview.reviewPeek.length ? `${overview.reviewPeek.length} pending` : ""}>
        {#if overview.reviewPeek.length === 0}
          <p class="muted">Nothing waiting on you.</p>
        {:else}
          <div class="proposals">
            {#each overview.reviewPeek as proposal (proposal.id)}
              <ProposalCard proposal={{ title: `${proposal.source} → ${proposal.targetSection}`, source: proposal.source, confidence: proposal.confidence, parsed: proposal.parsedJson, raw: proposal.raw, writes: proposal.writesJson, description: `received ${new Date(proposal.receivedAt).toLocaleString()}`, status: proposal.status }} />
            {/each}
          </div>
        {/if}
        <a href="/inbox" class="review-link">Open review queue →</a>
      </SectionPanel>
    </div>
  {/if}
</div>

<style>
  .overview { display: grid; gap: var(--space-6); max-width: 1180px; }
  .hero { display: flex; align-items: flex-end; gap: 28px; flex-wrap: wrap; }
  .hero-copy { min-width: 260px; }
  .hero .label { display: block; margin-bottom: 4px; color: var(--color-text-muted); font-size: 10px; letter-spacing: .12em; text-transform: uppercase; }
  .hero .value { display: block; color: var(--color-text); font: 500 40px/1 var(--font-mono); letter-spacing: -.02em; }
  .hero .sub { display: flex; gap: 16px; margin-top: 9px; color: var(--color-gain); font: 12px var(--font-mono); flex-wrap: wrap; }
  .gain { color: var(--color-gain); }
  .loss { color: var(--color-loss); }
  .muted { color: var(--color-text-muted); }
  .error { color: var(--color-loss); }
  .curve { flex: 1 1 360px; max-width: 560px; min-width: 260px; }
  .curve :global(svg) { display: block; width: 100%; height: 76px; }
  .curve-labels { display: flex; justify-content: space-between; color: var(--color-text-faint); font: 9.5px var(--font-mono); }
  .curve-empty { display: grid; place-items: center; height: 76px; border-bottom: 1px solid var(--color-border); color: var(--color-text-faint); font-size: 11px; }
  .tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(196px, 1fr)); gap: 10px; }
  .lower { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr); gap: 14px; align-items: start; }
  .proposals { display: grid; gap: var(--space-3); }
  .review-link { display: inline-block; margin-top: var(--space-3); color: var(--color-accent); font-size: 0.85rem; text-decoration: none; }
  .review-link:hover { text-decoration: underline; }

  .loading-state { display: flex; align-items: center; gap: 8px; color: var(--color-text-muted); font: 12px var(--font-mono); }
  .pulse { width: 6px; height: 6px; border-radius: 50%; background: var(--color-accent); box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-accent) 16%, transparent); }
  @media (max-width: 860px) {
    .lower { grid-template-columns: 1fr; }
  }
  @media (max-width: 520px) { .hero .value { font-size: 32px; } .hero .sub { gap: 9px; } }
</style>
