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
- Publishing a draft opens a review dialog with a rendered preview of the latest Ready `INVITATION` template and the full list of `INVITED` recipients. The server rechecks that template and recipient list before publishing; only those invitees receive the invitation.
- Date relationships are validated by `src/lib/validation/events.ts` on the server and shown next to the relevant form field.

## Committee

Committee ordering uses a pointer drag grip in the Order column (mouse, pen, touch), with a highlighted drop target. Arrow Up/Down on the focused grip provides keyboard ordering; Escape/pointer cancellation cancels the drag. Moving inserts a row at its target position rather than swapping distant rows. Changes remain draft until Save committee. Separate Move up/down buttons are removed.

Committee is not authentication or permission data. It is stored in `events.committee_json` as an array of `{ name, position, phone, email }`, validated by Zod, and edited through the compact overview editor.
Optional `division` is supported without a schema migration (JSON). Ordering uses drag grips with keyboard support; the editor offers a downloadable Excel example, bulk validation, and application-modal confirmation before replacing/deleting draft members. Contact fields are not required. Copy share link and embedded modal preview are available; saved order is retained in public credits.
Committee uses a compact table for all staff roles. The current editor offers inline name/position editing, add/import/example/dummy/save controls, and confirmed delete. Ordering is handled by the row grip instead of action buttons. Explicit Save committee persists the draft list. RECEPTIONIST sees the read-only table and preview/share only.

The event overview includes actionable readiness links and event-scoped recent activity. Dashboard shows live totals, recent-event readiness warnings, failed delivery count, and recent activity. Settings enter times in fixed Asia/Jakarta/WIB and review date conflicts before save.

## Authorization and services

- `src/services/events.ts` owns event reads, mutations, publish validation, and committee persistence.
- Server actions in `src/app/(dashboard)/events/actions.ts` authenticate and authorize before calling the service.
- RECEPTIONIST is read-only for event and committee operations.
- Doorprize and award JSON are stored on the event; only ADMIN/EVENT_MANAGER can mutate them. Doorprize eligibility defaults to CHECKED_IN.

## UI and tests

Use Octo Code dark/light tokens, 32–36px controls, compact tables, and small status badges. Admin create/insert flows for events, email templates, doorprizes, awards, and committee members open in the shared modal component; public registration remains a dedicated shareable route. Committee entry accepts name and position only, supports `.xlsx`, `.xls`, and `.csv` import, and offers demo data before save. Uploaded prize and award images show an in-form preview with a small remove control before submit. Committee display is a full-screen scrolling closing-credit view for event screens. Relevant validation and service tests live under `src/services` and `src/lib/validation`; final QA covers all event-scoped flows and display routes.

## UI control placement (ui-modernization)

Secondary actions sit in a `...` overflow menu; at most two actions stay visible per card, row, or header. Destructive actions (delete prize/award, remove winner, cancel registration, waitlist) are menu items that still ask for confirmation through the application dialog. Committee keeps Add member and Save committee visible; Import Excel, Template, and Dummy data are in the menu. Participant rows keep Approve visible; Waitlist and Review are in the menu. Doorprize cards keep Draw winner and Edit prize visible. Awards cards keep Edit visible. Check-in, presentation controls, and the committee credits page use the roomier `data-density="comfortable"` sizing for touch and stage use; the rest of the app is compact by default.
