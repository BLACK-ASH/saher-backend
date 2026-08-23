# Fix plan — `src/admin`

Source: `MODULE_ANALYSIS.md` §1. Depends on: **Wave 1** (`fix-plans/10-permission.md` must land first or the new `authorize('read', …)` guards remain no-ops).

## Findings status at HEAD (2026-08-22)

| Sev  | Location                                                                                                        | Status             |
| ---- | --------------------------------------------------------------------------------------------------------------- | ------------------ |
| CRIT | `admin.routes.ts:33,55,58,62,66` — 5 routes without `authorize()`                                               | ❌ verified open   |
| CRIT | `user/schema.ts:5` + `user/controller.ts:59` — update admits `role`/`password`, plaintext                       | ❌ verified open   |
| HIGH | `account/controller.ts:82`, `bank/controller.ts:57` — raw-body updates lose cross-field refine                  | ⚠️ verify then fix |
| HIGH | `account/schema.ts:71-72` — predictable default password, never emailed                                         | ⚠️ verify then fix |
| MED  | TOCTOU uniqueness checks outside tx; cache invalidation gaps; hard-delete orphans; bank delete while referenced | ⚠️                 |

## Fixes in order

1. **Guard the naked GETs + restore** (CRIT):
   - `GET /users` → `authorize('read', 'user')`
   - `GET /user/:id` → `authorize('read', 'user')`
   - `GET /account/:id` → `authorize('read', 'account')`
   - `GET /bank/:id` → `authorize('read', 'bank')`
   - `PATCH /user/:id/restore` → `authorize('update', 'user')`
     Only meaningful after permission read-bypass fix. Controllers should still scope
     defensively — do not trust middleware alone (repo convention).
2. **Kill privilege escalation** (CRIT): replace `userUpdateSchema = userSchema.partial()`
   with an explicit object omitting `role` and `password`. If admin role-change is a real
   product need, build a dedicated endpoint with its own schema + audit log entry.
3. **Password handling**: if `password` stays out of updates (recommended), nothing to hash.
   If reintroduced later, use `libs/utils/password-hash.ts` and audit register path for
   double-hash (see `05-database.md` NOTE).
4. **Re-apply cross-field refine on account/bank updates**: derive update schemas via
   `.partial()` from a base whose refinements survive partialing, or re-run
   `.refine()` on the merged result inside the controller's parse step.
5. **Cache invalidation registry**: one helper (e.g. `invalidateUserCaches(userId)`)
   deleting every key shape (`user:{id}`, `account:{id}`, `account:userId:{uid}`, list keys);
   call from user delete/restore, account update/delete paths.
6. **Transactional cleanup on hard delete**: cascade Account, Attendance, Corrections,
   PushSubscriptions, Sessions, Media docs (+ unlink media files) inside `withTransaction`,
   or switch to soft-delete-only policy.
7. **Bank delete guard**: block when `Account.bank` references it (count query → 409 ApiError).
8. Nits: `'me'` fallback 404, wrong success message on account update, `_services/user.ts`
   deleter schema requiring `image`.

## Verification

- Two-role curl matrix: as role `user`, each of the 5 routes must return 403 (after permission fix).
- PATCH `/user/:id` with `{role:"admin"}` in body → rejected by zod (400), not applied.
- Delete user → confirm zero orphaned rows across the six collections.
- `pnpm typecheck && pnpm lint`.
