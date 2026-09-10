<script lang="ts">
  import { onMount } from "svelte";
  import { applyTheme, CUSTOMIZABLE_TOKENS, restoreTheme, THEME_PRESETS, type ThemeTokens } from "../tokens/themes";

  let name = "nocturne";
  let overrides: Partial<ThemeTokens> = {};
  let open = false;

  onMount(() => {
    const restored = restoreTheme();
    name = restored.name;
    overrides = restored.overrides;
  });

  function selectPreset(event: Event) {
    name = (event.currentTarget as HTMLSelectElement).value;
    overrides = {};
    applyTheme(name);
  }

  function colorValue(key: keyof ThemeTokens): string {
    return overrides[key] ?? THEME_PRESETS[name]?.tokens[key] ?? THEME_PRESETS.nocturne.tokens[key];
  }

  function setColor(key: keyof ThemeTokens, event: Event) {
    overrides = { ...overrides, [key]: (event.currentTarget as HTMLInputElement).value };
    applyTheme(name, overrides);
  }
</script>

<div class="theme-control">
  <button class="theme-button" type="button" aria-expanded={open} on:click={() => (open = !open)} title="Customize colors">
    <span class="swatch" style={`background:${colorValue("accent")}`}></span><span>Theme</span>
  </button>
  {#if open}
    <div class="theme-popover">
      <label class="preset">Preset
        <select value={name} on:change={selectPreset}>
          {#each Object.entries(THEME_PRESETS) as [key, preset]}<option value={key}>{preset.label}</option>{/each}
        </select>
      </label>
      <div class="colors">
        {#each CUSTOMIZABLE_TOKENS as token}
          <label title={token.label}><span>{token.label}</span><input type="color" value={colorValue(token.key)} on:input={(event) => setColor(token.key, event)} /></label>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .theme-control { position: relative; }
  .theme-button { display: inline-flex; align-items: center; gap: 6px; border: 0; background: transparent; color: var(--color-text-muted); font: inherit; font-size: 11px; cursor: pointer; }
  .theme-button:hover { color: var(--color-text); }
  .swatch { width: 9px; height: 9px; border-radius: 50%; box-shadow: 0 0 0 1px var(--color-border); }
  .theme-popover { position: absolute; z-index: 30; top: calc(100% + 9px); right: 0; width: 230px; padding: 12px; border: 1px solid var(--color-border-strong); border-radius: var(--radius-md); background: var(--color-surface); box-shadow: var(--shadow-lg); }
  .preset, .colors label { display: flex; align-items: center; justify-content: space-between; gap: 10px; color: var(--color-text-muted); font-size: 11px; }
  select { min-width: 120px; padding: 4px 6px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: var(--color-bg); color: var(--color-text); font: inherit; }
  .colors { display: grid; gap: 7px; margin-top: 11px; padding-top: 10px; border-top: 1px solid var(--color-border); }
  input { width: 24px; height: 18px; padding: 0; border: 0; background: transparent; cursor: pointer; }
</style>
