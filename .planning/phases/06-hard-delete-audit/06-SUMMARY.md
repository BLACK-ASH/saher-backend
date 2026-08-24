# Phase 06 SUMMARY — Hard-Delete Audit

## What shipped
- `isDeleted` added to CalendarEvent, Bank, Holiday, Notice models.
- Soft delete converted: calendar event (shared `invalidateCalendarRange` helper), bank, holiday, notice. Restore endpoints added for all four; user repeat-delete backdoor (`findByIdAndDelete` on inactive users) removed → 404, record survives.
- Read/update filters: calendar aggregates + dup-check + edit; holiday get/all/update/dup-check; notice list/edit; bank service read + edit.
- PushSubscription hard deletes kept (device infra — user-approved).
- RBAC note: bank restore mounted under `authorize('update','bank')` — manager-only (admin is read-only on bank).

## Tests
Restore round-trips added: calendar event, bank (deleted-invisible → restore → visible), holiday (delete/404-repeat/restore/read-back), notice (soft-delete/list-hide/404-repeat/restore). Existing user hard-delete test rewritten to assert NO permanent delete.

## Verification
`pnpm typecheck` 0 errors · lint 0 errors · vitest suite green.
