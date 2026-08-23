# Fix plan — Cross-cutting concerns

Source: `MODULE_ANALYSIS.md` "Cross-cutting concerns" §1-10. These span modules; each item
names the module plans that implement it.

## 0. Secrets & env discipline (Wave 0 — do first)

- **Rotate the committed Resend key** `.env.example:6` (real-format key verified at HEAD)
  and purge git history (`git filter-repo` / BFG). Treat it as compromised regardless.
- Replace example secrets: `JWT_ACCESS_SECRET/REFRESH`, `CRON_SECRET=super` (verified).
- Add boot-time zod env validation (new `src/config/env.ts`): fail fast on missing/short
  `JWT_*`, `VAPID_*`, `MONGO_URI`, `REDIS_URL`, `GOOGLE_API_KEY`, new `CORS_ORIGINS`.
  Replaces every `process.env.X!` assertion (`token.ts`, `browser.ts`, `resend-send-mail.ts`,
  `runner.ts`).

## 1. CORS + cookies → implemented in `17-entrypoints.md` + `03-auth.md`

## 2. Authorization consistency → `10-permission.md` FIRST, then `01-admin.md`, `06-events.md`

One coherent pass: read-bypass removal + route guards + ApiError contract. Do not ship
route guards before the permission fix (they'd silently pass everyone).

## 3. Password handling → `05-database.md` NOTE + `01-admin.md`

If hash hooks are ever added to models, audit every existing save path that already hashes
via `libs/utils/password-hash.ts` (seed does) for double-hash.

## 4. Cache invalidation registry → `01-admin.md` (helper), applied by

`02-attendance.md`, `04-calendar.md`, `06-events.md`, `09-notification.md`

Build one helper listing every key shape per entity; every writer calls it. Recurring bug
class across the repo.

## 5. Race conditions → conditional updates/upserts + unique indexes over find-then-write

Sites: check-in, cron insertMany, refresh rotation, seeds duplicate-admin, correction
pending-check. Owned by the respective module plans.

## 6. Timezone standardization → `02-attendance.md` Chunk C

All range/boundary math through fixed-zone (+05:30) helpers in `src/libs/utils/date-time`;
grep-able rule: no bare `setHours`/`getMonth()` near queries or cache keys.

## 7. Data lifecycle → cascade decisions (`05-database.md`), temp-PDF TTL cleanup +

download ownership (`02-attendance.md`), upload orphan cleanup (`14-upload.md`)

## 8. Observability safety → `07-libs.md` (metrics cardinality, query-string logging,

error leakage, console.error stragglers)

## 9. Operational readiness → `17-entrypoints.md` (rate limit, helmet, SIGTERM drain,

proxy trust, Redis boot handling)

## Unaudited surface (new scope found via graphify)

`src/leave`, `src/notice`, `src/payroll`, `src/reimbursement` are mounted but absent from
MODULE_ANALYSIS.md. Before Wave 3, run an audit pass on them checking the same classes:
raw-body updates, ownership scoping, authorize() presence, cache invalidation pairing,
zod coverage.
