import type { Config } from "tailwindcss";

/**
 * A colour that follows a CSS variable from globals.css, so every utility
 * (`bg-surface`, `text-ink-muted`, `border-outline`, ...) re-themes with
 * `data-theme`. Opacity modifiers (`bg-primary/20`) work too: the variable
 * holds a full colour, so the alpha is applied with color-mix.
 *
 * Tailwind's types only declare string colours, but at runtime it accepts a
 * function, which is what makes the modifier possible.
 */
function token(name: string): string {
  // Without a modifier Tailwind passes its own `var(--tw-*-opacity, 1)` placeholder.
  // That means "fully opaque", so the plain variable is enough.
  // `opacityValue` is usually a string but Tailwind can also pass a number, so normalise first.
  const resolve = ({ opacityValue }: { opacityValue?: string | number }) => {
    if (opacityValue === undefined) return `var(--${name})`;
    const alpha = String(opacityValue);
    return alpha.startsWith("var(--tw-")
      ? `var(--${name})`
      : `color-mix(in srgb, var(--${name}) calc(${alpha} * 100%), transparent)`;
  };
  return resolve as unknown as string;
}

const sans = ["var(--font-geist-sans)", "Inter", "Segoe UI", "system-ui", "sans-serif"];

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: token("background"),
        surface: { DEFAULT: token("surface"), raised: token("surface-raised"), sunken: token("surface-sunken") },
        overlay: token("overlay"),
        backdrop: token("backdrop"),
        ink: { DEFAULT: token("ink"), strong: token("ink-strong"), muted: token("ink-muted"), subtle: token("ink-subtle") },
        outline: { DEFAULT: token("outline"), soft: token("outline-soft"), strong: token("outline-strong") },
        primary: { DEFAULT: token("primary"), hover: token("primary-hover"), fg: token("primary-fg"), soft: token("primary-soft") },
        accent: token("accent"),
        link: token("link"),
        sky: { DEFAULT: token("sky"), soft: token("sky-soft") },
        success: { DEFAULT: token("success"), soft: token("success-soft"), ink: token("success-ink") },
        warning: { DEFAULT: token("warning"), soft: token("warning-soft"), ink: token("warning-ink") },
        danger: { DEFAULT: token("error"), soft: token("error-soft"), ink: token("error-ink") },
        info: { DEFAULT: token("info"), soft: token("info-soft"), ink: token("info-ink") },
        neutral: { soft: token("neutral-soft") },
        paper: { DEFAULT: token("paper"), ink: token("paper-ink"), muted: token("paper-ink-muted"), outline: token("paper-outline") },
        // Gradient ends for hero headers: `from-hero-start to-hero-end`.
        hero: { start: token("hero-start"), end: token("hero-end") },
      },
      fontFamily: {
        sans,
        display: sans,
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "Consolas", "monospace"],
      },
      fontSize: {
        // Density-aware sizes. `text-body` and `text-label` follow data-density.
        body: ["var(--text-base)", { lineHeight: "1.5" }],
        label: ["var(--text-label)", { lineHeight: "1.25" }],
        // Headline sizes for display screens. Same as text-3xl / text-2xl until the stage preset scales them.
        display: ["var(--text-display)", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        title: ["var(--text-title)", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
      },
      spacing: {
        // Density-aware sizes: `h-ctl-md`, `min-h-ctl-sm`, `p-card`, `gap-section`.
        "ctl-sm": "var(--control-h-sm)",
        "ctl-md": "var(--control-h-md)",
        "ctl-lg": "var(--control-h-lg)",
        row: "var(--row-h)",
        thead: "var(--table-head-h)",
        card: "var(--space-card)",
        section: "var(--space-section)",
        topbar: "var(--topbar-h)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      boxShadow: {
        // Elevation is only for floating layers; in-flow cards use a border.
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
      zIndex: {
        // Stacking order of floating layers, lowest to highest.
        compose: "60",
        menu: "100",
        tooltip: "110",
        toast: "200",
      },
      keyframes: {
        // Opacity and a 2% scale only. Never animate height or width, that is what moves layout.
        "menu-in": { from: { opacity: "0", transform: "scale(0.98)" }, to: { opacity: "1", transform: "scale(1)" } },
        shimmer: { from: { transform: "translateX(-100%)" }, to: { transform: "translateX(100%)" } },
      },
      animation: {
        "menu-in": "menu-in 100ms ease-out",
        shimmer: "shimmer 1.35s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
