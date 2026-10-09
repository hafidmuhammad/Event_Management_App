---
name: global-library
description: Use for the event-independent library — global email templates and global contact lists (address books), their pages under /library, export, and how events consume them.
---

# Global library

Two event-independent resources live under `/library` and are reachable from the
sidebar: global email templates and global contact lists.

## Data

- `global_email_templates`: `name`, `description`, `type`, `subject`, versioned `content_json`, `created_by`. There is deliberately **no** `event_id` and **no** `recipient_json` — a global template is a blueprint and can never address or send anything.
- `contact_lists`: `name`, `description`, `created_by`.
- `contacts`: `list_id` (cascade delete), `name`, `email`, `company`, with a unique index on `(list_id, email)`.
- Service layer: `src/services/library.ts`. Validation: `src/lib/validation/library.ts`.
- Migration `drizzle/0004_*.sql` is additive. Apply it to the test database with `npm run db:migrate:test`, which never touches development data.

## Rules

- Only ADMIN and EVENT_MANAGER can read or write the library. Pages call `requireRole`; the export route returns 401 for a missing session and 403 for an authenticated role without permission.
- Saving, editing, or deleting a global template never sends email. Deleting a blueprint leaves event templates already created from it untouched.
- `addContacts` skips addresses already in the list and reports `{ added, skipped }`; it never updates an existing contact silently.
- `parseContactRows` accepts `name, email, company` per line, comma/semicolon/tab separated, or a bare email address (the local part becomes the name). A header row starting with `name` is ignored. Duplicates are collapsed and invalid rows are returned so the UI can report them instead of dropping them.
- Export is `GET /api/library/contacts/[listId]/export?format=csv|xlsx`. CSV quotes and escapes every cell and is prefixed with a BOM so Excel reads UTF-8 correctly. XLSX is generated with `xlsx` imported dynamically so it stays out of the shared bundle.
- Contact lists feed email recipients additively — see the `email-management` skill. Deleting a list removes those recipients from any event that selected it.
- `/library` redirects to `/library/email-templates`.
- Every library route has a `loading.tsx` skeleton built from `LoadingStatus` + `Skeleton` that mirrors the real layout (card grid for templates and lists, table rows for a list's contacts). New library routes must ship one too.
- Global template compose uses the same `ComposeWindow` and `EmailBuilder` as event templates, minus the recipient rows.
- Library mutations are server actions in `src/app/(dashboard)/library/actions.ts` returning `{ ok, error?, notice? }` and are submitted through `ActionForm`, which toasts the result and dispatches `app:process-complete` to close the surrounding modal.
