<main class="content-well"><slot /></main>

<style>
  .content-well { min-width: 0; flex: 1; overflow: auto; padding: 14px 18px 22px; background: var(--color-bg); color: var(--color-text); }
  @media (max-width: 560px) { .content-well { padding: 12px 10px 18px; } }
</style>
