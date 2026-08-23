# Fix plan — `src/attendance`

Source: `MODULE_ANALYSIS.md` §2 (mark/, correction/, export/, retrieve/, holiday/, cron-job/).
Largest module; split work into 4 PR-sized chunks.

## Findings status at HEAD (2026-08-22)

| Sev      | Location                                                                                                     | Status                                                       |
| -------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| CRIT     | `retrieve/all-attendance.controller.ts` — undefined id drops user filter                                     | ⚠️ verify exact lines, pattern confirmed by audit + graphify |
| CRIT     | `correction/handle-correction.ts` — no approver≠requester check; client `input.isAdmin`                      | ⚠️ verify then fix                                           |
| HIGH     | `retrieve/retrieve-attendance.controller.ts` — any `:id`, no role check (IDOR)                               | ⚠️                                                           |
| HIGH     | `attendance.service.ts` — sort on nonexistent `finalSort`; `get-all-user.controller.ts` server-TZ boundaries | ⚠️                                                           |
| HIGH/MED | export cache-miss loop, download IDOR/ENOENT/leak; mark races; holiday bugs; cron races/future checkout      | ⚠️                                                           |

## Chunk A — Exposure & scoping (do first)

1. **all-attendance**: explicit branch table — `'me'` → own data; admin → allowed; anything
   else → `throw new ApiError(403, …)`. Never let the filter variable be possibly-undefined:
   type it as `Types.ObjectId` after the guard.
2. **retrieve-attendance (`:id`)**: same gate as all-attendance intends.
3. **create-correction ownership**: query scoped to `{ _id: correctionId, user: req.user.id }`;
   add unique partial index (user+date+status=pending) for duplicate protection.

## Chunk B — Correction integrity

1. In `handle-correction.ts`: reject when `approver.id === correction.user.id`
   (`ApiError(403)`); derive admin context from `req.user.role`, never from body — remove
   `isAdmin` from `attendanceCorrectionHandleSchema`.
2. Move notification calls out of `withTransaction` (after commit; failures non-fatal).
3. Validate `outTime > inTime`; fix `getMonth()+1` in notification text.

## Chunk C — Retrieval correctness

1. Sort fix: `.sort({ date: finalSort })`.
2. IST boundaries: replace server-TZ `setHours` in `get-all-user.controller.ts` with the
   shared date-time helpers (`src/libs/utils/date-time` style) — start/end computed in a
   fixed +05:30 zone. Never mix server-TZ into range queries (repo rule #7).
3. Clamp `limit` (e.g. `z.coerce.number().int().min(1).max(100)` via validate()).
4. today.controller: reuse clamped workHours computation; me.controller: drop `id:'test'`.

## Chunk D — Marking, holidays, export, cron

1. check-in → conditional upsert (`findOneAndUpdate` with insert filter) or catch E11000 → 200.
2. check-out + auto-checkout bulkWrite: add `outTime: null` to filters; auto-checkout guards
   `outTime <= now`.
3. Holiday controller: `req.params.id` (not `req.params` object), `{new:true}` + invalidate
   old AND new month keys, unify 0-based month math, unique index on date(+type).
4. Export: missing job ⇒ treat as cache miss and re-enqueue; notify-once flag on completed
   polls; download endpoint checks an ownership map, returns 404 on ENOENT, TTL cleanup for
   `public/temp`.
5. Cron create-attendance: tolerate E11000 (ordered:false + catch dup key).

## Verification

- As role `user`: `GET /api/attendance/all/:otherId`, custom-range `:otherId`,
  correction-create on another user's row → all 403/404, never data.
- Approve own correction → 403. Body with `isAdmin:true` → schema rejects unknown key.
- Range query across an IST midnight boundary → no extra-day rows.
- Two parallel check-ins → one 200 one 409-or-idempotent-200, never 500.
