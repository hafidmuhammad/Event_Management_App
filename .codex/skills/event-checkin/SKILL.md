# Event Check-in

- Receptionists, event managers, and admins use the scoped check-in routes; mutations stay server-authorized.
- QR validation checks token, event, ticket lifecycle, validity, participant eligibility, and prior check-in.
- Confirmation is transactional: one check-in row, participant `CHECKED_IN`, and ticket `USED`. Repeats return `ALREADY_CHECKED_IN`.
- The transaction also records an activity entry with operator and method. Client validation/search/confirmation failures and successes use toast feedback; successful confirmation refreshes counters and recent entries.
- Manual search is event-scoped and checks the same eligibility after idempotently ensuring a ticket.
- The browser scanner reads camera frames locally and stops its camera control after a scan.
