<script lang="ts">
  // Unchanged Markets content (the GridStack workspace + its widgets),
  // just mounted at its own route now instead of being the whole app.
  // The actual restyle/rewrite of these widgets onto the new token system
  // and registry pattern is separate follow-up work -- this wrapper
  // intentionally touches none of it.
  import Sidebar from "../../components/Sidebar.svelte";
  import WorkspaceGrid from "../../widgets/WorkspaceGrid.svelte";
</script>

<div class="markets-page">
  <Sidebar />
  <WorkspaceGrid />
</div>

<style>
  .markets-page {
    display: flex;
    flex: 1;
    min-height: 0;
    /* Negative margin cancels ContentWell's padding -- Markets' own
       Sidebar/WorkspaceGrid manage their own spacing and expect to own
       the full content area, same as when they were the whole app. */
    margin: calc(var(--space-6) * -1);
  }
</style>
