---
wave: 1
depends_on: [06]
files_modified:
  - src/reimbursement/get-bill/search-bill.controller.ts
  - src/reimbursement/get-bill/get-bill.schema.ts
  - src/events/workshop/workshop.controller.ts
  - src/events/session/session.controller.ts
  - src/database/bill.model.ts
  - src/database/workshop.model.ts
  - src/database/session.model.ts
  - src/libs/utils/keyword-filter.ts
  - openapi/paths/reimbursement/bill.yaml
  - openapi/paths/events/workshops.yaml
  - openapi/openapi.yaml
autonomous: true
---

# Phase 07: Plan — Soft-Delete-Aware GETs, Search Consistency & OpenAPI

**Goal:** Deleted records invisible on every GET; search consistent + safe in events and reimbursement; OpenAPI documents restore endpoints and isDeleted params.

## must_haves
- [ ] Bill keyword search excludes isDeleted docs, escapes regex input, uses IST date window.
- [ ] Workshop/session search sub-queries filter isDeleted:false (deleted parents don't match).
- [ ] Shared escaped-keyword helper used by both events and reimbursement search.
- [ ] `pnpm docs:lint` passes; restore endpoints documented; GETs document isDeleted param.
- [ ] `pnpm typecheck && pnpm lint` exit 0.

## Task 1: Shared keyword-filter util
### read_first
- src/events/workshop/workshop.controller.ts:130-175 (pattern to extract), src/libs/utils/date-time.ts
### action
Create `src/libs/utils/keyword-filter.ts` exporting `escapeRegex(input: string): string` and `buildKeywordOrConditions(keyword, fields)` returning `$or` conditions with escaped regex per field. No new deps.
### acceptance_criteria
- `grep "escapeRegex" src/libs/utils/keyword-filter.ts` matches
- Unit check: escapeRegex('a(b') returns 'a\\(b' (no throw)

## Task 2: Fix reimbursement bill search
### read_first
- src/reimbursement/get-bill/search-bill.controller.ts, get-bill.schema.ts, src/libs/utils/date-time.ts, Task 1 util
### action
1. Add `isDeleted: false` to the base query object.
2. Replace raw RegExp with escapeRegex from shared util.
3. Replace server-TZ setHours date window with IST day-window helpers from date-time.ts.
4. Validate query params via existing zod schema + validate() middleware (description string, amount number, user objectId, date ISO string, optional page/limit defaulting 1/5).
5. my-bills.controller.ts: accept optional validated isDeleted boolean query param default false (aligns with events convention); keep response shape unchanged.
### acceptance_criteria
- `grep "isDeleted: false" src/reimbursement/get-bill/search-bill.controller.ts` matches
- `grep -c "new RegExp(description" src/reimbursement/get-bill/search-bill.controller.ts` → 0
- Search request for a soft-deleted bill returns [] with 200

## Task 3: Events search consistency
### read_first
- src/events/workshop/workshop.controller.ts, src/events/session/session.controller.ts, Task 1 util
### action
1. Add `isDeleted: false` to Program.find and Workshop.find sub-queries inside workshop and session keyword branches.
2. Replace inline escaping with shared util (behavior identical).
3. Declare hot-path indexes at model definition: bill {user, isDeleted}, workshop/session {isDeleted, createdAt} — copy index syntax from an indexed model in src/database/.
### acceptance_criteria
- Sub-query find calls in both controllers include `isDeleted: false`
- grep "index" shows new indexes in bill/workshop/session models
- typecheck+lint pass

## Task 4: OpenAPI update
### read_first
- openapi/openapi.yaml registration pattern, existing events/reimbursement path files, Phase 6 route files (restore paths), RESEARCH.md §4
### action
Document: all Phase 6 restore PATCH endpoints; session export GET; isDeleted query param on affected list GETs (events workshops/sessions/programs/participants, reimbursement bills); request/response component schemas matching zod schemas. Register new path files in openapi.yaml. Run `pnpm docs:lint`.
### acceptance_criteria
- `pnpm docs:lint` exits 0
- grep "restore" finds entries under openapi/paths for calendar/admin-bank/holiday/notice/events
