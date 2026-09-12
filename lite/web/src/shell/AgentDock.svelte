<script lang="ts">
  import { onMount } from "svelte";

  export let placeholder = "Ask about this page";
  let open = true;
  onMount(() => {
    const toggle = () => (open = !open);
    document.addEventListener("openterminal-toggle-agent", toggle);
    return () => document.removeEventListener("openterminal-toggle-agent", toggle);
  });
</script>

{#if open}
  <aside class="dock" aria-label="Agent dock">
    <div class="heading"><span>Agent</span><span class="context">sees this page</span><button type="button" aria-label="Close agent panel" on:click={() => (open = false)}>×</button></div>
    <div class="transcript">
      <p>Context follows the page you are viewing.</p>
      <div class="message user">Ask about this page, holdings, or a proposed write.</div>
      <div class="message">The agent can explain figures and prepare changes for review. Nothing writes to the ledger without approval.</div>
    </div>
    <input aria-label={placeholder} placeholder={`${placeholder}…`} />
  </aside>
{/if}

<style>
  .dock { width: 296px; min-width: 296px; display: flex; flex-direction: column; gap: var(--space-4); padding: 10px 13px; background: var(--color-surface); border-left: 1px solid var(--color-border); color: var(--color-text); }
  .heading { display:flex; align-items:center; gap:8px; padding-bottom:9px; box-shadow: inset 0 -1px 0 var(--color-divider); color: var(--color-text-dim); font-size: 0.8rem; font-weight: 600; } .context { margin-left:auto; color: var(--color-text-faint); font: 10px var(--font-mono); font-weight:400; } .heading button { border:0; background:transparent; color:var(--color-text-muted); cursor:pointer; font-size:16px; line-height:1; }
  .transcript { flex: 1; min-height: 0; overflow-y: auto; display:flex; flex-direction:column; gap:11px; font-size:12px; line-height:1.5; } .transcript p { margin:0; color:var(--color-text-faint); } .message { padding:8px 9px; border-radius:8px 8px 8px 2px; background:var(--color-bg); } .message.user { align-self:flex-end; border-radius:8px 8px 2px 8px; background:var(--color-surface-raised, var(--color-surface)); }
  input { width: 100%; min-height: 30px; padding: 6px 9px; border: 1px solid var(--color-border); border-radius: var(--radius-md); outline: none; background: var(--color-bg); color: var(--color-text); }
  input:focus { border-color: var(--color-accent); }
  @media (max-width: 1080px) { .dock { width: 220px; min-width: 220px; padding: var(--space-4); } }
  @media (max-width: 820px) { .dock { display: none; } }
</style>
