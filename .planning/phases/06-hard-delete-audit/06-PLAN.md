---
wave: 1
depends_on: []
files_modified:
  - src/database/calendar-event.model.ts
  - src/database/bank.model.ts
  - src/database/holiday.model.ts
  - src/database/notice.model.ts
  - src/calendar/calender.controller.ts
  - src/calendar/calendar.routes.ts
  - src/libs/utils/calendar.ts
  - src/admin/bank/controller.ts
  - src/admin/_services/bank.ts
  - src/attendance/holiday/holiday.controller.ts
  - src/notice/notice.controller.ts
  - src/admin/user/controller.ts
autonomous: true
---

# Phase 06: Plan — Soft Delete + Restore Everywhere

**Goal:** No hard-delete path remains for business resources; every converted resource has a restore endpoint and invisible-on-read deleted docs.

## must_haves
- [ ] `grep -rE "deleteOne|deleteMany|findByIdAndDelete" src` matches ONLY PushSubscription sites (webpush.controller.ts, push-notification.ts).
- [ ] CalendarEvent/Bank/Holiday/Notice schemas have `isDeleted` (workshop.model.ts shape) with index where hot reads filter.
- [ ] Each converted delete controller: guard 404 if already `isDeleted`, else set flag + invalidate caches.
- [ ] Restore route per resource mirroring events undoDelete convention.
- [ ] User repeat-delete of inactive account returns 404 'User Not Found.' — no `findByIdAndDelete`.
- [ ] All listed read/update paths filter `isDeleted: false`.
- [ ] `pnpm typecheck && pnpm lint` exit 0; new tests cover delete→restore round-trip + read-invisibility.

## Task 1: Add isDeleted to the four models
### read_first
- src/database/workshop.model.ts (isDeleted field shape), each target model file
### action
Copy workshop.model.ts `isDeleted` field definition into calendar-event/bank/holiday/notice schemas.
### acceptance_criteria
- `grep -c "isDeleted" src/database/{calendar-event,bank,holiday,notice}.model.ts` → ≥1 each

## Task 2: Convert controllers + add restore endpoints
### read_first
- src/events/workshop/workshop.controller.ts (undoDelete pattern), each controller from RESEARCH.md inventory, module routers
### action
1. Each delete controller: fetch doc, 404 if missing or already `isDeleted`, set `isDeleted: true` via save/updateById, keep existing cache invalidation.
2. Add `undoDelete*Controller` per resource (mirror events); restore invalidates same cache keys as its writers. Bank restore also invalidates account-holder embed keys (copy from deleteBankDetailController).
3. Mount `PATCH .../restore/:id` in calendar.routes.ts, admin bank router, holiday router, notice router with same middleware chain as sibling routes.
4. `userDeleteController`: delete the `if (!user.isActive) { await User.findByIdAndDelete(id); ... }` branch — replace with `throw new ApiError(404, 'User Not Found.')` when already inactive.
5. Add `isDeleted: false` to every query path listed in 06-RESEARCH.md §3.
### acceptance_criteria
- `grep -rE "deleteOne\(|deleteMany\(|findByIdAndDelete" src` output contains only PushSubscription files
- `grep "restore" src/calendar/calendar.routes.ts` finds route
- typecheck+lint pass

## Task 3: Tests
### read_first
- tests/events/events.test.ts (delete→restore test pattern), existing tests for touched modules
### action
Per resource: create → delete (assert 200 + isDeleted in DB) → assert absent from list/get → restore (200) → visible again. Plus user repeat-delete → 404.
### acceptance_criteria
- `pnpm vitest run tests/` exits 0
