<script lang="ts">
  import "./tokens/palette.css";
  import "./tokens/theme-dark.css";
  import "./finance/bootstrap";

  import Rail from "./shell/Rail.svelte";
  import TopBar from "./shell/TopBar.svelte";
  import ContentWell from "./shell/ContentWell.svelte";
  import AgentDock from "./shell/AgentDock.svelte";

  import Overview from "./finance/overview/Overview.svelte";
  import Investments from "./finance/investments/Investments.svelte";
  import PositionDetail from "./finance/investments/PositionDetail.svelte";
  import NetWorth from "./finance/networth/NetWorth.svelte";
  import Inbox from "./finance/inbox/Inbox.svelte";
  import MarketsPage from "./finance/markets/MarketsPage.svelte";

  import { path } from "./lib/router";

  const titles: Record<string, string> = {
    "/": "Overview",
    "/investments": "Investments",
    "/networth": "Net worth",
    "/markets": "Markets",
    "/inbox": "Inbox",
  };

  $: positionSymbol = $path.startsWith("/investments/") ? decodeURIComponent($path.slice("/investments/".length)) : null;
  $: title = positionSymbol ? positionSymbol : titles[$path] ?? "LedgerLine";
</script>

<main>
  <div class="layout">
    <Rail />
    <div class="workspace">
      <TopBar {title} />
      <ContentWell>
        {#if positionSymbol}
          <PositionDetail symbol={positionSymbol} />
        {:else if $path === "/investments"}
          <Investments />
        {:else if $path === "/networth"}
          <NetWorth />
        {:else if $path === "/markets"}
          <MarketsPage />
        {:else if $path === "/inbox"}
          <Inbox />
        {:else}
          <Overview />
        {/if}
      </ContentWell>
    </div>
    <AgentDock />
  </div>
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    background: var(--color-bg);
    color: var(--color-text);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    font-size: 13px;
  }

  :global(*) {
    box-sizing: border-box;
  }

  main {
    display: flex;
    flex-direction: column;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
  }

  .layout {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .workspace {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }
</style>
