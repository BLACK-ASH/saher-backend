# Fix plan — `src/calendar`

Source: `MODULE_ANALYSIS.md` §4.

## Findings status at HEAD (2026-08-22)

| Sev  | Location                                                                                                                             | Status                                                                                                          |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| CRIT | `DELETE /event` missing `:id`                                                                                                        | ✅ **FIXED** — `calendar.routes.ts:26` now `'/event/:id'`; controller also invalidates start AND end month keys |
| MED  | `calendar.schema.ts:19-25` — no end>start refine; `type: z.string()` bypasses eventType enum                                         | ⚠️ verify then fix                                                                                              |
| MED  | update path (`calender.controller.ts:114`) — `findByIdAndUpdate(id, req.body)` raw body; invalidates old month only in some branches | ⚠️ partially fixed (delete/create dual-invalidate ✅, update path needs check)                                  |
| LOW  | double `setCacheWithGroup`, dead `if (!year)`, possible Invalid Date from Google holiday strings                                     | ⚠️                                                                                                              |

## Fixes

1. **Schema**: add `.refine(end > start)` on the create/update schema; change
   `type: z.string()` → `z.enum(eventType)` so stored docs always match what
   `z.array(event).parse` expects on read (prevents 500s from cached garbage).
2. **Update endpoint**: validate with an update schema (zod), stop piping raw
   `req.body` into `findByIdAndUpdate`; ensure BOTH old-date and new-date month cache keys
   are invalidated (compute before and after the write).
3. **Params validation**: year/month params through zod coerce + int range.
4. Nits: remove duplicate `setCacheWithGroup` calls and dead `if (!year)`; guard
   `new Date(holiday.start?.date)` validity before using it in a cache key.

## Verification

- Create event spanning Feb→Mar → both months show it after cache warm.
- Update event moving it to another month → old month no longer lists it.
- POST with `end < start` → 400. `GET /api/calendar/2026/13` → 400 not NaN key.
