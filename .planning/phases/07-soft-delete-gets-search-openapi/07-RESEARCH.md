# Phase 07: Research

## 1. GET soft-delete audit (current state)

| GET path | isDeleted handling | Verdict |
|---|---|---|
| events program/workshop/session/participant lists | `isDeleted` query param, default false, zod-validated | reference pattern — keep |
| `my-bills.controller.ts` | hardcodes `isDeleted: false` | OK behavior; align param convention (optional) |
| `recycle-bill.controller.ts` | `isDeleted: true` only | keep |
| **`search-bill.controller.ts`** | **no isDeleted filter** | FIX — deleted bills leak into search |
| `searchSettleBillController` | Settlement model has no soft delete | no change |
| balance-enquiry | filters isDeleted:false | OK |

## 2. Search audit

**Events** (`workshop.controller.ts:130-175`, `session.controller.ts:195-255`):
- Escapes regex metacharacters ✓; searches title/description + parent Program/Workshop titles + ObjectId.
- BUG: sub-queries `Program.find({title:$regex})` / `Workshop.find({title:$regex})` omit `isDeleted:false` → keyword matches via deleted parents.
- Duplicated escape+orConditions logic across workshop/session → extract shared helper.

**Reimbursement** (`search-bill.controller.ts`):
- UNESCAPED `new RegExp(description,'i')` → regex injection / crash on `(` etc.
- Date filter uses server-TZ `setHours(0,0,0)` — violates IST convention (AGENTS.md #7).
- Hardcoded `.limit(5)`, no pagination meta (inconsistent with settle search which paginates).
- No `isDeleted` filter (§1).

## 3. Efficiency
- Unanchored case-insensitive regex = collection scan per query. Fine at NGO scale (hundreds–low thousands docs). Shared helper removes duplicate sub-queries where possible; indexes on hot list sorts (`createdAt`) and searched fields declared at model definition (repo rule #5). Text-index migration deferred (see CONTEXT deferred).

## 4. OpenAPI state
- `openapi/paths/{events,reimbursement,...}/` exist; Phase 6 restore endpoints (calendar event/bank/holiday/notice restore, events restores un-gated, session export route) not yet documented; GETs lack `isDeleted` query param documentation.
- Standing repo rule: update openapi path files + register in openapi.yaml, run `pnpm docs:lint`.

## 5. Risks
- Changing bill search response shape would break frontend — keep response envelope identical (only filtering/query fixes; pagination addition must stay additive with defaults matching current limit if changed).
