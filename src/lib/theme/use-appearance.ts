"use client";

import { useCallback, useSyncExternalStore } from "react";
import { defaultThemeId, selectablePresets } from "./presets";

const THEME_KEY = "event-theme";
const DENSITY_KEY = "event-density";
const CHANGE_EVENT = "appearance:change";

export type ThemePreference = "system" | string;
export type Density = "compact" | "comfortable";

const validIds = new Set(selectablePresets.map((preset) => preset.id));

function readStored(key: string) {
  try { return window.localStorage.getItem(key); } catch { return null; }
}
function writeStored(key: string, value: string | null) {
  try { if (value === null) window.localStorage.removeItem(key); else window.localStorage.setItem(key, value); } catch { /* The choice still applies for this page view. */ }
}
function systemTheme() {
  try { return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"; } catch { return defaultThemeId; }
}

function readPreference(): ThemePreference {
  const stored = readStored(THEME_KEY);
  return stored && validIds.has(stored) ? stored : "system";
}
function readDensity(): Density {
  return document.documentElement.dataset.density === "comfortable" ? "comfortable" : "compact";
}

function subscribe(notify: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: light)");
  // With no saved choice the app follows the operating system, including while it is open.
  const onSystemChange = () => {
    if (readPreference() === "system") document.documentElement.setAttribute("data-theme", systemTheme());
    notify();
  };
  const observer = new MutationObserver(notify);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-density"] });
  window.addEventListener(CHANGE_EVENT, notify);
  window.addEventListener("storage", notify);
  media.addEventListener("change", onSystemChange);
  return () => {
    observer.disconnect();
    window.removeEventListener(CHANGE_EVENT, notify);
    window.removeEventListener("storage", notify);
    media.removeEventListener("change", onSystemChange);
  };
}

/**
 * Current theme and density, plus setters. The source of truth is the
 * `data-theme` / `data-density` attributes on <html> (set before paint by the
 * boot script) and `localStorage`. "system" means: nothing saved, follow the OS.
 */
export function useAppearance() {
  const preference = useSyncExternalStore(subscribe, readPreference, () => "system" as ThemePreference);
  const density = useSyncExternalStore(subscribe, readDensity, () => "compact" as Density);

  const setTheme = useCallback((next: ThemePreference) => {
    const resolved = next === "system" ? systemTheme() : validIds.has(next) ? next : defaultThemeId;
    document.documentElement.setAttribute("data-theme", resolved);
    writeStored(THEME_KEY, next === "system" || !validIds.has(next) ? null : next);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const setDensity = useCallback((next: Density) => {
    document.documentElement.setAttribute("data-density", next);
    writeStored(DENSITY_KEY, next);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { preference, density, setTheme, setDensity };
}
