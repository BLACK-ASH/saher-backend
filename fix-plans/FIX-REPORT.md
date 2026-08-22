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
