# Phase 07: Soft-Delete GETs, Search Consistency & OpenAPI — Context

**Gathered:** 2026-08-24
**Status:** Ready for planning
**Source:** User directive (plan-phase args)

<domain>
## Phase Boundary

GET endpoints across all modules must respect soft delete without changing existing response shapes. Search paths in events and reimbursement become consistent and efficient. OpenAPI documents soft delete + restore.

</domain>

<decisions>
## Implementation Decisions

### Locked
- Bill keyword search must exclude `isDeleted: true` docs (currently leaks deleted bills).
- All regex built from user input MUST escape metacharacters (copy events' `escapedKeyword` pattern into a shared helper; reimbursement currently has unescaped `new RegExp(description, 'i')` — injection/crash bug).
- Bill search date boundaries use IST day-window helpers from `src/libs/utils/date-time`, never server-TZ `setHours`.
- Workshop/session search sub-queries (`Program.find`, `Workshop.find` inside keyword branch) filter `isDeleted: false` so deleted parents stop matching children.
- List GETs accept optional `isDeleted` boolean query param, default `false`, validated by zod via existing `validate()` middleware — same convention as events' participant/program/workshop/session.
- Hot-path indexes declared at model definition time for keyword/list queries (title/description text-ish compound or single-field where applicable).
- OpenAPI: add Phase 6 restore endpoints + document `isDeleted` query param on affected GETs with proper request/response component schemas; run `pnpm docs:lint`.

### the agent's Discretion
- Exact shape/location of the shared keyword-filter helper (follow nearest sibling util conventions).
- Which specific indexes to declare — guided by EXPLAIN of the actual list queries, keep minimal.
- Whether Settlement gets an isDeleted param — NO: Settlement has no soft delete; leave untouched.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Conventions
- `.planning/ROADMAP.md` Phase 6 deliverables — restore endpoint inventory this phase documents
- `src/events/workshop/workshop.controller.ts` (:130-175) — escaped-keyword + isDeleted query pattern to generalize
- `src/libs/middleware/validate-zod-schema.ts` — validate() usage on query
- `src/libs/utils/date-time.ts` — IST day-window helpers

### Files to modify
- `src/reimbursement/get-bill/search-bill.controller.ts` (+ its schema file), `src/reimbursement/get-bill/my-bills.controller.ts`
- `src/events/workshop/workshop.controller.ts`, `src/events/session/session.controller.ts`
- `src/database/{bill,workshop,session}.model.ts` — indexes
- `openapi/paths/reimbursement/*`, `openapi/paths/events/*`, `openapi/components/`

</canonical_refs>

<specifics>
## Specific Ideas

- Efficiency ceiling: unanchored `$regex: 'i'` cannot use plain indexes at scale; acceptable at current NGO data volume. Marked as ponytail ceiling — upgrade path is a Mongo text index or Atlas Search if collections grow. Do NOT introduce a new dependency this phase.

</specifics>

<deferred>
## Deferred Ideas

- Mongo text index / Atlas Search migration (only if search latency becomes measurable problem)
- Settlement soft-delete parity (no product need today)

</deferred>
