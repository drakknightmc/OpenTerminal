<script lang="ts">
  import { onMount } from "svelte";
  import { fetchAPI } from "../../lib/api";
  import { money, formatPercent } from "../../lib/format";
  import StatTile from "../../components/StatTile.svelte";
  import DataTable from "../../components/DataTable.svelte";
  import ProposalCard from "../../components/ProposalCard.svelte";
  import SectionPanel from "../../components/SectionPanel.svelte";
  import type { Overview } from "../types";

  let overview: Overview | null = null;
  let error: string | null = null;
  let loading = true;

  async function load() {
    loading = true;
    error = null;
    try {
      overview = await fetchAPI<Overview>("/api/overview");
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
    { key: "contribution", label: "Contribution" },
  ];

  $: moverRows = (overview?.movers ?? []).map((m) => ({
    symbol: m.label || m.symbol,
    day: formatPercent(m.dayPct),
    contribution: money(m.dayAbsINR, "INR"),
  }));
</script>

<div class="overview">
  {#if loading}
    <p class="muted">Loading…</p>
  {:else if error}
    <p class="error">{error}</p>
  {:else if overview}
    <section class="hero">
      <span class="label">Net worth</span>
      <strong class="value">{money(overview.netWorthINR, "INR")}</strong>
      <div class="sub">
        <span class:gain={overview.dayChangeINR > 0} class:loss={overview.dayChangeINR < 0}>
          {overview.dayChangeINR >= 0 ? "+" : ""}{money(overview.dayChangeINR, "INR")} today · {formatPercent(overview.dayChangePct)}
        </span>
        <span class="muted">{money(overview.netWorthUSD, "USD")}</span>
      </div>
    </section>

    <div class="tiles">
      {#each overview.sleeves as sleeve (sleeve.class)}
        <StatTile
          label={sleeve.label}
          value={money(sleeve.valueINR, "INR")}
          sub={`${(sleeve.weight * 100).toFixed(1)}% · ${sleeve.dayPct === null ? "—" : formatPercent(sleeve.dayPct)}`}
          bar={sleeve.weight * 100}
        />
      {/each}
    </div>

    <div class="lower">
      <SectionPanel title="Today's movers">
        {#if moverRows.length === 0}
          <p class="muted">No marked positions yet.</p>
        {:else}
          <DataTable columns={moverColumns} rows={moverRows} />
        {/if}
      </SectionPanel>

      <SectionPanel title="Needs review" actions={overview.reviewPeek.length ? `${overview.reviewPeek.length} pending` : ""}>
        {#if overview.reviewPeek.length === 0}
          <p class="muted">Nothing waiting on you.</p>
        {:else}
          <div class="proposals">
            {#each overview.reviewPeek as proposal (proposal.id)}
              <ProposalCard proposal={{ title: proposal.source, description: proposal.parsedJson, status: proposal.status }} />
            {/each}
          </div>
        {/if}
        <a href="/inbox" class="review-link">Open review queue →</a>
      </SectionPanel>
    </div>
  {/if}
</div>

<style>
  .overview { display: grid; gap: var(--space-6); }
  .hero { display: grid; gap: var(--space-2); }
  .hero .label { color: var(--color-text-muted); font-size: 0.8rem; }
  .hero .value { font-size: 2.2rem; font-weight: 700; color: var(--color-text); font-family: var(--font-mono, monospace); }
  .hero .sub { display: flex; gap: var(--space-4); font-size: 0.85rem; }
  .gain { color: var(--color-gain); }
  .loss { color: var(--color-loss); }
  .muted { color: var(--color-text-muted); }
  .error { color: var(--color-loss); }
  .tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--space-3); }
  .lower { display: grid; grid-template-columns: 1.6fr 1fr; gap: var(--space-4); align-items: start; }
  .proposals { display: grid; gap: var(--space-3); }
  .review-link { display: inline-block; margin-top: var(--space-3); color: var(--color-accent); font-size: 0.85rem; text-decoration: none; }
  .review-link:hover { text-decoration: underline; }

  @media (max-width: 860px) {
    .lower { grid-template-columns: 1fr; }
  }
</style>
