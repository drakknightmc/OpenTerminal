<script lang="ts">
  import TopBar from "./components/TopBar.svelte";
  import Sidebar from "./components/Sidebar.svelte";
  import WorkspaceGrid from "./widgets/WorkspaceGrid.svelte";
  import CommandPalette from "./widgets/CommandPalette.svelte";
</script>

<main>
  <TopBar />
  <div class="layout">
    <Sidebar />
    <WorkspaceGrid />
  </div>
  <CommandPalette />
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    background: #0a0a0a;
    color: #e0e0e0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell,
      sans-serif;
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
</style>
