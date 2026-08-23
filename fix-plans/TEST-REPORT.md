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
