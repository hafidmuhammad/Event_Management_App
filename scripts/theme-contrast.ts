/**
 * WCAG 2.x contrast report for every theme preset.
 *
 *   pnpm theme:contrast
 *
 * Exits 1 when a required text pair of a NEW preset falls below its minimum.
 * The original `dark` and `light` palettes are printed for reference but never
 * fail the run: they are the pre-existing Octo Code colours.
 *
 * This checks colour pairs only. It does not replace manual testing with
 * assistive technology.
 */
import { themePresets, type ColorToken, type ThemePreset } from "../src/lib/theme/presets";

function rgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? value.split("").map((c) => c + c).join("") : value;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
}
function luminance(hex: string) {
  const [r, g, b] = rgb(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

type Pair = [fg: ColorToken, bg: ColorToken, kind: "text" | "ui" | "soft"];
const pairs: Pair[] = [
  ["ink", "background", "text"], ["ink", "surface", "text"], ["ink", "surface-raised", "text"], ["ink", "surface-sunken", "text"], ["ink", "overlay", "text"],
  ["ink-strong", "surface", "text"],
  ["ink-muted", "background", "text"], ["ink-muted", "surface", "text"], ["ink-muted", "surface-raised", "text"], ["ink-muted", "neutral-soft", "text"],
  ["link", "background", "text"], ["link", "surface", "text"], ["link", "sky-soft", "text"],
  ["primary-fg", "primary", "text"], ["primary-fg", "primary-hover", "text"],
  ["success-ink", "success-soft", "text"], ["warning-ink", "warning-soft", "text"], ["error-ink", "error-soft", "text"], ["info-ink", "info-soft", "text"],
  ["ink-subtle", "surface", "soft"],
  ["outline", "surface-sunken", "ui"], ["sky", "surface", "ui"],
];

const reference = new Set(["dark", "light"]);
let failed = 0;
for (const preset of themePresets) {
  const textMin = preset.id === "high-contrast" ? 7 : 4.5;
  const isReference = reference.has(preset.id);
  console.log(`\n${preset.id}  (${preset.mode}${isReference ? ", reference" : ""}, text >= ${textMin}:1)`);
  report(preset, textMin, isReference);
}

function report(preset: ThemePreset, textMin: number, isReference: boolean) {
  for (const [fg, bg, kind] of pairs) {
    const a = preset.tokens[fg];
    const b = preset.tokens[bg];
    if (!a?.startsWith("#") || !b?.startsWith("#")) continue;
    const value = ratio(a, b);
    // "soft" pairs (placeholder text) and "ui" pairs (borders, focus ring) have a 3:1 floor; high-contrast raises the UI floor.
    const min = kind === "text" ? textMin : kind === "ui" && preset.id === "high-contrast" ? 4.5 : 3;
    const ok = value >= min;
    if (!ok && !isReference && kind === "text") failed++;
    const mark = ok ? "ok  " : isReference || kind !== "text" ? "warn" : "FAIL";
    if (!ok || process.argv.includes("--all")) console.log(`  ${mark} ${fg} on ${bg}: ${value.toFixed(2)}:1 (min ${min})`);
  }
}

console.log(failed ? `\n${failed} required text pair(s) below minimum.` : "\nAll required text pairs of the new presets meet their minimum. (warn = informational, never fails the run)");
process.exit(failed ? 1 : 0);
