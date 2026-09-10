export type ThemeTokens = {
  bg: string;
  surface: string;
  raised: string;
  text: string;
  muted: string;
  faint: string;
  accent: string;
  accent2: string;
  gain: string;
  loss: string;
  divider: string;
};

export const THEME_PRESETS: Record<string, { label: string; tokens: ThemeTokens }> = {
  nocturne: {
    label: "Nocturne",
    tokens: { bg: "#161826", surface: "#232532", raised: "#292b31", text: "#e9e9ed", muted: "#9397ab", faint: "#595d6c", accent: "#9184d9", accent2: "#a7a1db", gain: "#57c98c", loss: "#e0736c", divider: "rgba(233,233,237,.16)" },
  },
  graphite: {
    label: "Graphite",
    tokens: { bg: "#17191c", surface: "#24272b", raised: "#30343a", text: "#e6e8eb", muted: "#9ca3ad", faint: "#626b76", accent: "#75b5e7", accent2: "#a1c8e6", gain: "#6fd39a", loss: "#e47d7d", divider: "rgba(230,232,235,.16)" },
  },
  ember: {
    label: "Ember",
    tokens: { bg: "#1b1716", surface: "#2a2220", raised: "#382c29", text: "#f0e8e1", muted: "#b8a59a", faint: "#76645c", accent: "#e5a56c", accent2: "#efc18f", gain: "#75cf9c", loss: "#e77b6e", divider: "rgba(240,232,225,.16)" },
  },
  serika: {
    label: "Serika",
    tokens: { bg: "#323437", surface: "#3c3f41", raised: "#474a4d", text: "#d1d0c5", muted: "#92918a", faint: "#646669", accent: "#e2b714", accent2: "#f0c936", gain: "#98c379", loss: "#ca4754", divider: "rgba(209,208,197,.16)" },
  },
};

const STORAGE_KEY = "ledgerline-theme";
const TOKEN_VARS: Record<keyof ThemeTokens, string> = {
  bg: "--color-bg", surface: "--color-surface", raised: "--color-surface-raised", text: "--color-text",
  muted: "--color-text-muted", faint: "--color-text-faint", accent: "--color-accent", accent2: "--color-accent-2",
  gain: "--color-gain", loss: "--color-loss", divider: "--color-divider",
};

export function applyTheme(name: string, overrides: Partial<ThemeTokens> = {}): void {
  if (typeof document === "undefined") return;
  const preset = THEME_PRESETS[name] ?? THEME_PRESETS.nocturne;
  document.documentElement.dataset.theme = name in THEME_PRESETS ? name : "custom";
  for (const key of Object.keys(TOKEN_VARS) as Array<keyof ThemeTokens>) {
    document.documentElement.style.setProperty(TOKEN_VARS[key], overrides[key] ?? preset.tokens[key]);
  }
  // Derive the supporting scale from the user's semantic colors so custom
  // themes recolor tags, focus rings, hover states, and progress bars too.
  const root = document.documentElement.style;
  root.setProperty("--color-surface-hover", "color-mix(in srgb, var(--color-surface) 78%, var(--color-text) 22%)");
  root.setProperty("--color-border", "color-mix(in srgb, var(--color-text) 24%, transparent)");
  root.setProperty("--color-border-strong", "color-mix(in srgb, var(--color-text) 38%, transparent)");
  root.setProperty("--color-accent-100", "color-mix(in srgb, var(--color-text) 88%, var(--color-accent) 12%)");
  root.setProperty("--color-accent-800", "color-mix(in srgb, var(--color-bg) 72%, var(--color-accent) 28%)");
  root.setProperty("--color-accent-600", "color-mix(in srgb, var(--color-bg) 30%, var(--color-accent) 70%)");
  root.setProperty("--color-accent-2-100", "color-mix(in srgb, var(--color-text) 88%, var(--color-accent-2) 12%)");
  root.setProperty("--color-accent-2-800", "color-mix(in srgb, var(--color-bg) 72%, var(--color-accent-2) 28%)");
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ name, overrides }));
}

export function restoreTheme(): { name: string; overrides: Partial<ThemeTokens> } {
  if (typeof localStorage === "undefined") return { name: "nocturne", overrides: {} };
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (value && typeof value.name === "string" && value.overrides && typeof value.overrides === "object") {
      applyTheme(value.name, value.overrides);
      return value;
    }
  } catch { /* corrupted preferences fall back to the default */ }
  applyTheme("nocturne");
  return { name: "nocturne", overrides: {} };
}

export const CUSTOMIZABLE_TOKENS: Array<{ key: keyof ThemeTokens; label: string }> = [
  { key: "bg", label: "Background" }, { key: "surface", label: "Surface" }, { key: "raised", label: "Raised surface" },
  { key: "text", label: "Text" }, { key: "muted", label: "Muted text" }, { key: "accent", label: "Accent" },
  { key: "accent2", label: "Secondary accent" }, { key: "gain", label: "Gain" }, { key: "loss", label: "Loss" },
];
