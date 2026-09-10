<main class="content-well"><slot /></main>

<style>
  .content-well { min-width: 0; flex: 1; overflow: auto; padding: 18px 20px 28px; background: var(--color-bg); color: var(--color-text); }
  @media (max-width: 560px) { .content-well { padding: 14px 12px 22px; } }
</style>
