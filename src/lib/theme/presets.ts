/**
 * Theme presets: the single source of truth for every colour in the app.
 *
 * A preset is only a map of token values. `scripts/generate-theme-css.ts` turns
 * this file into the `[data-theme="..."]` blocks in `src/app/globals.css`
 * (run `pnpm theme:css`, or `pnpm theme:css --check` to verify they are in sync).
 * Components never read these values; they use Tailwind utilities such as
 * `bg-surface` or `text-ink-muted`, which resolve to the CSS variables.
 *
 * Adding a theme: add an entry to `themePresets`, run the generator, then run
 * `pnpm theme:contrast` and fix any pair it reports as failing.
 */

export const colorTokens = [
  "background", "surface", "surface-raised", "surface-sunken", "overlay", "backdrop",
  "ink", "ink-strong", "ink-muted", "ink-subtle",
  "outline", "outline-soft", "outline-strong",
  "sky", "sky-soft", "link", "accent",
  "primary", "primary-hover", "primary-fg", "primary-soft",
  "success", "success-soft", "success-ink",
  "warning", "warning-soft", "warning-ink",
  "error", "error-soft", "error-ink",
  "info", "info-soft", "info-ink",
  "neutral-soft",
  "paper", "paper-ink", "paper-ink-muted", "paper-outline",
  "hero-start", "hero-end",
  "shadow-sm", "shadow-md", "shadow-lg",
] as const;

/** Sizes a preset may override. Only the `stage` preset does, to scale type for a projector. */
export const sizeTokens = [
  "text-base", "text-label", "text-display", "text-title",
  "control-h-sm", "control-h-md", "control-h-lg", "row-h", "table-head-h", "space-card", "space-section", "icon-size",
] as const;

export type ColorToken = (typeof colorTokens)[number];
export type SizeToken = (typeof sizeTokens)[number];
export type ThemeTokens = Record<ColorToken, string> & Partial<Record<SizeToken, string>>;
export type ThemeMode = "dark" | "light";

export type ThemePreset = {
  id: string;
  label: string;
  description: string;
  /** Drives `color-scheme`, so native controls and scrollbars match. */
  mode: ThemeMode;
  /** `app` presets appear in the picker. `stage` is applied by a layout, never chosen by the user. */
  scope: "app" | "stage";
  tokens: ThemeTokens;
};

/* ------------------------------------------------------------------ bases */

// The original Octo Code palette, unchanged. `design.md` describes it.
const octoDark: ThemeTokens = {
  background: "#0d1117", surface: "#161b22", "surface-raised": "#1c2128", "surface-sunken": "#0d1117", overlay: "#1c2128", backdrop: "rgba(1, 4, 9, 0.8)",
  ink: "#e6edf3", "ink-strong": "#c9d1d9", "ink-muted": "#8b949e", "ink-subtle": "#484f58",
  outline: "#30363d", "outline-soft": "#21262d", "outline-strong": "#484f58",
  sky: "#2f81f7", "sky-soft": "#1c2d41", link: "#58a6ff", accent: "#f78166",
  primary: "#238636", "primary-hover": "#2ea043", "primary-fg": "#ffffff", "primary-soft": "#132d1b",
  success: "#3fb950", "success-soft": "#132d1b", "success-ink": "#56d364",
  warning: "#d29922", "warning-soft": "#3d2e0a", "warning-ink": "#d29922",
  error: "#f85149", "error-soft": "#3d1719", "error-ink": "#ff7b72",
  info: "#2f81f7", "info-soft": "#1c2d41", "info-ink": "#58a6ff",
  "neutral-soft": "#21262d",
  paper: "#ffffff", "paper-ink": "#1f2328", "paper-ink-muted": "#656d76", "paper-outline": "#d0d7de",
  "hero-start": "#1c2d41", "hero-end": "#161b22",
  "shadow-sm": "0 1px 2px rgba(1, 4, 9, 0.35)", "shadow-md": "0 6px 16px rgba(1, 4, 9, 0.45)", "shadow-lg": "0 24px 60px rgba(1, 4, 9, 0.45)",
};

const octoLight: ThemeTokens = {
  background: "#f6f8fa", surface: "#ffffff", "surface-raised": "#f6f8fa", "surface-sunken": "#f6f8fa", overlay: "#ffffff", backdrop: "rgba(31, 35, 40, 0.38)",
  ink: "#1f2328", "ink-strong": "#424a53", "ink-muted": "#656d76", "ink-subtle": "#8c959f",
  outline: "#d0d7de", "outline-soft": "#d8dee4", "outline-strong": "#8c959f",
  sky: "#0969da", "sky-soft": "#ddf4ff", link: "#0969da", accent: "#bc4c00",
  primary: "#238636", "primary-hover": "#2ea043", "primary-fg": "#ffffff", "primary-soft": "#dafbe1",
  success: "#1a7f37", "success-soft": "#dafbe1", "success-ink": "#1a7f37",
  warning: "#9a6700", "warning-soft": "#fff8c5", "warning-ink": "#9a6700",
  error: "#cf222e", "error-soft": "#ffebe9", "error-ink": "#cf222e",
  info: "#0969da", "info-soft": "#ddf4ff", "info-ink": "#0969da",
  "neutral-soft": "#eaeef2",
  paper: "#ffffff", "paper-ink": "#1f2328", "paper-ink-muted": "#656d76", "paper-outline": "#d0d7de",
  "hero-start": "#ddf4ff", "hero-end": "#ffffff",
  "shadow-sm": "0 1px 2px rgba(31, 35, 40, 0.08)", "shadow-md": "0 6px 16px rgba(31, 35, 40, 0.16)", "shadow-lg": "0 24px 60px rgba(31, 35, 40, 0.22)",
};

const extend = (base: ThemeTokens, overrides: Partial<ThemeTokens>): ThemeTokens => ({ ...base, ...overrides });

/* --------------------------------------------------------------- presets */

export const themePresets: ThemePreset[] = [
  {
    id: "dark",
    label: "Dark (Octo Code)",
    description: "The original GitHub-style dark palette. Default.",
    mode: "dark",
    scope: "app",
    tokens: octoDark,
  },
  {
    id: "light",
    label: "Light (Octo Code)",
    description: "The original light palette.",
    mode: "light",
    scope: "app",
    tokens: octoLight,
  },
  {
    id: "geist-dark",
    label: "Geist dark",
    description: "Neutral near-black surfaces with a white primary action, Vercel-style.",
    mode: "dark",
    scope: "app",
    tokens: extend(octoDark, {
      background: "#0a0a0a", surface: "#111111", "surface-raised": "#171717", "surface-sunken": "#0a0a0a", overlay: "#1a1a1a", backdrop: "rgba(0, 0, 0, 0.8)",
      ink: "#ededed", "ink-strong": "#d4d4d4", "ink-muted": "#a1a1a1", "ink-subtle": "#8f8f8f",
      outline: "#2e2e2e", "outline-soft": "#1f1f1f", "outline-strong": "#454545",
      sky: "#3291ff", "sky-soft": "#0b2a4a", link: "#52a8ff", accent: "#ff7a45",
      primary: "#ededed", "primary-hover": "#ffffff", "primary-fg": "#0a0a0a", "primary-soft": "#1f1f1f",
      success: "#46a758", "success-soft": "#0f2a17", "success-ink": "#5bb86e",
      warning: "#f5a524", "warning-soft": "#2e2005", "warning-ink": "#f7b955",
      error: "#e5484d", "error-soft": "#2d1315", "error-ink": "#ff6369",
      info: "#3291ff", "info-soft": "#0b2a4a", "info-ink": "#52a8ff",
      "neutral-soft": "#1f1f1f",
      "hero-start": "#0b2a4a", "hero-end": "#111111",
      "shadow-sm": "0 1px 2px rgba(0, 0, 0, 0.5)", "shadow-md": "0 6px 16px rgba(0, 0, 0, 0.6)", "shadow-lg": "0 24px 60px rgba(0, 0, 0, 0.6)",
    }),
  },
  {
    id: "geist-light",
    label: "Geist light",
    description: "Neutral white surfaces with a near-black primary action.",
    mode: "light",
    scope: "app",
    tokens: extend(octoLight, {
      background: "#fafafa", surface: "#ffffff", "surface-raised": "#f5f5f5", "surface-sunken": "#fafafa", overlay: "#ffffff", backdrop: "rgba(23, 23, 23, 0.4)",
      ink: "#171717", "ink-strong": "#404040", "ink-muted": "#666666", "ink-subtle": "#737373",
      outline: "#e5e5e5", "outline-soft": "#eeeeee", "outline-strong": "#a3a3a3",
      sky: "#0070f3", "sky-soft": "#e6f1ff", link: "#0067d9", accent: "#c2410c",
      primary: "#171717", "primary-hover": "#000000", "primary-fg": "#ffffff", "primary-soft": "#f0f0f0",
      success: "#18794e", "success-soft": "#e6f6eb", "success-ink": "#18794e",
      warning: "#915930", "warning-soft": "#fff4d6", "warning-ink": "#915930",
      error: "#cd2b31", "error-soft": "#ffefef", "error-ink": "#cd2b31",
      info: "#0070f3", "info-soft": "#e6f1ff", "info-ink": "#0067d9",
      "neutral-soft": "#ededed",
      "hero-start": "#e6f1ff", "hero-end": "#ffffff",
    }),
  },
  {
    id: "brand-dryport",
    label: "Cikarang Dryport",
    description: "Deep navy with the blue and orange of the logo mark. Colours are derived from the logo, not an official brand guide.",
    mode: "dark",
    scope: "app",
    tokens: extend(octoDark, {
      background: "#0b1220", surface: "#111b2e", "surface-raised": "#172640", "surface-sunken": "#080e19", overlay: "#172640", backdrop: "rgba(4, 8, 16, 0.82)",
      ink: "#e8eefc", "ink-strong": "#c3cde4", "ink-muted": "#8d9bb8", "ink-subtle": "#7886a4",
      outline: "#25365a", "outline-soft": "#1a2845", "outline-strong": "#3a4f7d",
      sky: "#3b82f6", "sky-soft": "#14284d", link: "#6ea8ff", accent: "#f78166",
      // Hover goes darker, not lighter: white text on the lighter blue drops under 4.5:1.
      primary: "#2563eb", "primary-hover": "#1d4ed8", "primary-fg": "#ffffff", "primary-soft": "#14284d",
      "neutral-soft": "#1a2845",
      "hero-start": "#14284d", "hero-end": "#111b2e",
    }),
  },
  {
    id: "high-contrast",
    label: "High contrast",
    description: "Pure black with white text and strong borders, for low vision and bright rooms.",
    mode: "dark",
    scope: "app",
    tokens: extend(octoDark, {
      background: "#000000", surface: "#0a0a0a", "surface-raised": "#141414", "surface-sunken": "#000000", overlay: "#141414", backdrop: "rgba(0, 0, 0, 0.88)",
      ink: "#ffffff", "ink-strong": "#f2f2f2", "ink-muted": "#d6d6d6", "ink-subtle": "#b8b8b8",
      outline: "#9a9a9a", "outline-soft": "#6b6b6b", "outline-strong": "#d0d0d0",
      sky: "#5cb0ff", "sky-soft": "#0a2a4d", link: "#8ac8ff", accent: "#ffb000",
      primary: "#3ddc84", "primary-hover": "#6ff0a4", "primary-fg": "#000000", "primary-soft": "#0d3a22",
      success: "#3ddc84", "success-soft": "#0d3a22", "success-ink": "#7dffb0",
      warning: "#ffc233", "warning-soft": "#3d2e00", "warning-ink": "#ffd866",
      error: "#ff6b6b", "error-soft": "#4a0f12", "error-ink": "#ff9a9a",
      info: "#5cb0ff", "info-soft": "#0a2a4d", "info-ink": "#8ac8ff",
      "neutral-soft": "#262626",
      "hero-start": "#0a2a4d", "hero-end": "#0a0a0a",
    }),
  },
  {
    id: "stage",
    label: "Stage",
    description: "Presentation screens only: deep violet, warm amber accent, and type scaled for a projector.",
    mode: "dark",
    scope: "stage",
    tokens: extend(octoDark, {
      background: "#0b0a14", surface: "#14122a", "surface-raised": "#1d1a3a", "surface-sunken": "#07060f", overlay: "#1d1a3a", backdrop: "rgba(5, 4, 12, 0.85)",
      ink: "#f7f4ff", "ink-strong": "#e2dcf7", "ink-muted": "#bdb6dd", "ink-subtle": "#9a93c0",
      outline: "#35305f", "outline-soft": "#24204a", "outline-strong": "#4d4780",
      sky: "#ffb454", "sky-soft": "#3a2a12", link: "#ffc978", accent: "#ff7a59",
      primary: "#ff9f1c", "primary-hover": "#ffb347", "primary-fg": "#1a1100", "primary-soft": "#3a2a12",
      "neutral-soft": "#24204a",
      "hero-start": "#4a2c12", "hero-end": "#14122a",
      "text-base": "1.125rem", "text-label": "0.875rem", "text-display": "3.75rem", "text-title": "2.25rem",
      "control-h-sm": "2.5rem", "control-h-md": "3rem", "control-h-lg": "3.5rem", "row-h": "3.5rem", "table-head-h": "2.75rem",
      "space-card": "1.5rem", "space-section": "2rem", "icon-size": "1.25rem",
    }),
  },
];

/** Presets the user can pick. `stage` is applied by the presentation layout only. */
export const selectablePresets = themePresets.filter((preset) => preset.scope === "app");

export const defaultThemeId = "dark";

/**
 * Inline script that runs before first paint. It applies the saved theme and
 * density, and falls back to the operating system's light/dark preference when
 * nothing is saved. The ids come from `selectablePresets`, so a stale or
 * unknown stored value (including the old plain "light"/"dark") is handled.
 */
export function themeBootScript(): string {
  const ids = JSON.stringify(selectablePresets.map((preset) => preset.id));
  // An IIFE, so `d`, `t` and `n` do not leak onto `window`.
  return `(function(){var d=document.documentElement,t=null,n=null;try{t=window.localStorage.getItem("event-theme");n=window.localStorage.getItem("event-density")}catch(e){}if(${ids}.indexOf(t)<0){try{t=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}catch(e){t="dark"}}d.setAttribute("data-theme",t);d.setAttribute("data-density",n==="comfortable"?"comfortable":"compact")})()`;
}
