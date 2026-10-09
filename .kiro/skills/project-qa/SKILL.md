---
name: project-qa
description: Final QA checklist for the Event Management MVP.
---

- Apply migrations to clean development/test databases, then seed only the intended environment.
- Verify auth, role authorization, IDOR/event isolation, input validation, safe uploads, XSS escaping, email privacy, and QR token rules.
- Exercise Event, Participant, Ticket, QR, Check-in, Email, Doorprize, and Award flows, including empty/error states and mobile-critical pages.
- Verify admin create/insert actions open the in-context modal and do not navigate away from the current workspace.
- Check modal focus trap/restore, unsaved close confirmation, mobile event navigation, theme persistence, and independent authenticated presentation shells.
- Draft email templates must never send automatically or broadcast. Exercise post-resolution link validation, uploaded image URLs, QR content/size, and explicit broadcast review.
- Run the repository scripts: `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd test`, and `npm.cmd run build`.
- `npm test` first verifies TEST_DATABASE_URL is present and distinct from development. Never bypass this guard or reset development data.
- When a feature touches event-scoped data, include a cross-event integration test; when it changes security, include an authorization or validation test.
- Verify additive support migration (12 tables, 15 foreign keys), persistent broadcast/delivery event isolation, safe structured rich-text escaping, WIB input round-trip, and route-to-toast decoding. Apply pending migrations to the test database with `npm.cmd run db:migrate:test` before running tests; never reset development data.
- Verify the compose window: opens full screen, minimize keeps the draft mounted and the page usable, restore and close work, dirty close confirms, and live preview opens as a modal rather than a side pane.
- Verify the global library: templates carry no event scope or recipients, applying one keeps the configured recipients, contact import reports added/skipped/rejected counts, CSV and XLSX export download with the right content type, and non-managers receive 401/403 from the export route.
- Verify the shell: no gap between sidebar and top bar at `lg` and up, sidebar minimize persists across reloads, collapsed labels remain screen-reader accessible, and mobile navigation still lists every entry.
- Verify light mode on every route, including dashboard, events, check-in, doorprize, awards, email compose, and the library pages. Run the hex audit command in the `app-shell` skill; the only acceptable light-coloured surfaces are the email preview paper, the QR background, and `src/services/email.ts`.
- Source scan must find no window.confirm/alert/prompt. Native dialog focus and draft recovery remain browser QA requirements; if Computer Use fails, mark visual QA unverified rather than claiming full completion.
