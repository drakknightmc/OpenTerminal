<script lang="ts">
  import type { Proposal } from "../finance/types";

  export let proposal: Proposal | null = null;
  export let onClose: () => void;
  export let onApprove: (() => void) | undefined = undefined;
  export let onReject: (() => void) | undefined = undefined;

  function objectFromJSON(value: string | undefined): Record<string, unknown> {
    if (!value) return {};
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
    } catch { return {}; }
  }

  $: parsed = objectFromJSON(proposal?.parsedJson);
  $: writes = objectFromJSON(proposal?.writesJson);
  $: hasWrites = Object.keys(writes).length > 0;
  $: attachments = Array.isArray(parsed.attachments) ? parsed.attachments : [];

  function closeFromBackdrop(event: MouseEvent) {
    if (event.target === event.currentTarget) onClose();
  }
</script>

{#if proposal}
  <div class="backdrop" role="presentation" on:click={closeFromBackdrop}>
    <section class="detail" role="dialog" aria-modal="true" aria-label="Proposal preview">
      <header class="detail-header">
        <div><span class="eyebrow">PROPOSAL {proposal.id}</span><h2>{proposal.source}</h2><p>{proposal.targetSection} · received {new Date(proposal.receivedAt).toLocaleString()}</p></div>
        <button class="close" aria-label="Close preview" on:click={onClose}>×</button>
      </header>

      <div class="facts"><span class="pill">{proposal.status}</span><span class="pill">{Math.round(proposal.confidence * 100)}% confidence</span>{#if parsed.docType}<span class="pill">{String(parsed.docType)}</span>{/if}</div>

      {#if parsed.parseError}
        <section class="warning"><strong>PDF parsing failed</strong><p>{String(parsed.parseError)}</p><small>The message was stored with this proposal; no ledger write can be previewed until the document is parsed.</small></section>
      {:else}
        <section class="section"><h3>Extracted data</h3><pre>{JSON.stringify(parsed, null, 2)}</pre></section>
      {/if}

      <section class="section"><h3>Ledger writes</h3>
        {#if hasWrites}<pre>{JSON.stringify(writes, null, 2)}</pre>
        {:else}<div class="empty"><strong>No ledger writes recorded</strong><span>{proposal.status === "applied" ? "This item is marked applied, but the current backend recorded no ledger mutation." : "This proposal is metadata-only until a connector produces structured writes."}</span></div>{/if}
      </section>

      {#if attachments.length}<section class="section"><h3>Attachments</h3><div class="attachments">{#each attachments as attachment}<span>{String(attachment)}</span>{/each}</div></section>{/if}
      {#if parsed.snippet}<section class="section"><h3>Message excerpt</h3><pre class="snippet">{String(parsed.snippet)}</pre></section>{/if}
      {#if proposal.status === "pending"}<footer><button class="reject" on:click={onReject}>Reject</button><button class="approve" on:click={onApprove}>Approve</button></footer>{/if}
    </section>
  </div>
{/if}

<style>
  .backdrop { position: fixed; inset: 0; z-index: 20; display: grid; place-items: center; padding: 18px; background: color-mix(in srgb, #000 62%, transparent); }
  .detail { width: min(720px, 100%); max-height: min(820px, 92vh); overflow: auto; padding: 18px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-bg); box-shadow: 0 20px 70px #0008; }
  .detail-header { display: flex; justify-content: space-between; gap: 12px; } .eyebrow { color: var(--color-accent); font: 10px var(--font-mono); letter-spacing: .1em; } h2 { margin: 5px 0 3px; font-size: 20px; } p, small, .empty span { color: var(--color-text-muted); font-size: 11px; } .close { border: 0; background: transparent; color: var(--color-text-muted); font-size: 24px; cursor: pointer; } .facts { display: flex; gap: 6px; margin: 16px 0; flex-wrap: wrap; } .pill { padding: 3px 8px; border: 1px solid var(--color-border); border-radius: 99px; color: var(--color-text-muted); font: 10px var(--font-mono); } .section { margin-top: 15px; } h3 { margin: 0 0 6px; color: var(--color-text-dim); font-size: 11px; text-transform: uppercase; letter-spacing: .08em; } pre { max-height: 220px; overflow: auto; margin: 0; padding: 10px; border-radius: var(--radius-sm); background: var(--color-surface); color: var(--color-text-dim); font: 10px/1.45 var(--font-mono); white-space: pre-wrap; overflow-wrap: anywhere; } .snippet { max-height: 150px; } .warning { padding: 11px; border-left: 3px solid var(--color-loss); background: color-mix(in srgb, var(--color-loss) 9%, var(--color-surface)); } .warning strong { color: var(--color-loss); font-size: 12px; } .warning p { margin: 6px 0; color: var(--color-text-dim); font-family: var(--font-mono); } .warning small { display: block; line-height: 1.4; } .empty { display: grid; gap: 5px; padding: 13px; border: 1px dashed var(--color-border); color: var(--color-text-dim); } .empty strong { font-size: 12px; } .attachments { display: grid; gap: 5px; color: var(--color-text-muted); font: 10px var(--font-mono); } footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 18px; } footer button { padding: 6px 14px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: transparent; color: var(--color-text-dim); cursor: pointer; } .approve { border-color: var(--color-accent); color: var(--color-accent); } .reject:hover { border-color: var(--color-loss); color: var(--color-loss); }
</style>
