# Fix plan — Entrypoints (`src/index.ts`, `src/worker/index.ts`)

Source: `MODULE_ANALYSIS.md` §Entrypoints + re-verification at HEAD.

## Findings status at HEAD (2026-08-22)

| Sev  | Location                                                                              | Status                                    |
| ---- | ------------------------------------------------------------------------------------- | ----------------------------------------- |
| CRIT | CORS reflect-all + credentials (`index.ts:59-64`)                                     | ❌ **verified open**                      |
| HIGH | `/metrics` unauthenticated (`index.ts:96`)                                            | ❌ **verified open**                      |
| HIGH | no rate limiting / helmet anywhere                                                    | ❌ verified (no deps)                     |
| MED  | `trust proxy = true`; public docs at `/`; no SIGTERM drain; uncaught `connectRedis()` | ❌ mount order verified; rest ⚠️          |
| LOW  | uploadRouter mounted before json/cookieParser                                         | ❌ **verified open** (see `14-upload.md`) |

## Fixes in order

1. **CORS allowlist** (CRIT): replace `{ origin: true }` with env-driven allowlist
   (`CORS_ORIGINS=https://app.example.com,https://admin.example.com` → split, exact match;
   add to `.env.example`). Pair with cookie `sameSite:'lax'` from `03-auth.md`.
2. **Rate limiting**: global limiter (e.g. 300 req/min/IP) + strict limiter on `/api/auth`
   (5-10 attempts/min); consider `helmet`. New deps → document any config in `.env.example`.
3. **`/metrics`**: bind to internal interface, IP allowlist, or scrape-auth (basic auth
   via env). Same for docs at `/` if they expose internal notes — Redocly output is
   world-readable today.
4. **Graceful shutdown**: SIGTERM handler → `server.close()` → close Redis/BullMQ → exit;
   wrap `await connectRedis()` like `connectDb` (fail fast, clear message).
5. **trust proxy**: set hop count (1) or the specific proxy IP instead of `true` so
   rate-limit keys and logs can't be spoofed via `X-Forwarded-For`.
6. Reorder parsers/upload mount per `14-upload.md`; dedupe the double
   `app.use('/api/mail', …)` mount (`index.ts:87,89`) spotted at HEAD.

## Verification

- Cross-origin credentialed request from a non-allowlisted origin → blocked by browser.
- 50 rapid `/api/auth/login` posts → 429 after threshold.
- `docker compose stop backend` → logs show clean drain, zero mid-request kills.
- `/metrics` from public internet → 401/403/404.
