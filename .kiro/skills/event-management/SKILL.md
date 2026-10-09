# Event Management

## Purpose

Facts for the final event workspace. Keep this skill aligned with the implementation across event, participant, ticket, check-in, email, doorprize, and award features.

## Routes

- `/events`: authenticated compact event list with search, status filter, and create action.
- `/events/new`: ADMIN/EVENT_MANAGER create form.
- `/events/[eventId]`: overview metrics, schedule, committee editor, and publish action.
- `/events/[eventId]/committee`: dedicated committee workspace.
- `/events/[eventId]/edit`: ADMIN/EVENT_MANAGER edit form.
- `/events/[eventId]/settings`: ADMIN/EVENT_MANAGER settings form.
- `/events/[eventId]/participants`: scoped participant operations.
- `/events/[eventId]/register`: public registration form.
- `/events/[eventId]/doorprize`: checked-in participant prize draw.
- `/events/[eventId]/awards`: curated award management.
- `/events/[eventId]/display/doorprize` and `/events/[eventId]/display/awards`: authenticated presentation views.
- `/events/committee-display/[token]`: shareable full-screen committee closing credits; the event ID is encrypted inside the token.

## Lifecycle and rules

- New events are `DRAFT`; statuses are `DRAFT`, `PUBLISHED`, `ONGOING`, `FINISHED`, and `CANCELLED`.
- Publish is available to ADMIN and EVENT_MANAGER only and requires valid name, capacity (when used), registration window, event schedule, and ticket-validity window.
- Date relationships are validated by `src/lib/validation/events.ts` on the server and shown next to the relevant form field.

## Committee

Committee is not authentication or permission data. It is stored in `events.committee_json` as an array of `{ name, position, phone, email }`, validated by Zod, and edited through the compact overview editor.
Optional `division` is supported without a schema migration (JSON). The editor provides division filters, explicit order arrows, a downloadable Excel example, bulk validation, and application-modal confirmation before replacing/deleting draft members. Contact fields are not required. Copy share link and embedded modal preview are available; saved order is retained in public credits.
Committee uses a compact table for all staff roles. Three-dot disclosure menus contain management actions (add, import, dummy, example, save), row actions (modal edit, move up/down, confirmed delete), and preview/share actions. Add/edit modals stage a draft and confirm discard; explicit Save committee persists the list. RECEPTIONIST sees the table and preview/share only. Menus support native keyboard disclosure and Escape.

The event overview includes actionable readiness links and event-scoped recent activity. Dashboard shows live totals, recent-event readiness warnings, failed delivery count, and recent activity. Settings enter times in fixed Asia/Jakarta/WIB and review date conflicts before save.

## Authorization and services

- `src/services/events.ts` owns event reads, mutations, publish validation, and committee persistence.
- Server actions in `src/app/(dashboard)/events/actions.ts` authenticate and authorize before calling the service.
- RECEPTIONIST is read-only for event and committee operations.
- Doorprize and award JSON are stored on the event; only ADMIN/EVENT_MANAGER can mutate them. Doorprize eligibility defaults to CHECKED_IN.

## UI and tests

Use Octo Code dark/light tokens, 32–36px controls, compact tables, and small status badges. Admin create/insert flows for events, email templates, doorprizes, awards, and committee members open in the shared modal component; public registration remains a dedicated shareable route. Committee entry accepts name and position only, supports `.xlsx`, `.xls`, and `.csv` import, and offers demo data before save. Uploaded prize and award images show an in-form preview with a small remove control before submit. Committee display is a full-screen scrolling closing-credit view for event screens. Relevant validation and service tests live under `src/services` and `src/lib/validation`; final QA covers all event-scoped flows and display routes.
