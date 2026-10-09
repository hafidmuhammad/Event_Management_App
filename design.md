# Octo Code

## Overview

Octo Code is a developer-centric design system inspired by the world's largest code collaboration platform. It embraces a dark-mode-first philosophy with precise syntax-highlighting-friendly colors, clean typography, and an interface that puts code front and center. The aesthetic is functional, information-dense, and unapologetically built for people who live in terminals and pull requests.

**How this document maps to code.** The hex values below are the *Octo Code* palette. In the app they are not written into components: they live as theme tokens in `src/lib/theme/presets.ts` (presets `dark` and `light`) and reach components through Tailwind utilities such as `bg-surface` and `text-ink-muted`. See "Token layer, themes and density" at the end. Other presets (Geist, Cikarang Dryport, high contrast, stage) reuse the same token names with different values; this document stays the reference for the default look.

## Colors

- **Primary** (`#2F81F7`): Interactive elements, links, buttons, selected states — Mona Blue
- **Primary Hover** (`#388BFD`): Hovered links and buttons, slightly brighter for affordance
- **Secondary** (`#238636`): Merge buttons, success states, additions in diffs — Growth Green
- **Neutral** (`#8B949E`): Secondary text, icons, timestamps, subtle labels
- **Background** (`#0D1117`): Page background, the foundation dark canvas — Void Black
- **Surface** (`#161B22`): Cards, panels, sidebar backgrounds, elevated containers
- **Text Primary** (`#E6EDF3`): Primary text, headings, code content — high contrast on dark
- **Text Secondary** (`#8B949E`): Descriptions, meta information, secondary labels
- **Border** (`#30363D`): Dividers, card borders, input outlines, table rules
- **Success** (`#3FB950`): Successful checks, merged PRs, online indicators
- **Warning** (`#D29922`): Pending reviews, draft states, caution alerts
- **Error** (`#F85149`): Failed checks, merge conflicts, destructive actions

## Typography

- **Display Font**: Geist Sans — bundled with the app through the `geist` package (no Google Fonts request)
- **Body Font**: Geist Sans
- **Code Font**: Geist Mono — ticket numbers, IDs, and code-like values

Geist Sans is used at weights 400, 500, and 600 across all non-code UI. Display headings use 600 weight with `-0.02em` letter-spacing for a tight, engineered feel. Body text sits at 400 weight with default letter-spacing. Geist Mono renders ticket numbers, tokens, and other code-like values at 400 weight. Inter and Segoe UI remain as fallbacks if the bundled font fails to load.

The type scale is compact to maximize information density and follows the density setting (see below). Compact: 11px (labels), 13px (body/default), 14px (section titles), 20px (page titles), 24px (statistics). Comfortable: 12px labels and 14px body. The large `display` (30px) and `title` (24px) sizes are for presentation screens and become 60px and 36px in the `stage` theme.

## Elevation

Elevation is expressed through background color layering rather than shadows. The base layer is `#0D1117`, cards and panels lift to `#161B22`, popovers and dropdowns to `#1C2128`, and modals to `#21262D` with a semi-transparent backdrop overlay at `rgba(1, 4, 9, 0.8)`. Subtle box-shadows of `0 1px 0 rgba(27, 31, 36, 0.04)` are used sparingly on sticky headers and floating action bars. The philosophy is flat and layered — depth comes from color differentiation, not shadow theatrics.

## Components

- **Buttons**: Primary uses `#238636` background with `#FFFFFF` text, 6px radius, 12px horizontal padding, 500 weight. Danger variant uses transparent background with `#F85149` text, bordered. Outline variant uses transparent background, `#30363D` border, `#C9D1D9` text. Compact density: 32px default height with a 28px small variant and a 40px large variant. Comfortable density: 40px, 32px, and 48px. Hover states brighten background by approximately 10%; on themes where white text on the lighter shade would fall under 4.5:1 contrast, hover darkens instead.
- **Menus and toolbars**: Secondary actions live in a `...` overflow menu; a card, row, or header shows at most two actions. Destructive actions are always in the menu, last, in the danger colour, and ask for confirmation. Menus float above the page and never push surrounding content when they open (popovers, not in-flow panels). Menu surface is the popover layer colour (`#1C2128`) with a 1px border and the only drop shadow in the system.
- **Cards**: `#161B22` background, 1px solid `#30363D` border, 6px radius, 16px padding. Repository cards show name in `#58A6FF` link color, description in `#8B949E`, and language dot plus star count in the footer. Hover adds a subtle border color shift to `#484F58`.
- **Inputs**: `#0D1117` background, 1px solid `#30363D` border, 6px radius, 8px 12px padding, 14px font size. Focus state applies a 2px solid `#2F81F7` outline with 2px offset. Placeholder text uses `#484F58`. Search inputs show a `/` keyboard shortcut hint badge.
- **Chips**: Used for labels and topics. 24px height, 12px horizontal padding, 9999px radius, 12px font, 500 weight. Label chips use their assigned color as a background at 30% opacity with full-color text. Topic chips use `#1C2128` background with `#58A6FF` text.
- **Lists**: Repository and file lists use full-width rows with 8px 16px padding and a `#30363D` bottom border. Hover highlights the row to `#161B22`. Selected/active rows get a 2px left border in `#F78166` (orange accent).
- **Checkboxes**: 16x16px, `#0D1117` background, 1px solid `#30363D` border, 3px radius. Checked state fills `#2F81F7` with a white checkmark SVG. Used prominently in task lists within issues and PRs.
- **Tooltips**: `#21262D` background, `#C9D1D9` text, 6px radius, 6px 10px padding, 12px font. Arrow-tipped, positioned above by default. 200ms delay on hover. Max-width 250px.
- **Navigation**: Top nav is `#161B22` with a 1px bottom border `#30363D`, 48px height in compact density and 60px in comfortable density (it follows the density setting). Tab navigation uses underline-style active indicator — 2px bottom border in `#F78166` (orange) for the active tab and `#8B949E` text for inactive tabs. Sidebar nav uses `#0D1117` background with hover-highlighted rows.
- **Search**: Prominent top-bar search with `#0D1117` background, `#30363D` border, 6px radius. Activated state expands to a full-width overlay with typeahead suggestions on a `#161B22` dropdown. Search shortcut `/` is displayed as a muted kbd badge.

## Spacing

- Base unit: 4px
- Scale: 4px, 8px, 12px, 16px, 24px, 32px, 40px, 48px, 64px
- Component padding: Buttons 12px 20px, inputs 8px 12px, cards 16px, chips 4px 12px
- Section spacing: 24px between content sections, 48px between major page sections
- Container max width: 1280px (wide layout), 1012px (readable content), 768px (narrow/settings)
- Card grid gap: 16px between repository cards, 0px for list views (border-separated)

## Border Radius

- 3px: Checkboxes, small badges, inline code snippets
- 6px: Buttons, inputs, cards, dropdowns, modals, most components
- 12px: Avatar images, large promotional cards
- 20px: Marketing page hero elements, onboarding cards
- 9999px: Pills, label chips, topic tags, notification counters

## Do's and Don'ts

- Do use the dark palette as the default — light mode is secondary.
- Do use Geist Mono for anything code-related: ticket numbers, tokens, file names, and IDs.
- Do rely on color layering (`#0D1117` > `#161B22` > `#1C2128`) for visual hierarchy instead of shadows.
- Do keep information density high — developers prefer seeing more data with less scrolling.
- Don't use more than 600 weight for any text — the interface should feel precise, not loud.
- Don't use rounded corners larger than 6px on functional UI elements. Presentation screens (doorprize and award display) are the exception: their hero cards use the 12px tier above.
- Don't write hex colours or inline colour styles in components. Use the token utilities; the only literal colours allowed are in email HTML, the email preview paper, and the QR code (see `.kiro/steering/design-system.md`).
- Don't animate transitions longer than 150ms — the interface should feel instant.
- Don't use the primary blue (`#2F81F7`) for large background fills — reserve it for interactive elements and links.

## Token layer, themes and density

Every colour, shadow, and size is a CSS variable. Components use Tailwind utilities that point at those variables, so changing the theme or density changes the whole app with no per-component overrides.

- **Where values live**: `src/lib/theme/presets.ts`. The `[data-theme]` blocks in `src/app/globals.css` are generated from it (`pnpm theme:css`; `pnpm theme:css --check` verifies they are in sync).
- **Themes** (`data-theme` on `<html>`): `dark` (default, the palette in this document), `light`, `geist-dark`, `geist-light`, `brand-dryport`, `high-contrast`. `stage` is applied only to presentation screens by their layout and is not user-selectable. The user's choice is saved on the device and applied before first paint; with no choice the app follows the operating system's light/dark setting.
- **Contrast**: every text pair in every preset must be at least 4.5:1 (7:1 for `high-contrast`). Check with `pnpm theme:contrast`. Input borders in the Octo Code palettes are below 3:1; this is inherited from the original palette and reported, not hidden.
- **Density** (`data-density`): `compact` is the default; touch devices and screens up to 639px automatically use `comfortable`. A region can opt in by setting `data-density="comfortable"` on itself (check-in, presentation controls, credits).
- **Brand note**: `brand-dryport` is derived from the blue and orange of the logo mark. It is not taken from an official brand guide; confirm the real brand colours before treating it as final.
- **Token names**: surfaces `background`, `surface`, `surface-raised`, `surface-sunken`, `overlay`; text `ink`, `ink-strong`, `ink-muted`, `ink-subtle`, `link`; borders `outline`, `outline-soft`, `outline-strong`; actions `primary` (`-hover`, `-fg`, `-soft`), `sky`, `accent`; status `success`, `warning`, `error`, `info` (each with `-soft` and `-ink`); email paper `paper*`; presentation `hero-start`, `hero-end`.
