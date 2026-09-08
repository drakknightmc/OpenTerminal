<script lang="ts">
  import { onMount } from "svelte";

  interface StatusResponse {
    ok: boolean;
    time: string;
  }

  let status: StatusResponse | null = null;
  let error: string | null = null;
  let loading = true;

  onMount(async () => {
    try {
      const res = await fetch("/api/status");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      status = await res.json();
    } catch (e) {
      error = e instanceof Error ? e.message : "Unknown error";
    } finally {
      loading = false;
    }
  });
</script>

<main>
  <div class="container">
    <h1>OpenTerminal Lite</h1>
    <div class="status-box">
      {#if loading}
        <p class="loading">Loading...</p>
      {:else if error}
        <p class="error">Error: {error}</p>
      {:else if status}
        <p class="success">✓ Backend connected</p>
        <div class="details">
          <div class="detail-row">
            <span class="label">Status:</span>
            <span class="value">{status.ok ? "OK" : "DOWN"}</span>
          </div>
          <div class="detail-row">
            <span class="label">Time:</span>
            <span class="value">{new Date(status.time).toLocaleString()}</span>
          </div>
        </div>
      {/if}
    </div>
  </div>
</main>

<style>
  :global(body) {
    background: #0a0a0a;
    color: #e0e0e0;
  }

  main {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 1rem;
  }

  .container {
    max-width: 500px;
    width: 100%;
  }

  h1 {
    font-size: 2rem;
    margin-bottom: 2rem;
    text-align: center;
    font-weight: 600;
  }

  .status-box {
    background: #1a1a1a;
    border: 1px solid #333;
    border-radius: 8px;
    padding: 2rem;
    text-align: center;
  }

  .loading,
  .error,
  .success {
    margin: 0;
    font-size: 1.1rem;
  }

  .loading {
    color: #888;
  }

  .error {
    color: #ff6b6b;
  }

  .success {
    color: #51cf66;
    margin-bottom: 1.5rem;
  }

  .details {
    margin-top: 1.5rem;
    text-align: left;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    padding: 0.75rem 0;
    border-bottom: 1px solid #333;
  }

  .detail-row:last-child {
    border-bottom: none;
  }

  .label {
    color: #888;
    font-weight: 500;
  }

  .value {
    color: #e0e0e0;
    font-family: "Courier New", monospace;
  }
</style>
