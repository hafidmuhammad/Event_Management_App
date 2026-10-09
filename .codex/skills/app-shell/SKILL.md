---
name: app-shell
description: Use when changing the dashboard shell, sidebar, top bar, navigation entries, theming tokens, theme presets, density, or light-mode correctness in the Event Management App.
---

# App shell and theming

Details of the UI rules (primitives, aturan toolbar, forbidden patterns) are in `.kiro/steering/design-system.md`. This skill records how the shell and theming work.

## Shell structure

- `DashboardShell` (server) builds the top bar and hands it to `AppFrame` (client), which owns the sidebar and its collapse state.
- Sidebar width and content padding both read density tokens: `--sidebar-w` and `--sidebar-w-collapsed` (14rem / 3.5rem compact, 16rem / 4rem comfortable). Never pad the content with a separate hardcoded width.
- The collapse state is persisted in `localStorage` under `app:sidebar-collapsed` and is a convenience only, so failures are swallowed. When collapsed the links keep a `title` and move their label into `sr-only`.
- The sidebar shows from `lg:` up; below that the shell renders the horizontal mobile nav under the top bar.
- Navigation entries live in `dashboard-navigation.tsx`: Dashboard, Events, and Library (one entry with Email templates and Contacts tabs). Library is limited to ADMIN and EVENT_MANAGER through a `roles` field. `/dashboard` matches exactly; everything else matches the prefix.
- The top bar is one fixed-height row (`min-h-topbar`). On the right it has one control: `ProfileMenu`, the avatar button. Its dropdown shows the signed-in name and role, a **Settings** link to `/settings`, and Log out (which still asks for confirmation). There is no gear menu any more; `AccountMenu` and `SettingsMenu` no longer exist. `AppearanceMenuItems` is still used by `ThemePicker` on the login screen.
- `/settings` (`src/app/(dashboard)/settings`) is open to every role. It has a Profile card (`ProfileForm`: editable name, read-only email and role) and an Appearance card (`AppearanceSettings`: theme cards with a live swatch, plus density). Theme and density are per device (localStorage), not per account.
- `updateProfileAction` renames only the signed-in user (the id comes from the session, never the form) and validates with `profileSchema` (2 to 160 characters, whitespace collapsed). It then calls `unstable_update` so the session cookie carries the new name. The `jwt` callback in `src/auth.ts` handles `trigger === "update"` by re-reading the name from the database and ignoring the payload, because the payload can come from the browser. Email, role and status are never writable from this page.

## Theming

- Every colour is a CSS variable. The values live in `src/lib/theme/presets.ts`; the `[data-theme="..."]` blocks in `src/app/globals.css` between `/* theme-presets:start */` and `/* theme-presets:end */` are **generated** from it. Do not edit that region by hand. Run `pnpm theme:css` after changing a preset, `pnpm theme:css --check` to verify, and `pnpm theme:contrast` for the WCAG report.
- Presets: `dark` (default, Octo Code), `light`, `geist-dark`, `geist-light`, `brand-dryport` (derived from the logo, not an official brand guide), `high-contrast`, and `stage`. `stage` is not user-selectable; `src/app/(presentation)/layout.tsx` applies it to that route group only, with larger type and a warm accent.
- The theme is `data-theme` and the density is `data-density` on `<html>`. A boot script built by `themeBootScript()` in `presets.ts` runs in `<head>` before first paint. It reads `event-theme` and `event-density` from `localStorage`; an unknown or missing theme falls back to the operating system's light/dark setting. The old plain `light` / `dark` values are valid preset ids, so existing choices keep working.
- `useAppearance()` (`src/lib/theme/use-appearance.ts`) reads and writes these choices. "Match system" removes the saved theme and keeps following the OS while the app is open.
- `AppearanceMenuItems` renders the theme and density choices inside any dropdown; `ThemePicker` is the stand-alone button used on the login screen.
- Tailwind maps the variables to utilities (`bg-surface`, `text-ink-muted`, `border-outline`, `bg-primary`, `text-danger-ink`, `from-hero-start`). Components use only those. No hex and no inline colour styles in `src`.
- Intentional exceptions where light colours are correct regardless of theme: the email preview paper (`--paper*` tokens) in `email-builder.tsx` and the event email page, the QR code background in `/t/[token]`, and the hardcoded hex inside `src/services/email.ts`.

## Audit commands

```powershell
# no hex literals outside the allowed exceptions (expect email.ts, email-builder.tsx, t/[token] only)
Get-ChildItem -Recurse -Path src -Include *.tsx,*.ts | Select-String -Pattern '#[0-9A-Fa-f]{6}\b'
pnpm theme:css --check
pnpm theme:contrast
```

Do not run `next build` while `next dev` or `next start` is running from the same folder; it corrupts `.next`. Verify from a copy instead.
