<script lang="ts">
  import { onMount } from "svelte";
  import { getSections } from "../finance/registry";
  import { path } from "../lib/router";
  import { pendingReviewCount, refreshPendingReviewCount } from "../finance/reviewStore";

  const sections = getSections();
  const groups = Array.from(new Set(sections.map((section) => section.group)));
  $: pending = $pendingReviewCount;
  onMount(() => { void refreshPendingReviewCount(); });
  function isActive(route: string, currentPath: string): boolean {
    return route === "/" ? currentPath === "/" : currentPath === route || currentPath.startsWith(`${route}/`);
  }
</script>

<aside class="rail" aria-label="Primary navigation">
  <div class="rail-head"><span class="brand">OPENTERMINAL</span><span class="version">v0.4</span></div>
  <div class="nav-scroll">
    {#each groups as group}
      <div class="group">
        <span class="group-label">{group}</span>
        {#each sections.filter((section) => section.group === group) as section (section.id)}
          {@const route = section.routes?.[0] ?? "#"}
          <a class:active={isActive(route, $path)} data-short={section.label.slice(0, 1)} href={route}><span class="dot" class:dot-live={section.id === "markets"} aria-hidden="true"></span><span class="nav-label">{section.label}</span>{#if section.id === "inbox" && pending > 0}<b>{pending}</b>{/if}</a>
        {/each}
      </div>
    {/each}
  </div>
  <div class="rail-status"><span class="status-dot" aria-hidden="true"></span><span>{sections.length} sections live</span></div>
</aside>

<style>
  .rail { width: 196px; min-width: 196px; display: flex; flex-direction: column; background: color-mix(in srgb, var(--color-bg) 88%, black); border-right: 1px solid var(--color-border); color: var(--color-text-dim); }
  .rail-head { display: flex; align-items: baseline; gap: 7px; padding: 13px 14px 12px; } .brand { color: var(--color-text); font-size: 0.8rem; font-weight: 600; letter-spacing: 0.14em; } .version { color: var(--color-text-muted); font: 9px var(--font-mono); letter-spacing: 0.1em; }
  .nav-scroll { flex: 1; min-height: 0; overflow-y: auto; padding-bottom: 12px; } .group { display: grid; gap: 2px; padding-top: 11px; }
  .group-label { padding: 0 14px 4px; color: var(--color-text-faint); font-size: 0.6rem; letter-spacing: 0.13em; text-transform: uppercase; }
  a { display: flex; align-items: center; gap: 9px; width: 100%; padding: 5px 14px 5px 13px; border-radius: 0; color: var(--color-text-dim); text-decoration: none; } a.active { background: color-mix(in srgb, var(--color-accent) 10%, transparent); box-shadow: inset 2px 0 0 var(--color-accent); color: var(--color-text); } a:hover { background: color-mix(in srgb, var(--color-text) 5%, transparent); color: var(--color-text); } .dot, .status-dot { width: 5px; height: 5px; flex: none; border-radius: 50%; background: var(--color-text-faint); } .dot-live, .status-dot { background: var(--color-gain); } .nav-label { flex: 1; } b { display: inline-grid; min-width: 18px; height: 18px; margin-left: auto; place-items: center; border-radius: 20px; background: var(--color-accent); color: var(--color-bg); font: 600 10px var(--font-mono); }
  .rail-status { display: flex; align-items: center; gap: 7px; padding: 9px 14px; border-top: 1px solid var(--color-border); color: var(--color-text-muted); font-size: 10.5px; }
  @media (max-width: 760px) { .rail { width: 148px; min-width: 148px; padding-inline: var(--space-2); } }
  @media (max-width: 560px) { .rail { width: 52px; min-width: 52px; align-items: center; } .rail-head { padding: var(--space-4) 5px; } .brand { font-size: 0; } .brand::after { content: "L"; font-size: 15px; } .version, .group-label, .nav-label, .rail-status { display: none; } .group { width: 100%; } a { justify-content: center; overflow: hidden; padding: 7px 5px; text-align: center; font-size: 0; } a::before { content: attr(data-short); font-size: 13px; } .dot, b { display: none; } }
</style>
