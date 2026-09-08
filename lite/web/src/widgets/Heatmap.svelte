<script lang="ts">
  import type { ScreenerRow } from "./Screener.svelte";

  export let rows: ScreenerRow[] = [];

  type SectorGroup = [string, ScreenerRow[]];

  $: sectorGroups = groupBySector(rows);

  // Integration stub for the future screener API route.
  async function fetchScreener(): Promise<ScreenerRow[]> {
    return [];
  }

  function groupBySector(screenerRows: ScreenerRow[]): SectorGroup[] {
    const groups = new Map<string, ScreenerRow[]>();

    for (const row of screenerRows) {
      const sector = row.sector.trim() || "Other";
      const group = groups.get(sector) ?? [];
      group.push(row);
      groups.set(sector, group);
    }

    return Array.from(groups.entries()).sort(([left], [right]) => left.localeCompare(right));
  }

  function marketCapSpan(marketCap: number): number {
    if (marketCap >= 10_000_000_000) return 4;
    if (marketCap >= 2_000_000_000) return 2;
    return 1;
  }

  function changeColor(changePercent: number): string {
    const change = Number.isFinite(changePercent) ? Math.max(-10, Math.min(10, changePercent)) : 0;
    const amount = Math.abs(change) / 10;
    const start = change < 0 ? [239, 68, 68] : [51, 65, 85];
    const end = change < 0 ? [51, 65, 85] : [34, 197, 94];
    const color = start.map((channel, index) => Math.round(channel + (end[index] - channel) * amount));
    return `rgb(${color.join(", ")})`;
  }

  function formatChange(changePercent: number): string {
    if (!Number.isFinite(changePercent)) return "--";
    return `${changePercent > 0 ? "+" : ""}${changePercent.toFixed(2)}%`;
  }
</script>

<section class="heatmap" aria-label="Market heatmap">
  <div class="heading">
    <div>
      <p class="eyebrow">MARKET MAP</p>
      <h2>Sector performance</h2>
    </div>
    <span class="count">{rows.length} stocks</span>
  </div>

  {#if sectorGroups.length === 0}
    <p class="empty">No screener data available.</p>
  {:else}
    <div class="sectors">
      {#each sectorGroups as [sector, sectorRows]}
        <section class="sector" aria-label={`${sector} stocks`}>
          <h3>{sector}<span>{sectorRows.length}</span></h3>
          <div class="cells">
            {#each sectorRows as row (row.symbol)}
              <article
                class="cell"
                style={`grid-column: span ${marketCapSpan(row.marketCap)}; background: ${changeColor(row.changePercent)};`}
                title={`${row.name} (${row.symbol})`}
              >
                <strong>{row.symbol}</strong>
                <span class="name">{row.name}</span>
                <span class="change">{formatChange(row.changePercent)}</span>
              </article>
            {/each}
          </div>
        </section>
      {/each}
    </div>
  {/if}
</section>

<style>
  .heatmap {
    --muted: #8b8b8b;
    width: 100%;
    box-sizing: border-box;
    padding: 1.25rem;
    background: #1a1a1a;
    border: 1px solid #333;
    color: #e0e0e0;
    font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  }

  .heading {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .eyebrow {
    margin: 0 0 0.25rem;
    color: var(--muted);
    font: 0.7rem/1.2 "Courier New", monospace;
    letter-spacing: 0.12em;
  }

  h2,
  h3 {
    margin: 0;
  }

  h2 {
    font-size: 1.35rem;
    font-weight: 600;
  }

  .count,
  h3 span {
    color: var(--muted);
    font: 0.8rem "Courier New", monospace;
  }

  .sectors {
    display: grid;
    gap: 1rem;
  }

  .sector {
    min-width: 0;
    padding: 0.8rem;
    border: 1px solid #333;
    background: #161616;
  }

  h3 {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.65rem;
    color: #c5c5c5;
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .cells {
    display: grid;
    grid-auto-rows: minmax(4.5rem, auto);
    grid-auto-flow: row dense;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    gap: 0.3rem;
  }

  .cell {
    display: flex;
    min-width: 0;
    min-height: 4.5rem;
    box-sizing: border-box;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;
    padding: 0.55rem;
    border: 1px solid rgb(255 255 255 / 10%);
    color: #fff;
    text-shadow: 0 1px 2px rgb(0 0 0 / 35%);
  }

  .cell strong,
  .change {
    font-family: "Courier New", monospace;
  }

  .cell strong {
    overflow: hidden;
    font-size: 0.82rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .name {
    overflow: hidden;
    margin-top: 0.15rem;
    font-size: 0.68rem;
    opacity: 0.78;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .change {
    margin-top: 0.3rem;
    font-size: 0.72rem;
    font-weight: 700;
  }

  .empty {
    margin: 0;
    padding: 2rem 1rem;
    border: 1px solid #333;
    color: var(--muted);
    text-align: center;
    font: 0.85rem "Courier New", monospace;
  }

  @media (max-width: 600px) {
    .heatmap {
      padding: 0.8rem;
    }

    .cells {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
</style>
