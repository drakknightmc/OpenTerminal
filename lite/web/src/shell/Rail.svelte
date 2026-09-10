<script lang="ts">
  import { getSections } from "../finance/registry";

  const sections = getSections();
  const groups = Array.from(new Set(sections.map((section) => section.group)));
</script>

<aside class="rail" aria-label="Primary navigation">
  <div class="brand">LEDGERLINE</div>
  {#each groups as group}
    <div class="group">
      <span class="group-label">{group}</span>
      {#each sections.filter((section) => section.group === group) as section (section.id)}
        <a href={section.routes?.[0] ?? "#"}>{section.label}</a>
      {/each}
    </div>
  {/each}
</aside>

<style>
  .rail { width: 196px; min-width: 196px; display: flex; flex-direction: column; gap: var(--space-5); padding: var(--space-5) var(--space-3); background: var(--color-surface); border-right: 1px solid var(--color-border); color: var(--color-text-dim); }
  .brand { color: var(--color-accent); font-size: 0.75rem; font-weight: 700; letter-spacing: 0.14em; }
  .group { display: grid; gap: var(--space-2); }
  .group-label { color: var(--color-text-faint); font-size: 0.65rem; letter-spacing: 0.1em; text-transform: uppercase; }
  a { padding: var(--space-2); border-radius: var(--radius-sm); color: var(--color-text-dim); text-decoration: none; }
  a:hover { background: var(--color-surface-hover); color: var(--color-text); }
  @media (max-width: 760px) { .rail { width: 148px; min-width: 148px; padding-inline: var(--space-2); } }
  @media (max-width: 560px) { .rail { width: 52px; min-width: 52px; padding: var(--space-4) 5px; align-items: center; } .brand { font-size: 0; } .brand::after { content: "L"; font-size: 15px; } .group-label { display: none; } .group { width: 100%; } a { overflow: hidden; padding: 7px 5px; text-align: center; font-size: 0; } a::first-letter { font-size: 13px; } }
</style>
