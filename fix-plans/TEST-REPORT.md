# Test Plan & Coverage Tracker — saher-backend

## Approach
- **Framework**: `vitest` (single runner — legacy `node:test` suites converted) + `supertest` + `mongodb-memory-server` (`MongoMemoryReplSet`, count:1 — transactions supported)
- **Target**: 25+ test cases per route/module.
- **Workflow**: Module-wise plan → implement tests → reconcile OpenAPI → verify → checkpoint.
- **Test layout**: `tests/<module>/<module>.test.ts`; shared state in `tests/setup.ts` + `tests/helpers/fake-redis.ts`.
- `pnpm test` = `vitest run`. Docker containers NOT required anymore.

## Test Infrastructure
- `tests/setup.ts`: env vars, fake redis (mocked at `redis-client.js`, real `redis-utils` runs on top), Resend transport stubbed, replica-set Mongo lifecycle, per-test collection + redis wipe.
- `tests/helpers/fake-redis.ts`: stateful kv/sets/sMembers/multi pipeline; exported for direct seeding assertions.
- `src/app.ts`: side-effect-free express app (DB/Redis connect live in `src/index.ts`) so supertest can import it directly.

## Module Priority & Plan
1. `auth` & `permission` (Core)
2. `attendance` & `events` (Logic)
3. `admin` & `user` (RBAC)
4. `notification` & `mail` (Async)
5. `calendar` & `reimbursement` (Misc)

## Current Status (Checkpoint 1)
- [x] Vitest setup
- [x] Test helper setup
- [x] `auth` module coverage — 42 tests (`tests/auth/auth.test.ts`)
- [x] `permission` module coverage — 2 tests ported to vitest (`tests/permission/authorize.test.ts`)
- [x] Legacy suites converted: cron-secret (5), seed create-first-user (4)
- [ ] `attendance`
- [ ] `events`
- [ ] `admin` / `user`
- [ ] `notification` / `mail`
- [ ] `upload` / `calendar` / `notice` / `public` / `payroll` / `leave` / `reimbursement`
- [ ] OpenAPI reconciliation

**Totals: 53 passing (42 auth + 11 converted), typecheck + lint clean.**

## Bugs found by tests (fixed)
1. **`http-logger.ts:30`** — pino-http req serializer called `req.originalUrl.split()` during child-logger creation, before Express set `originalUrl` → every request 500'd and `req.log` was never attached. Fixed with `?? req.url ?? ''` fallback.
2. **`admin/_services/user.ts`** — `userSchemaFinal` required `displayName` + populated `image`; users without an account profile (seeded/self-registered) made `/api/auth/me` and admin user reads 500. Both fields now optional/nullable.
3. **`auth/session/controller.ts`** — stale sessions were returned as literal `null` entries in `GET /sessions` list; now filtered.

## Notes / Decisions
- Rate limits now env-tunable: `RATE_LIMIT_AUTH` / `RATE_LIMIT_API` (defaults unchanged: 20 / 300). Tests disable via high values.
- Refresh-token rotation grace window (previous token ≤15s) covered by tests 18–21.
- One-time token flows (verify-email / change-password / forgot-password / change-email) tested by seeding the hashed token key directly into fake redis.
- Anti-enumeration: unknown-email login returns same generic 401 as wrong-password (test 3). Note: forgot-password request for unknown email returns 404 (documented behavior, test 36).

---

# Checkpoint 2 — attendance module (2026-08-23)

## Totals
117 tests passing across 5 files (53 prior + 64 attendance). `pnpm typecheck` + `pnpm lint` clean.

## New files
- `tests/attendance/attendance.test.ts` (64 tests), `tests/helpers/account.ts` (`createFullAccount`)
- `fix-plans/test-attendance.md` (plan)

## Bugs found & fixed in src/
1. `src/attendance/mark/week-off.controller.ts:14` — `req.body.date` crashed (500) on empty-body POSTs; now `req.body?.date`.
2. `src/admin/_services/user.ts` `userSchemaFinal` — list endpoints populate users with name/email/role only, but schema required `emailVerified`/`isActive`/`isBanned`; added model-default-matching zod defaults. Same 500 class as the displayName fix.

## Facts learned (apply to later modules)
- `formatMessage`/`ApiResponse` title-case every message and normalize to exactly ONE trailing `.` ('The record you asked for ' → 'The Record You Asked For .'). Assert formatted forms.
- Unauthenticated hit → `'Invalid Session.'` from protectedRoute (not 'Login Required.' — that's a different branch).
- Login writes a per-user 'User Login' notification — don't assert raw Notification counts.
- Fake clock (`vi.useFakeTimers({toFake:['Date']})`) makes IST shift math fully deterministic, BUT advance time BEFORE login or JWTs expire mid-test.
- `authorize()` was rewritten since AGENTS.md: read is NO LONGER unconditional (each action checked against ROLE_PERMISSIONS).
- workHours stored EXCLUDES grace; status decision adds grace (3.5h + 1 = half-day).
- Auto-checkout sets outTime at shift end IST and skips future outTimes.

---

# Checkpoint 3 — modules events → reimbursement (2026-08-23)

Commits `90c2ec7`…`e224765` (8): events(35) + openapi schemas for attendance/events + admin(20) + notification(12) + calendar(7) + leave(10) + payroll(6) + user/mail/notice(15). **Green @ e224765: 14 files / 224 tests, typecheck+lint clean.**

## Fixes shipped (reference for future modules)
- IDOR class: mongoose `findByIdAndUpdate(filterObj)` drops non-`_id` criteria → use `findOneAndUpdate` with explicit filter (`src/libs/utils/mark-seen.ts`).
- GET routes: `validate(schema)` reads req.body → always 400; use `validate(schema,'query')`. And `Object.assign(req.query,…)` is unreliable without a query string → controllers coerce `Number(req.query.page)||1`.
- Reimbursement zod schemas required response-virtual `id` on input → bill creation 400'd unconditionally; made `.optional()` (bill + settlement schema.ts).
- `mybills` cache never invalidated → `deleteCache(createKey('reimbursement','mybill',user))` added to all 6 bill writers.
- Also: bank create dropped `accountNumber`; user-update passwords now hashed (validateAsync); LeaveType `description` default ''; leave edit self-overlap via `excludeId`; payroll installments accumulate priorPaid; real VAPID keys in tests/setup.ts.

## Facts needed for remaining work
- Admins hold NO write/update/delete bank; NOBODY holds delete:bank; managers-only write:notification; payroll admin-only.
- Messages are title-cased + one trailing dot EXCEPT specific-scope notifications (raw).
- `mkPerson(role)` must run inside beforeEach (global wipe clears redis sessions + collections).
- Skipped by decision: upload module (writes real files), calendar sync-holidays (real Google API).

## Remaining
- None. All target modules tested and documented.

---

# Checkpoint 4 — reimbursement + OpenAPI complete (2026-08-23)

- Reimbursement module suite (9 cases) passing.
- Route ordering bug in `src/reimbursement/reimbursement.routes.ts` fixed (`/recyclebills` was shadowed by `/:billId`).
- OpenAPI response schemas created for remaining 7 modules in `openapi/components/schemas/`.
- Docs built successfully (`pnpm run docs:build` → `docs/index.html` 979 KiB).
- **Totals: 15 test files / 233 tests passing. `pnpm typecheck`, `pnpm lint`, and `pnpm docs:lint` all clean.**
