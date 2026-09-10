<script lang="ts">export interface Tab { label: string; count?: number; value: string; } export let tabs: Tab[] = []; export let value = ""; export let onChange: ((value: string) => void) | undefined = undefined;</script>
<nav>{#each tabs as tab}<button class:active={tab.value === value} on:click={() => onChange?.(tab.value)}>{tab.label}{#if tab.count !== undefined}<small>{tab.count}</small>{/if}</button>{/each}</nav>
<style>
  nav { display: flex; gap: var(--space-1); overflow-x: auto; border-bottom: 1px solid var(--color-border); scrollbar-width: none; } nav::-webkit-scrollbar { display: none; } button { flex: 0 0 auto; padding: var(--space-2) var(--space-3); border: 0; border-bottom: 2px solid transparent; background: transparent; color: var(--color-text-muted); cursor: pointer; white-space: nowrap; } button.active { border-color: var(--color-accent); color: var(--color-text); } small { margin-left: var(--space-1); color: var(--color-text-faint); }
</style>
