<script lang="ts">
  export let placeholder = "Ask about this page";
</script>

<aside class="dock" aria-label="Agent dock">
  <div class="heading">Agent</div>
  <input aria-label={placeholder} placeholder={placeholder} />
</aside>

<style>
  .dock { width: 296px; min-width: 296px; display: grid; align-content: start; gap: var(--space-4); padding: var(--space-5); background: var(--color-surface); border-left: 1px solid var(--color-border); color: var(--color-text); }
  .heading { color: var(--color-text-dim); font-size: 0.8rem; font-weight: 600; }
  input { width: 100%; padding: var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); outline: none; background: var(--color-bg); color: var(--color-text); }
  input:focus { border-color: var(--color-accent); }
</style>
