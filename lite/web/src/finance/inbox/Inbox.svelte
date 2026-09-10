<script lang="ts">
  import { fetchAPI } from "../../lib/api";
  import TabBar from "../../components/TabBar.svelte";
  import ProposalCard from "../../components/ProposalCard.svelte";
  import type { Proposal } from "../types";

  let proposals: Proposal[] = [];
  let error: string | null = null;
  let loading = true;
  let status: "pending" | "applied" | "rejected" | "" = "pending";
  let source = "all";
  let approving = false;

  async function load() {
    loading = true;
    error = null;
    try {
      const query = status ? `?status=${status}` : "";
      proposals = (await fetchAPI<{ proposals: Proposal[] }>(`/api/proposals${query}`)).proposals;
    } catch (err) {
      error = err && typeof err === "object" && "message" in err ? String((err as { message: unknown }).message) : "Failed to load proposals";
    } finally {
      loading = false;
    }
  }

  $: status, load();
  $: sources = Array.from(new Set(proposals.map((proposal) => proposal.source))).sort();
  $: visible = source === "all" ? proposals : proposals.filter((proposal) => proposal.source === source);

  async function decide(id: number, action: "approve" | "reject") {
    try {
      await fetchAPI(`/api/proposals/${id}/${action}`, { method: "POST" });
      await load();
    } catch (err) {
      error = err && typeof err === "object" && "message" in err ? String((err as { message: unknown }).message) : `Failed to ${action}`;
    }
  }

  async function approveHighConfidence() {
    approving = true;
    const candidates = visible.filter((proposal) => proposal.status === "pending" && proposal.confidence >= 0.9);
    try {
      await Promise.all(candidates.map((proposal) => fetchAPI(`/api/proposals/${proposal.id}/approve`, { method: "POST" })));
      await load();
    } catch (err) {
      error = err && typeof err === "object" && "message" in err ? String((err as { message: unknown }).message) : "Failed to approve proposals";
    } finally { approving = false; }
  }

  function selectStatus(value: string) {
    status = value as typeof status;
  }

  const tabs = [
    { label: "Pending", value: "pending" },
    { label: "Applied", value: "applied" },
    { label: "Rejected", value: "rejected" },
    { label: "All", value: "" },
  ];

  function describe(p: Proposal): { title: string; description: string } {
    const confidencePct = `${Math.round(p.confidence * 100)}% confidence`;
    return {
      title: `${p.source} → ${p.targetSection}`,
      description: `${confidencePct} · received ${new Date(p.receivedAt).toLocaleString()}${p.parsedJson ? ` · ${p.parsedJson}` : ""}`,
    };
  }
</script>

<div class="inbox">
  <div class="heading"><div><span class="eyebrow">CONTROL PLANE</span><h2>Review queue</h2><p>Every agent write lands here before it touches the ledger.</p></div><button class="btn btn-secondary" disabled={approving || !visible.some((proposal) => proposal.confidence >= .9)} on:click={approveHighConfidence}>{approving ? "Approving…" : "Approve high-confidence"}</button></div>
  <div class="filters"><TabBar {tabs} value={status} onChange={selectStatus} /><div class="sources"><button class:active={source === "all"} on:click={() => (source = "all")}>All sources <small>{proposals.length}</small></button>{#each sources as connector}<button class:active={source === connector} on:click={() => (source = connector)}>{connector} <small>{proposals.filter((proposal) => proposal.source === connector).length}</small></button>{/each}</div><span class="filter-spacer"></span><span class="tag tag-accent">{status || "all"} {visible.length}</span></div>

  {#if loading}
    <p class="muted">Loading…</p>
  {:else if error}
    <p class="error">{error}</p>
  {:else if visible.length === 0}
    <p class="muted">Nothing here. Connectors haven't written any proposals yet.</p>
  {:else}
    <div class="list">
      {#each visible as proposal (proposal.id)}
        {@const info = describe(proposal)}
        <ProposalCard
          proposal={{ title: info.title, source: proposal.source, confidence: proposal.confidence, parsed: proposal.parsedJson, raw: proposal.raw, writes: proposal.writesJson, description: info.description, status: proposal.status }}
          onApprove={proposal.status === "pending" ? () => decide(proposal.id, "approve") : undefined}
          onReject={proposal.status === "pending" ? () => decide(proposal.id, "reject") : undefined}
        />
      {/each}
    </div>
  {/if}
</div>

<style>
  .inbox { display: grid; gap: 0; max-width: 1000px; }
  .heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 18px; padding: 4px 0 14px; flex-wrap: wrap; }
  .eyebrow { color: var(--color-accent); font-size: 10px; letter-spacing: .1em; } h2 { margin: 3px 0 2px; font-size: 24px; } p { margin: 0; color: var(--color-text-muted); font-size: 12px; }
  .btn { min-height: 28px; padding: 4px 10px; } .btn:disabled { opacity: .45; cursor: not-allowed; }
  .filters { display: flex; align-items: flex-end; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; } .filter-spacer { flex: 1; } .sources { display: flex; gap: 4px; overflow-x: auto; max-width: 100%; } .sources button { padding: 3px 8px; border: 1px solid transparent; border-radius: 6px; background: transparent; color: var(--color-text-muted); cursor: pointer; font: 10px var(--font-body); white-space: nowrap; } .sources button:hover, .sources button.active { border-color: var(--color-accent); color: var(--color-text); } .sources small { margin-left: 3px; color: var(--color-text-faint); font: 10px var(--font-mono); } .tag { padding: 3px 9px; border-radius: 6px; font-size: 10px; } .tag-accent { background: var(--color-accent-800, color-mix(in srgb, var(--color-accent) 25%, transparent)); color: var(--color-accent-100, var(--color-accent)); }
  .list { display: grid; gap: var(--space-3); }
  .muted { color: var(--color-text-muted); }
  .error { color: var(--color-loss); }
</style>
