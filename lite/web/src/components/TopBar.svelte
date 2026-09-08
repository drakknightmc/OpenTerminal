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
    background: #1a1a1a;
    border-bottom: 1px solid #333;
    font-size: 11px;
    color: #e0e0e0;
    flex-shrink: 0;
  }

  .logo {
    font-weight: 700;
    letter-spacing: 2px;
    color: #f0a000;
  }

  .market-status {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #ff6b6b;
  }

  .market-status.open {
    color: #51cf66;
  }

  .indicator {
    font-size: 8px;
  }

  .search-button {
    background: #0f0f0f;
    border: 1px solid #333;
    border-radius: 4px;
    padding: 4px 8px;
    color: #888;
    font-size: 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 0 1 250px;
  }

  .search-button:hover {
    border-color: #555;
    color: #aaa;
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
    color: #51cf66;
  }

  .status-text {
    font-size: 10px;
  }
</style>
