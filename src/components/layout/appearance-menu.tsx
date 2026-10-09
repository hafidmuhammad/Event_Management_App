"use client";

import { Palette } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { selectablePresets } from "@/lib/theme/presets";
import { useAppearance, type Density } from "@/lib/theme/use-appearance";

/**
 * Theme and density choices as menu items. Drop it inside any DropdownMenuContent
 * (the account menu in the top bar does). Choosing an item applies it at once and
 * saves it on this device; "Match system" clears the saved theme.
 */
export function AppearanceMenuItems() {
  const { preference, density, setTheme, setDensity } = useAppearance();
  return (
    <>
      <DropdownMenuLabel>Theme</DropdownMenuLabel>
      <DropdownMenuRadioGroup value={preference} onValueChange={setTheme}>
        <DropdownMenuRadioItem value="system">Match system</DropdownMenuRadioItem>
        {selectablePresets.map((preset) => <DropdownMenuRadioItem key={preset.id} value={preset.id}>{preset.label}</DropdownMenuRadioItem>)}
      </DropdownMenuRadioGroup>
      <DropdownMenuSeparator />
      <DropdownMenuLabel>Density</DropdownMenuLabel>
      <DropdownMenuRadioGroup value={density} onValueChange={(value) => setDensity(value as Density)}>
        <DropdownMenuRadioItem value="compact">Compact</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="comfortable">Comfortable</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </>
  );
}

/** Stand-alone appearance button, for pages without the account menu (the login screen). */
export function ThemePicker() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IconButton label="Appearance" title="Appearance" tooltip={false} variant="outline" size="icon-sm"><Palette aria-hidden="true" /></IconButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" aria-label="Appearance"><AppearanceMenuItems /></DropdownMenuContent>
    </DropdownMenu>
  );
}
