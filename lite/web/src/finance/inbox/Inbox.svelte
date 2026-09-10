<script lang="ts">
  import { onMount } from "svelte";
  import { fetchAPI } from "../../lib/api";
  import TabBar from "../../components/TabBar.svelte";
  import ProposalCard from "../../components/ProposalCard.svelte";
  import type { Proposal } from "../types";

  let proposals: Proposal[] = [];
  let error: string | null = null;
  let loading = true;
  let status: "pending" | "applied" | "rejected" | "" = "pending";

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

  onMount(load);
  $: status, load();

  async function decide(id: number, action: "approve" | "reject") {
    try {
      await fetchAPI(`/api/proposals/${id}/${action}`, { method: "POST" });
      await load();
    } catch (err) {
      error = err && typeof err === "object" && "message" in err ? String((err as { message: unknown }).message) : `Failed to ${action}`;
    }
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
  <TabBar {tabs} value={status} onChange={selectStatus} />

  {#if loading}
    <p class="muted">Loading…</p>
  {:else if error}
    <p class="error">{error}</p>
  {:else if proposals.length === 0}
    <p class="muted">Nothing here. Connectors haven't written any proposals yet.</p>
  {:else}
    <div class="list">
      {#each proposals as proposal (proposal.id)}
        {@const info = describe(proposal)}
        <ProposalCard
          proposal={{ title: info.title, description: info.description, status: proposal.status }}
          onApprove={proposal.status === "pending" ? () => decide(proposal.id, "approve") : undefined}
          onReject={proposal.status === "pending" ? () => decide(proposal.id, "reject") : undefined}
        />
      {/each}
    </div>
  {/if}
</div>

<style>
  .inbox { display: grid; gap: var(--space-4); }
  .list { display: grid; gap: var(--space-3); }
  .muted { color: var(--color-text-muted); }
  .error { color: var(--color-loss); }
</style>
