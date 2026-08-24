# Phase 07 SUMMARY — Soft-Delete GETs, Search Consistency & OpenAPI

## What shipped
- `src/libs/utils/keyword-filter.ts` — shared `escapeRegex` + `buildKeywordOrConditions`.
- Bill search: `isDeleted:false` filter (deleted bills no longer leak), escaped regex (injection fix), IST day-window via new `src/libs/utils/date-time.ts`, zod-validated query params, pagination meta.
- `my-bills`: validated `isDeleted` param; only the default view cached under the exact key writers invalidate (cache-freshness preserved).
- Events: Program/Workshop sub-queries in workshop+session keyword search filter `isDeleted:false`; shared escape util adopted.
- Indexes: bill {user,isDeleted,createdAt},{date,isDeleted} + text; workshop/session {isDeleted,createdAt} + parent refs.
- Session export route normalized to `GET /api/events/export/report?sessionId=` with ObjectId validation (matches attendance-export convention + tests).
- OpenAPI: search.yaml registered; restore paths for calendar/bank/holiday/notice documented; isDeleted params on mybills/workshops; docs:lint valid.

## Bugs found & fixed during verification
- Cache-key mismatch in my-bills broke write-invalidation (reimbursement test caught it).
- BullMQ dialed real Redis in tests → global inert Queue/Worker mock in tests/setup.ts (+upsertJobScheduler).
- Pre-existing Phase 3 payroll failures (approval gate vs stale tests) fixed by adding approve calls.

## Verification
typecheck 0 · lint 0 errors · docs:lint valid · full suite 253/253.
