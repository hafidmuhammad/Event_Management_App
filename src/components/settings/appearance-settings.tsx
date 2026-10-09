"use client";

import type { ReactNode } from "react";
import { Fieldset } from "@/components/ui/field";
import { selectablePresets } from "@/lib/theme/presets";
import { useAppearance, type Density } from "@/lib/theme/use-appearance";

const choice =
  "relative flex cursor-pointer items-start gap-3 rounded-md border border-outline bg-surface p-3 transition-colors hover:border-outline-strong has-[:checked]:border-sky has-[:checked]:bg-surface-raised has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sky/60";

function Choice({ name, value, checked, onSelect, title, description, preview }: { name: string; value: string; checked: boolean; onSelect: () => void; title: string; description: string; preview?: ReactNode }) {
  return (
    <label className={choice}>
      <input type="radio" name={name} value={value} checked={checked} onChange={onSelect} className="peer sr-only" />
      {preview}
      <span className="min-w-0">
        <span className="block text-body font-medium text-ink">{title}</span>
        <span className="mt-0.5 block text-xs text-ink-muted">{description}</span>
      </span>
    </label>
  );
}

/**
 * A miniature page painted with a theme's own colours. Putting `data-theme` on the
 * swatch makes every token inside it resolve to that theme, so no colour is written here.
 */
function Swatch({ theme }: { theme: string }) {
  return (
    <span data-theme={theme} aria-hidden="true" className="grid h-11 w-16 shrink-0 grid-rows-[auto_1fr] gap-1 overflow-hidden rounded-sm border border-outline bg-background p-1.5">
      <span className="h-1.5 w-8 rounded-sm bg-ink-muted" />
      <span className="flex items-end gap-1">
        <span className="h-2.5 w-5 rounded-sm bg-primary" />
        <span className="h-2.5 w-4 rounded-sm bg-surface-raised ring-1 ring-outline" />
      </span>
    </span>
  );
}

/** "Match system" shows the dark and light swatches side by side, each half-width. */
function SystemSwatch() {
  return (
    <span aria-hidden="true" className="flex h-11 w-16 shrink-0 overflow-hidden rounded-sm border border-outline">
      <span data-theme="dark" className="w-1/2 bg-background p-1.5"><span className="block h-1.5 w-full rounded-sm bg-ink-muted" /></span>
      <span data-theme="light" className="w-1/2 bg-background p-1.5"><span className="block h-1.5 w-full rounded-sm bg-ink-muted" /></span>
    </span>
  );
}

const densities: { id: Density; title: string; description: string }[] = [
  { id: "compact", title: "Compact", description: "More on the screen at once. Best for a desktop." },
  { id: "comfortable", title: "Comfortable", description: "Larger buttons and rows. Best for tablets and touch." },
];

/**
 * Theme and density. A choice applies at once and is remembered on this device
 * (it is not tied to your account), so each device can look different.
 */
export function AppearanceSettings() {
  const { preference, density, setTheme, setDensity } = useAppearance();
  return (
    <div className="space-y-6">
      <Fieldset legend="Theme">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <Choice name="theme" value="system" checked={preference === "system"} onSelect={() => setTheme("system")} title="Match system" description="Follows the light or dark setting of your device." preview={<SystemSwatch />} />
          {selectablePresets.map((preset) => (
            <Choice key={preset.id} name="theme" value={preset.id} checked={preference === preset.id} onSelect={() => setTheme(preset.id)} title={preset.label} description={preset.description} preview={<Swatch theme={preset.id} />} />
          ))}
        </div>
      </Fieldset>
      <Fieldset legend="Density">
        <div className="grid gap-2 sm:grid-cols-2">
          {densities.map((item) => (
            <Choice key={item.id} name="density" value={item.id} checked={density === item.id} onSelect={() => setDensity(item.id)} title={item.title} description={item.description} />
          ))}
        </div>
      </Fieldset>
    </div>
  );
}
