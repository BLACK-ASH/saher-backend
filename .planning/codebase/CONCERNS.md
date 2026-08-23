# Codebase Concerns

**Analysis Date:** 2026-08-23 (updated post fix-plans 00–17; see `fix-plans/FIX-REPORT.md`)

## Status Summary

All 18 fix-plans (00-cross-cutting → 17-entrypoints) executed on branch `fix/module-fixes` (2026-08-22). Verified: typecheck clean, lint clean, vitest 15 files / 233 tests passing. The ~120 findings cataloged in `MODULE_ANALYSIS.md` are addressed except items below.

## Open Concerns

**Credential rotation (ops, HIGH):**
- Resend API key + Atlas creds were committed to `.env.example` historically. Scrubbed from repo but **not yet rotated** — treat as valid until rotated at provider.
- Fix: rotate keys in Resend/MongoDB Atlas dashboards.

**In-memory rate-limit store (MED):**
- `express-rate-limit` uses per-instance memory store (`ponytail:` marked).
- Risk: limits reset per instance if deployment scales horizontally / restarts.
- Fix path: swap to `rate-limit-redis` only if clustered.

**Notice module authorization (LOW):**
- `/api/notice/*` routes carry only `protectedRoute`, no `authorize()` — any authenticated user can create/update/permanently delete notices (`src/notice/`). Routes also flagged `underDevelopment`.
- Fix: add `authorize('write'/'update'/'delete', ...)` before public launch.

**`/api/metrics` unauthenticated (WAIVED):**
- Waived by product decision (2026-08-22) — public scrape endpoint intentionally open.

**OpenAPI docs drift (LOW):**
- `openapi/openapi.yaml` outdated vs routes (AGENTS.md). Redocly builds public docs from it at `/`. Authoritative reference is `MODULE_ROUTES.md` + route files.

## Previously Critical — Now Fixed (verify no regression)

- CORS/CSRF chain: `CORS_ORIGINS` allowlist env; `sameSite:'none'` gated to prod + allowlist present (`src/index.ts`, `src/auth/refresh/refresh.controller.ts`)
- Session lifecycle: logout purges Redis session + all cookies; password change/reset revoke sessions (`revokeUserSessions`)
- IDORs: attendance retrieve gated + scoped; notification mark-seen filtered by `{ _id, user }`; push subscribe ownership-checked
- Mass assignment: strict zod schemas, cross-field refines re-applied on updates
- Plaintext password updates: hashing applied on user update
- Admin route authorization gaps closed; `authorize()` read-bypass removed (all actions check `ROLE_PERMISSIONS`)
- Worker: BullMQ derives from `REDIS_URL`; Puppeteer page leak fixed via try/finally; report HTML escaped
- Mail schema/controller key mismatch fixed; webpush `deleteMany({ user })` field corrected
- Notification hot path compound index added: `{ user, isSeen, createdAt }` (`src/database/notification.model.ts:106`)

## Fragile Areas (handle with care)

**Attendance/calendar IST time math:** range boundaries must be computed via `src/libs/utils/` date helpers in IST — server-TZ `setHours()` bugs were a recurring HIGH class.

**Cache invalidation:** every Redis-cached read needs invalidation in EVERY writer of that data — recurring bug class across modules (account/bank/calendar/reimbursement).

**Correction workflow:** approval rewrites attendance rows inside a transaction — keep notification side-effects outside `withTransaction`.

## Verification Commands

```bash
pnpm typecheck && pnpm lint
pnpm vitest run   # 15 files / 233 tests
```
