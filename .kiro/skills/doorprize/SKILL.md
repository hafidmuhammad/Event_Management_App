---
name: doorprize
description: Use for event-scoped checked-in prize draws stored in events.doorprize_json.
---

- Contract is version 1 with settings, prizes, winner category, winner count (`quantity`), and `{ participantId, drawnAt }` winner snapshots.
- Eligibility defaults to `CHECKED_IN`; event id is always scoped. `allowMultipleWin` defaults to false.
- Draws use server-side `crypto.randomInt` inside a transaction that locks the event row; quantity and duplicate rules are rechecked on the server.
- Redraw is explicit: remove the current winner, then draw again. Missing participant records render as unavailable.
- Admin and Event Manager manage prizes/draws; the management UI exposes a prominent Draw winner action, winner slots, and selected-winner history. Receptionist is read-only. Display is authenticated and exposes only category, prize name, and name/company.
- Tests cover checked-in eligibility, duplicate prevention, no-eligible state, quantity, and cross-event isolation.
- Authenticated display routes live in the presentation route group outside the dashboard shell, with fullscreen and return controls.
- Management displays the current eligible checked-in count and disables draw when zero. Draw requires confirmation and pending feedback; transaction rechecks remain authoritative.
- Editing a prize uses a spacious modal with sticky save. Draw/removal transactions persist audit entries; staff actions also record operator confirmation. Browser confirm dialogs are not used.
- Candidate review shows up to 100 eligible names/company entries, never email or phone. Count and list share the same event/status/prior-winner filter; the draw transaction is still authoritative.
