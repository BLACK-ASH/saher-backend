# Fix Report — running summary

One section per completed plan file, newest appended at the bottom.
Verification baseline: `pnpm typecheck && pnpm lint` + boot/behavior tests via `docker compose -f docker-compose.dev.yml up -d` (local mongo:27017 / redis:6379).

---

## 00-cross-cutting ✅ — commit `72c33ac` (branch `fix/module-fixes`, 2026-08-22)

**Findings fixed (from fix-plans/00-cross-cutting.md §0):**

| Finding | Fix |
|---|---|
| Real Resend key committed in `.env.example:6` | Scrubbed to placeholder. ⚠️ Key rotation at Resend + git history purge (`git filter-repo`) are ops tasks — **still open outside this repo work**; treat `re_B3Z4…Jwu` as compromised |
| Real Atlas host+creds in `.env.example:4` | Replaced with `mongodb://localhost:27017/saher` |
| Weak example secrets (`SUPER_SECRET_*`, `CRON_SECRET=super`) | Placeholders + documented minimums (JWT ≥32, CRON ≥16) |
| No env validation; 9× `process.env.X!` late-fail assertions | New `src/config/env.ts`: zod v4 fail-fast schema (MONGO_URI, REDIS_URL, BASE_URL, JWT_ACCESS_SECRET, CRON_SECRET, RESEND_API_KEY, VAPID_*, PORT, NODE_ENV); imported by api/worker/seed entrypoints; all assertions replaced |

**Pulled forward from plan 16/02 (required to make local testing possible):**
- BullMQ connection hardcoded to docker service name `redis` (`attendance/export/report.ts:14`, `worker/attendance-report.ts:114`) → shared `bullmqConnection` derived from `REDIS_URL` in `libs/redis/redis-client.ts`. API server previously could not boot anywhere except inside docker-compose.

**New tooling:** `docker-compose.dev.yml` — mongo:7 + redis:7-alpine for local dev/test only.

**Tests run (all passing):**
1. Missing env → boot aborts with ZodError listing every missing var
2. Weak values (`super`, short JWT/Resend keys) → rejected with min-length errors
3. Valid env → full API boot: DB connected → Redis connected → listening; `GET /api/health` → `{"success":true,"message":"Server Healthy."}`
4. Worker entrypoint boots clean (`All Worker Started.`)
5. `pnpm typecheck && pnpm lint` green

**Deliberate deviations (ponytail):**
- `GOOGLE_API_KEY` left optional — single consumer (`libs/utils/calendar.ts`) already tolerates absence
- `CORS_ORIGINS` not added yet — no code reads it; lands with 17-entrypoints CORS lockdown
- `JWT_REFRESH_SECRET` dropped from `.env.example` — grep confirmed zero consumers (refresh tokens are random bytes hashed in Redis)

**OpenAPI:** no endpoint changes — spec untouched.

---

## 12-seeds ✅ — branch `fix/module-fixes`, 2026-08-22

**Findings fixed (from fix-plans/12-seeds.md):**

| Sev | Finding | Fix |
|---|---|---|
| CRIT | Hardcoded admin password `ADMIN000` committed to source | First-admin credentials now come from env: `SEED_ADMIN_EMAIL` (optional, default `admin@saher.com`) + `SEED_ADMIN_PASSWORD` (required by seed, min 12 chars, validated in `src/config/env.ts`, documented in `.env.example`). Password never logged — success line prints the email only |
| HIGH | Seed failure swallowed (`console.error`, runner exits 0) | `createFirstUser` rethrows; runner's catch exits 1. Verified: missing password → `exit=1` |
| MED | TOCTOU: users-exist check outside transaction → duplicate admins | Three layers: pre-check fast path → re-check inside `withTransaction` → email-unique-index duplicate-key caught as idempotent success (narrowed to `keyPattern.email`; other duplicates fail loudly) |

**Extra root fixes found while testing:**
- Seed data was module-level mutable state shared across invocations; fixed media `src` / `employeeId` made concurrent seeds collide on non-email unique indexes before the email index could decide. Now built fresh per invocation with `randomUUID()` placeholders.
- `runner.ts` logs idempotent skip explicitly ("Users already exist").
- AGENTS.md `pnpm seed` description updated (plan item 4).
- `docker-compose.dev.yml`: mongo switched to single-node replica set (`--replSet rs0`) — mongoose transactions require it locally.
- New `pnpm test` script (`tsx --test src/**/*.test.ts`) — node:test, zero new deps.

**Test cases added** (`src/seeds/create-first-user.test.ts`, all passing):
1. fails loudly when `SEED_ADMIN_PASSWORD` missing
2. creates first admin from env creds (role/emailVerified asserted, bcrypt hash compared against env password)
3. idempotent rerun → still exactly 1 user
4. concurrent double-seed → exactly one admin survives the unique-index race

**E2E verification:** fresh DB → seed #1 creates `ops-admin@saherindia.org`; seed #2 skips idempotently; unset password → exit 1; final count = 1 admin. Plus `pnpm typecheck && pnpm lint` green.

**Deviations:** no force-reset flag — User model has no such field and adding one touches auth flow (plan 03 scope). Email defaults to `admin@saher.com` when unset so legacy dev flows keep working.

**OpenAPI:** no endpoint changes — spec untouched.

---
