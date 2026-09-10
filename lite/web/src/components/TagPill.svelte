<script lang="ts">export let tone: "neutral" | "gain" | "loss" | "accent" = "neutral";</script>
<span class={tone}><slot /></span>
<style>
  span { display: inline-block; padding: var(--space-1) var(--space-2); border: 1px solid var(--color-border); border-radius: 99px; color: var(--color-text-muted); font-size: .7rem; } .gain { border-color: var(--color-gain); color: var(--color-gain); } .loss { border-color: var(--color-loss); color: var(--color-loss); } .accent { border-color: var(--color-accent); color: var(--color-accent); }
</style>
