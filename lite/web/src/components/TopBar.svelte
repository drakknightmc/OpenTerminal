<script lang="ts">
  import { widgets } from "../store/widgets";
  import { onMount } from "svelte";

  interface StatusResponse {
    ok: boolean;
    time: string;
  }

  let status: StatusResponse | null = null;
  let isMarketOpen = false;

  function checkMarketStatus() {
    const ny = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
    const day = ny.getDay();
    const mins = ny.getHours() * 60 + ny.getMinutes();
    isMarketOpen = day >= 1 && day <= 5 && mins >= 570 && mins < 960; // 09:30–16:00
  }

  onMount(async () => {
    checkMarketStatus();
    const interval = setInterval(checkMarketStatus, 60000);

    try {
      const res = await fetch("/api/status");
      if (res.ok) {
        status = await res.json();
      }
    } catch (e) {
      console.error("Status fetch failed:", e);
    }

    return () => clearInterval(interval);
  });

  function openPalette() {
    // CommandPalette listens for ⌘K globally
    const event = new KeyboardEvent("keydown", { key: "k", ctrlKey: true, metaKey: true });
    window.dispatchEvent(event);
  }
</script>

<header class="topbar">
  <div class="logo">OPENTERMINAL</div>
  <div class="market-status" class:open={isMarketOpen}>
    <span class="indicator">●</span>
    <span>{isMarketOpen ? "NYSE OPEN" : "NYSE CLOSED"}</span>
  </div>
  <button class="search-button" on:click={openPalette}>
    <span>⌘K</span>
    <span class="search-text">Search…</span>
  </button>
  <div class="spacer"></div>
  {#if status}
    <div class="status">
      <span class="indicator" class:ok={status.ok}>●</span>
      <span class="status-text">{status.ok ? "Connected" : "Disconnected"}</span>
    </div>
  {/if}
</header>

<style>
  .topbar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 12px;
    height: 32px;
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
    font-size: 11px;
    color: var(--color-text);
    flex-shrink: 0;
  }

  .logo {
    font-weight: 700;
    letter-spacing: 2px;
    color: var(--color-accent);
  }

  .market-status {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--color-loss);
  }

  .market-status.open {
    color: var(--color-gain);
  }

  .indicator {
    font-size: 8px;
  }

  .search-button {
    background: var(--color-surface-raised);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    padding: 4px 8px;
    color: var(--color-text-muted);
    font-size: 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 0 1 250px;
  }

  .search-button:hover {
    border-color: var(--color-text-faint);
    color: var(--color-text-dim);
  }

  .search-text {
    flex: 1;
    text-align: left;
  }

  .spacer {
    flex: 1;
  }

  .status {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--color-gain);
  }

  .status-text {
    font-size: 10px;
  }
</style>
