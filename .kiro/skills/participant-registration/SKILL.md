# Participant Registration

## Public registration

- Public route: `/events/[eventId]/register`.
- The route and registration action require no login. Participant management offers a modal preview and a copy-public-link button; preview shares RegistrationFields with the real form, disables all inputs, and has no submission action. Draft previews do not publish events or enable public registration.
- Registration is accepted only when the event is `PUBLISHED` and the current time is inside its registration window. Draft, cancelled, not-yet-open, and closed states return an explanatory state instead of a form.
- Successful registrations create a `PENDING` participant and show `Registration Received`; no ticket is created at registration. A reviewed non-draft REGISTRATION_RECEIVED template may trigger automatic mail after the database operation; draft/missing templates are skipped.
- Public registration and staff status changes write activity entries. Staff confirmation is via the application modal; route feedback is shown as toast.

## Normalization and lifecycle

- Email is trimmed and lowercased.
- Phone is trimmed, basic separators are removed, and a leading `00` is converted to `+`.
- Duplicate email or phone is blocked only within the same event; the same person may register for another event.
- Operational statuses include `PENDING`, `WAITLIST`, `APPROVED`, `REJECTED`, `CANCELLED`, plus existing future statuses.

## Approval and capacity

- `src/services/participants.ts` contains approval business logic, event isolation, waitlist, reject, cancel, and paginated search/filter.
- Approval is allowed only from `PENDING` or `WAITLIST`.
- Approved occupancy counts `APPROVED` and `CHECKED_IN`; pending/waitlist/rejected/cancelled do not consume capacity.
- Approval runs in a MySQL transaction, locks the event row with `FOR UPDATE`, checks capacity, and then updates the participant. Full capacity returns `EVENT_CAPACITY_REACHED`.
- A successful approval also idempotently ensures the participant has one ticket through `src/services/tickets.ts`.
- Registration, approval, and rejection email hooks must run after the database operation and may never roll back the participant transition when mail delivery fails.
- Reject stores `rejected_at` and `rejection_reason`; rows are never deleted.

## Authorization and isolation

ADMIN and EVENT_MANAGER may manage participants. RECEPTIONIST may view but cannot approve, waitlist, reject, or cancel. Every participant read and mutation scopes by both `event_id` and participant id.

## Tests

Run `npm.cmd test`. Focused validation and MySQL integration tests cover windows, normalization, waitlist/reject transitions, capacity decisions, and event isolation; final QA also verifies migration, lint, typecheck, and build.
