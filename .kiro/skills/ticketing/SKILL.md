# Ticketing

- Approval creates or returns exactly one ticket through `src/services/tickets.ts`.
- Only `APPROVED` or `CHECKED_IN` participants are eligible. Ticket numbers and cryptographically random QR tokens contain no PII.
- Validity is copied from the event. Public access is only `/t/[secure-token]`, never a sequential id.
- Test idempotency, event isolation, validity, and token uniqueness whenever ticket behavior changes.
- Email context may use a ticket number and secure public URL; raw QR tokens must not be logged or exposed outside the generated ticket URL.
