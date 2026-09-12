<script lang="ts">
  export interface Proposal {
    title: string;
    description?: string;
    source?: string;
    confidence?: number;
    parsed?: string;
    raw?: string;
    writes?: string;
    status?: string;
  }
  export let proposal: Proposal;
  export let onApprove: (() => void) | undefined = undefined;
  export let onEdit: (() => void) | undefined = undefined;
  export let onReject: (() => void) | undefined = undefined;
  export let onInspect: (() => void) | undefined = undefined;
  $: fallbackParts = proposal.title.split(" → ");
  $: source = proposal.source ?? fallbackParts[0];
  $: title = fallbackParts.length > 1 ? fallbackParts.slice(1).join(" → ") : proposal.title;
</script>

<article class="proposal">
  <div class="proposal-main">
    <header>
      <div class="source">{source}</div>
      <strong>{title}</strong>
      {#if proposal.confidence !== undefined}<span class="confidence">{Math.round(proposal.confidence * 100)}% confidence</span>{/if}
      {#if proposal.status}<span class="status">{proposal.status}</span>{/if}
    </header>
    {#if proposal.description}<p>{proposal.description}</p>{/if}
    {#if proposal.writes}<div class="writes">{proposal.writes}</div>{/if}
  </div>
  {#if onApprove || onEdit || onReject || onInspect}
    <footer>{#if onInspect}<button on:click={() => onInspect?.()}>Inspect</button>{/if}{#if onApprove}<button class="primary" on:click={() => onApprove?.()}>Approve</button>{/if}{#if onEdit}<button on:click={() => onEdit?.()}>Edit</button>{/if}{#if onReject}<button class="reject" on:click={() => onReject?.()}>Reject</button>{/if}</footer>
  {/if}
</article>
<style>
  .proposal { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12px; padding: 11px 13px; color: var(--color-text); border-radius: var(--radius-md); background: color-mix(in srgb, var(--color-surface) 80%, var(--color-bg)); box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-text) 6%, transparent); }
  .proposal-main { min-width: 0; } header, footer { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; } header strong { flex: 1; min-width: 0; font-size: 13px; font-weight: 500; } .source { width: 42px; flex: none; color: var(--color-accent-600, var(--color-accent)); font-size: 9px; letter-spacing: .08em; text-transform: uppercase; } .status, .confidence { color: var(--color-text-muted); font-size: 10px; } .confidence { padding: 1px 7px; border-radius: var(--radius-sm); background: var(--color-accent-800, color-mix(in srgb, var(--color-accent) 25%, transparent)); color: var(--color-accent-100, var(--color-accent)); } p, .writes { margin-top: 6px; font-size: 10.5px; overflow-wrap: anywhere; } .writes { color: var(--color-text-faint); font-family: var(--font-mono); } p { color: var(--color-text-muted); font-family: var(--font-mono); } footer { flex-direction: column; align-items: stretch; margin-top: 0; } button { min-width: 82px; padding: 4px 9px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: transparent; color: var(--color-text-dim); cursor: pointer; font: 11px var(--font-body); } button:hover { border-color: var(--color-accent); color: var(--color-text); } button.primary { border-color: var(--color-accent); color: var(--color-accent); } button.reject:hover { border-color: var(--color-loss); color: var(--color-loss); }
  @media (max-width: 560px) { .proposal { grid-template-columns: 1fr; gap: 9px; } footer { flex-direction: row; justify-content: flex-end; } }
</style>
