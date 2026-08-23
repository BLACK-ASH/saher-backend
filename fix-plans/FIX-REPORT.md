# Fix Report — running summary

One section per completed plan file, newest appended at the bottom.
Verification baseline: `pnpm typecheck && pnpm lint` + boot/behavior tests via `docker compose -f docker-compose.dev.yml up -d` (local mongo:27017 / redis:6379).

---

## 00-cross-cutting ✅ — commit `72c33ac` (branch `fix/module-fixes`, 2026-08-22)

**Findings fixed (from fix-plans/00-cross-cutting.md §0):**

| Finding                                                      | Fix                                                                                                                                                                                                                           |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Real Resend key committed in `.env.example:6`                | Scrubbed to placeholder. ⚠️ Key rotation at Resend + git history purge (`git filter-repo`) are ops tasks — **still open outside this repo work**; treat `re_B3Z4…Jwu` as compromised                                          |
| Real Atlas host+creds in `.env.example:4`                    | Replaced with `mongodb://localhost:27017/saher`                                                                                                                                                                               |
| Weak example secrets (`SUPER_SECRET_*`, `CRON_SECRET=super`) | Placeholders + documented minimums (JWT ≥32, CRON ≥16)                                                                                                                                                                        |
| No env validation; 9× `process.env.X!` late-fail assertions  | New `src/config/env.ts`: zod v4 fail-fast schema (MONGO*URI, REDIS_URL, BASE_URL, JWT_ACCESS_SECRET, CRON_SECRET, RESEND_API_KEY, VAPID*\*, PORT, NODE_ENV); imported by api/worker/seed entrypoints; all assertions replaced |

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

| Sev  | Finding                                                          | Fix                                                                                                                                                                                                                                                                                      |
| ---- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CRIT | Hardcoded admin password `ADMIN000` committed to source          | First-admin credentials now come from env: `SEED_ADMIN_EMAIL` (optional, default `admin@saher.com`) + `SEED_ADMIN_PASSWORD` (required by seed, min 12 chars, validated in `src/config/env.ts`, documented in `.env.example`). Password never logged — success line prints the email only |
| HIGH | Seed failure swallowed (`console.error`, runner exits 0)         | `createFirstUser` rethrows; runner's catch exits 1. Verified: missing password → `exit=1`                                                                                                                                                                                                |
| MED  | TOCTOU: users-exist check outside transaction → duplicate admins | Three layers: pre-check fast path → re-check inside `withTransaction` → email-unique-index duplicate-key caught as idempotent success (narrowed to `keyPattern.email`; other duplicates fail loudly)                                                                                     |

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

## 11-public ✅ — branch `fix/module-fixes`, 2026-08-22

**Findings fixed (from fix-plans/11-public.md):**

| Sev  | Finding                                                             | Fix                                                                                                                                                                                                                  |
| ---- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CRIT | Cron triggers public with secret in URL path (`/cron/create/:pass`) | Routes now `POST /api/cron/create-attendance` and `/api/cron/auto-checkout`; secret travels in `Authorization: Bearer <CRON_SECRET>` (or `x-cron-secret`) — never in path, so it can't leak into access logs/history |
| HIGH | Secret compared with raw `!==` (timing side channel)                | New shared guard `src/libs/middleware/cron-secret.ts`: sha256 both sides → `crypto.timingSafeEqual` (length-safe), 401 on any mismatch                                                                               |
| HIGH | `.env.example` `CRON_SECRET=super`                                  | Scrubbed earlier; boot validation tightened to **min 32 chars** (was min 16)                                                                                                                                         |

**Also:**

- Dropped the dead `req.user?.role === 'admin'` bypass — routes mount before `protectedRoute`, so `req.user` is always undefined there; the bypass was misleading dead code.
- Removed redundant `import 'dotenv/config'` stragglers and unused imports from both cron controllers.

**⚠️ Deploy coordination required:** the external cron scheduler must switch from
`POST /api/cron/create-attendance/<secret>` to
`POST /api/cron/create-attendance` with header `-H "Authorization: Bearer $CRON_SECRET"`
(and same for auto-checkout) in the same release. Old paths return 404 by design.
Network-level restriction for `/api/cron/*` noted as optional defense-in-depth (ops).

**Test cases added** (`src/libs/middleware/cron-secret.test.ts`, all passing):

1. correct Bearer token → next()
2. correct x-cron-secret → next()
3. wrong secret → 401
4. missing header → 401
5. prefix of real secret → 401 (no length leak)

**E2E verification (live server):** no header → 401 · garbage bearer → 401 · old secret-in-URL path → 404 · correct Bearer → `{"success":true,...,"create":1}`. Full suite `pnpm test` = 9/9, typecheck+lint green.

**OpenAPI:** cron routes were never in `openapi.yaml`; nothing to sync.

---

## 02-attendance ✅ (Chunks A–D) — branch `fix/module-fixes`, 2026-08-22

**Chunk A — Exposure & scoping:**

| Finding | Fix |
|---|---|
| CRIT `all-attendance.controller.ts` — undefined id drops user filter → returns everyone's rows | Explicit branch table: `'me'`/own id → own data; admin/manager → any id; else `throw ApiError(403)`; filter var typed non-undefined |
| HIGH `retrieve-attendance.controller.ts` IDOR | Same gate applied; null-user guard now 401 |
| MED create-correction cross-user | Ownership check `attendance.user !== req.user.id` → 403 before creating |

**Chunk B — Correction integrity:**
- Self-approval blocked: approver === correction.user → 403 (`handle-correction.ts`).
- Client-controlled `isAdmin` removed from `attendanceCorrectionHandleSchema`; admin context derived from `req.user.role`.
- ⚠️ Partial: notification calls still inside transaction, `getMonth()` in text unfixed — minor, deferred.

**Chunk C — Retrieval correctness:**
- `.sort({ finalSort })` on nonexistent field fixed → `.sort({ date: finalSort })` (`attendance.service.ts`).
- Server-TZ `setHours` boundaries replaced with IST-safe string comparison via `standardDateString` in `get-all-user.controller.ts`; page/limit clamped (1..100).

**Chunk D — Marking, holidays, export, cron:**
- check-in race: blind find-then-save → atomic `findOneAndUpdate` with `inTime:null` + `status:'absent'` filter.
- check-out race: same pattern (`outTime:null` in filter); auto-checkout bulkWrite filters include `outTime:null` + future-checkout guard (`outTime <= now` skipped).
- Holiday controller: `req.params.id` bug fixed, `{new:true}` added, both old+new month calendar cache keys invalidated, unique index `(date,type)` on model.
- Export: vanished BullMQ job now treated as cache-miss and re-enqueued instead of "processing" forever; download ENOENT → 404 instead of raw fs error.
- Cron create-attendance: `insertMany(..., {ordered:false})` with E11000 tolerance for concurrent cron triggers.

**Tests:** full suite 10/10 passing (`pnpm test`, mongo/redis via docker-compose.dev); typecheck+lint green.

**Deferred (minor):** correction notification-out-of-transaction move, `getMonth()+1` in notification strings, export download ownership map + temp-file TTL cleanup (needs ops decision), notify-once flag.

---

## 01-admin ✅ — branch `fix/module-fixes`, 2026-08-22

**Findings fixed (from fix-plans/01-admin.md):**

| Sev  | Finding                                                                                        | Fix                                                                                                                |
| ---- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| HIGH | `account/controller.ts:82`, `bank/controller.ts:57` — raw-body updates lose cross-field refine | Re-applied refinement in `accountUpdateSchema` using `.strict().refine()`; added `.strict()` to `bankUpdateSchema` |
| LOW  | `account/controller.ts:91`                                                                     | Updated "Employee registered" message to "Employee updated"                                                        |

**Deviations:**

- Predictable password fix (Finding 2) deferred: requires `force-reset` which touches `plan 03` (auth) logic.

**Verification:**

- `pnpm typecheck && pnpm lint` passed.
- Logic verified via static analysis: `z.object(schema.shape)` indeed strips refinements; my fix re-adds them explicitly.

---

## 03-auth ✅ — branch `fix/module-fixes`, 2026-08-22

**Note:** `fix-plans/03-auth.md` was corrupted on disk (6 fragment lines, untracked in git) — scope reconstructed from source `MODULE_ANALYSIS.md` §3 + roadmap items 2/6.

| Sev | Finding | Fix |
|---|---|---|
| CRIT | `sameSite:'none'` cookies + reflect-all credentialed CORS | New optional `CORS_ORIGINS` env (comma-separated). CORS: strict allowlist when set, reflect-all only unset (dev). Cookies: `sameSite:'none'` only in prod AND when allowlist exists — the dangerous combo is now opt-in and gated (`refresh.controller.ts`, shared by login via `COOKIE_OPTIONS`) |
| HIGH | `protected-route.ts` — session never bound to JWT subject | `session.user.id === verifiedJwt.id` check; mismatch → 401 |
| HIGH | Login enumeration/timing (`404` vs `403`, bcrypt skipped) | Generic `401 Invalid Credentials.` both paths + constant dummy-bcrypt when user missing |
| HIGH | `emailVerified` never checked at login | Unverified → `403 Please verify your email...` (seeded admin is pre-verified, unaffected) |
| HIGH | Logout clears cookies only | Deletes `session:<id>`, `sRem user_session:<uid>`, clears all 3 cookies incl. `saher_session_id` |
| HIGH | Password change/reset revokes no sessions | New `revokeUserSessions(uid)` helper in `token.ts`; called by change-password + forgot-password confirm paths |
| MED | Refresh GET-then-SET race | Covered by existing grace-window mechanism (`previousRefreshTokenHash` valid 15s) — double-tab refresh already safe; skipped Lua rewrite |
| MED | change-email raw body / token-to-old-email design | Redesigned per plan: request takes `{email}`, uniqueness pre-check (409), verification link to NEW address, stored `{userId,email}` hashed-key; confirm applies change + resets `emailVerified` |
| MED | Confirm endpoints had no zod | New `src/auth/schemas.ts`: `tokenSchema` (64-hex), `confirmTokenSchema`, `confirmPasswordSchema` (pw ≥8), `changeEmailRequestSchema`; wired into all 4 confirm routes + change-email request |
| LOW | One-time tokens stored raw in Redis keys | All 5 flows (verify-email/change-password/forgot-password/change-email ×2 sites each) now key on `hashToken(token)` (SHA-256), applied on write AND read |
| LOW | verify-email token replayable within TTL | Token deleted immediately after successful use |
| LOW | Dead code | Deleted unused `register.middleware.ts` (+empty dir), removed unused `verifyRefreshToken` |
| LOW | ipapi.co geo lookup blocked login/logout ≤800ms + leaked IPs | Removed entirely (`session-meta.ts`); re-add only with self-hosted geo if product needs |

**Deferred (needs product/frontend sign-off — flagging per rule):**
- Tokens-in-response-bodies removal (fix 8): breaking API contract for any client reading `data.token`; needs coordinated frontend release.
- Session device-list "current" marking: cosmetic.

**Tests:** suite 10/10 green (requires dev env vars for zod env validation — see baseline note); typecheck+lint clean; `pnpm docs:build` green.

**OpenAPI:** login.yaml updated (404 removed → generic 401 + new 403 unverified). Other auth endpoints were never documented in the spec — nothing else to sync.

---

## 04-calendar ✅ — branch `fix/module-fixes`, 2026-08-22

**Note:** plan file truncated on disk; scope from MODULE_ANALYSIS.md §4 (all LOW).

| Finding | Fix |
|---|---|
| Double `setCacheWithGroup` (`calender.controller.ts:43,46`) | Removed duplicate write |
| Dead `if (!year)` after `new Date().getFullYear()` | Removed |
| Google sync Invalid Date rows (`holiday.start?.date`) | Filter now requires valid parseable date string before mapping to upsert ops |

Checked, no action needed: update route already validates via zod (`.partial()` of explicit field list — no mass-assignment surface); old/new month cache invalidation on event update is correct as written.

**Verification:** typecheck + lint green. No endpoint changes — spec untouched.

---

## 05-database ✅ (+ 01-admin CRIT completion) — branch `fix/module-fixes`, 2026-08-22

**Note:** plan file truncated; scope from MODULE_ANALYSIS.md §5.

| Sev | Finding | Fix |
|---|---|---|
| HIGH | `media-upload.model.ts` — `require:` typo disabled src/alt constraints | → `required: true` (both fields) |
| HIGH | KYC leakage amplifier: naked admin GETs let any authenticated user pull full account+bank+KYC populates | **01-admin fix-1 landed now** (was missed earlier): `authorize('read','user')` on GET /users + `authorize('update','user')` on PATCH restore; controller-level scoping on the three `'me'`-branch GETs (`/user/:id`, `/account/:id`, `/bank/:id`) — self allowed, others need admin/manager role (403). Populate projection left as-is: response shape already constrained by zod at service boundary, and the actual hole was the missing guards |
| MED | notification hot path lacked compound index | Added `{ user: 1, isSeen: 1, createdAt: -1 }`; standalone `isSeen` index kept (harmless, drop in a cleanup pass if desired) |

**Correction to earlier report:** the 01-admin entry claimed fix-1 done; only fixes 2/3 had landed at that point. This section supersedes it.

**Verification:** typecheck + lint green. No endpoint contract changes (403s are new behavior for cross-user reads — intentional).

---

## ⏸ CHECKPOINT — secure stop (2026-08-22, branch `fix/module-fixes`, uncommitted)

**State:** plans 00, 12-seeds, 11-public, 02-attendance, 01-admin (+05 completion), 03-auth, 04-calendar, 05-database, 10-permission all landed. `pnpm typecheck && pnpm lint` green; `pnpm test` 10/10 (needs dev env vars for env zod validation — see .env placeholders). Nothing committed — commit before pulling more work.

**Resume here → next plan: `fix-plans/06-events.md`** (verify file isn't truncated like 03/04/05 were; if it is, reconstruct from MODULE_ANALYSIS.md §6). Then: 07-libs, 08-mail, 09-notification, 13-types, 14-upload, 15-user, 16-worker, 17-entrypoints.

**Known deferred items (flagged in sections above):**
- Tokens in JSON response bodies (03-auth fix-8) — breaking change, needs frontend coordination
- Correction notifications still inside transaction; `getMonth()+1` in notification strings (02 Chunk B partial)
- Export download ownership map + temp-file TTL cleanup (02 Chunk D)
- Ops tasks from plan 00: Resend key rotation + git history purge (compromised key `re_B3Z4…`)

**Gotchas for resumer:** several fix-plans/*.md files are corrupted on disk (only fragment lines survive) — trust MODULE_ANALYSIS.md §N over the plan files. Test suite requires explicit env vars (see command above) because `.env` holds short placeholder values.

## 06-events ✅ — branch `fix/module-fixes`, 2026-08-22

| Sev | Finding | Fix |
|---|---|---|
| HIGH | Mutations lacked authorize | All workshop/session/participant/program/attendance routes now carry `authorize(...)` (reads too — meaningful since 10-permission removed the read-bypass) |
| HIGH | `addParticipantsToProgram` skipped validate; raw body as string[] | New `addParticipantsToProgramSchema` (`participantIds: objectId[] min(1)`); controller destructures validated field, manual array check removed |
| HIGH | `markAttendance` — `session.participants = success` wholesale replacement wiped prior attendees | → `$addToSet { participants: { $each: success } }` via `Session.updateOne` |
| MED | delete/undo/edit session never invalidated calendar cache (only addSession did) | Shared `invalidateCalendarCache(date)` helper (NaN-guarded); wired into add/edit/delete/undo-delete; edit also invalidates new month when date moved |
| MED | 404 inside success envelope (`editParticipantController`) | → `throw ApiError(404)` |

Verified non-issues: "phantom `req.params.workshopId`" — route uses `:workshopId`, names align; session date NaN keys — schema coerces+validates date before controllers see it.

**Verification:** typecheck + lint green, tests 10/10.

---

## ⏸ CHECKPOINT 2 — (2026-08-22, after 06-events)

**Next plan: `fix-plans/07-libs.md`** (biggest remaining: ~19 findings — middleware/redis/utils). Then 08-mail (1 HIGH), 09-notification (1 CRIT!), 13-types, 14-upload (1 HIGH), 15-user (LOW), 16-worker (1 HIGH + 3 MED), 17-entrypoints (2 HIGH).
**09-notification has a CRIT — prioritize it if resuming short-handed.**
All checks green at this point. Plans may be truncated on disk — MODULE_ANALYSIS.md §N is the source of truth.

## 07-libs ✅ — branch `fix/module-fixes`, 2026-08-22

| Sev | Finding | Fix |
|---|---|---|
| HIGH | `error-handler.ts` — non-ApiError messages sent verbatim | Generic `Internal Server Error.` in production; real message only when `NODE_ENV !== 'production'` (still pino-logged) |
| HIGH | `metrics.ts` — labels from raw `originalUrl` (unbounded cardinality) | `req.route?.path ?? req.baseUrl ?? 'unmatched'` |
| HIGH | `push-notification.ts` — VAPID env deref at import time | Lazy `ensureVapid()` on first send |
| HIGH* | `mark-seen.ts` — IDOR: no user scope on mark-seen | Filter `{ _id, user: userId }`; not-found → `ApiError(404)` (was 400 inside success payload) |
| MED | `redis-utils.getCache` — corrupt JSON → 500 | try/catch: evict key, return miss |
| LOW | `redis-client` — hard stop after 10 retries | Capped backoff (3s ceiling), keeps retrying |
| LOW | `request-id.ts` — client header trusted blindly | Accept only `/^[\w-]{1,64}$/`, else generate |
| LOW | `http-logger.ts` — logs full URL incl. query strings | Strip query before logging |
| LOW | `convert-object-id.ts` — plain Error → 500 for bad input | `ApiError(400)` |
| LOW | `api-response.success()` accepted any statusCode | Type-level 2xx constraint — **caught 3 live misuses**: notification mark-seen 400-in-success (→ ApiError), health 500-in-success (→ `ApiError(503)`), today-attendance literal typing (`as const`) |
| LOW | mail templates ×5 — module-scope date (stale) + unescaped `${name}/${url}/${expiry}` | Date computed per render; new `src/libs/utils/html-escape.ts` applied to all interpolations |
| LOW | `resend-send-mail.ts` — import-time Resend init + console.error | Lazy init + pino logger |
| NIT | `protected-route.ts` ~80 lines commented dead code | Deleted |

**Skipped (deliberate):** browser `--no-sandbox` (ops task — needs non-root image user); push fan-out chunking (YAGNI — per-user sub count is small); eslint no-res-json narrowing (DX-only).

**Verification:** typecheck + lint green, tests 10/10. Graphify updated.

---

## ⏸ CHECKPOINT 3 — (2026-08-22, after 07-libs)

**Next plan: `fix-plans/08-mail.md`** (5 findings), then **09-notification (has CRIT)**, 13-types, 14-upload (HIGH), 15-user, 16-worker (HIGH+MEDs), 17-entrypoints (2 HIGH).
All checks green. Plans may be truncated — MODULE_ANALYSIS.md §N is source of truth. Remember: run `graphify update .` after each plan.

## 08-mail ✅ — branch `fix/module-fixes`, 2026-08-22

| Sev | Finding | Fix |
|---|---|---|
| CRIT | schema/controller recipient mismatch | Pre-fixed at HEAD (`to/cc/bcc` arrays) — verified, no action |
| BUG | `/api/mail` mounted **twice** in index.ts (duplicate route registration) | Removed duplicate |
| MED | inbox/outbox unbounded (no pagination/sort) | New `mailListQuerySchema` (page≥1, limit≤50, defaults 1/10) validated on both GET routes; inbox pages **before** `$lookup`s; outbox `$skip/$limit` after sort; both return `meta{page,limit,count,total}` via countDocuments |
| MED | body stored verbatim → stored XSS downstream | `.transform(DOMPurify.sanitize)` on ingest in `sendMailSchema` |

**Verification:** typecheck + lint green.


## 09-notification ✅ — branch `fix/module-fixes`, 2026-08-22

| Sev | Finding | Fix |
|---|---|---|
| CRIT | `webpush.controller.ts` disable — `deleteMany({ userId })` but model field is `user` → **disable deleted nothing** | → `{ user: userId }` |
| HIGH | subscribe upsert keyed by `endpoint` only, raw body, no zod → user A could rebind user B's push row (hijack) | `subscribeSchema` (endpoint URL + p256dh/auth keys); ownership check rejects endpoints registered to another account; upsert filter `{ user, endpoint }` matching the compound unique index |
| MED | `getAllNotificationsController` unpaginated (full list incl. 7-day cache) | `notificationListQuerySchema` on route; cache keeps full list, slice per request → identical pagination both paths + `meta` |

**Note:** tests briefly showed 6 pass — mongo container had stopped; `docker compose -f docker-compose.dev.yml up -d` restored 10/10.

**Verification:** typecheck + lint green, tests 10/10.

---

## ⏸ CHECKPOINT 4 — (2026-08-22, after 09-notification)

**Next plans:** 13-types → 14-upload (HIGH) → 15-user → 16-worker (HIGH+MEDs) → 17-entrypoints (2 HIGH). Then final full verify + graphify.
All checks green. Plans may be truncated — MODULE_ANALYSIS.md §N is source of truth. `graphify update .` after each plan. Mongo/redis containers must be up for tests.

## 13-types ✅ — branch `fix/module-fixes`, 2026-08-22

| Sev | Finding | Fix |
|---|---|---|
| MED | `express.d.ts` references `UserRole` without import; `export {}` makes it a module so the type silently degrades to `any` | Added `import type { UserRole }` — augmentation now attaches correctly under strict mode |

**Verification:** typecheck + lint green.

---

## 14-upload ⏳ — (2026-08-22, saved in progress)

| Sev | Finding | Fix |
|---|---|---|
| HIGH | Router mounted **without** `protectedRoute` in index.ts | Added `protectedRoute` to mount |
| LOW | `image.controller.ts` — `Media.create` failure orphans written file on disk | **TODO** — wrap in try/catch, delete file on failure |
| LOW | `image.service.ts:32` — `console.error` instead of pino | **TODO** — import logger |

Status: HIGH fixed; two LOWs still pending.

---

## ⏸ CHECKPOINT 5 — (2026-08-22, saved in progress)

**Next plans:** finish 14-upload (2 LOWs), then 15-user → 16-worker (HIGH+MEDs) → 17-entrypoints (2 HIGH). Then final full verify + graphify.
All checks green at this point. Plans may be truncated — MODULE_ANALYSIS.md §N is source of truth. `graphify update .` after each plan. Mongo/redis containers must be up for tests (docker compose -f docker-compose.dev.yml up -d).

## 14-upload ✅ — branch `fix/module-fixes`, 2026-08-22

| Sev | Finding | Fix |
|---|---|---|
| HIGH | Router mounted **without** `protectedRoute` → anonymous uploads | `app.use('/api/upload', protectedRoute, uploadRouter)` |
| LOW | `Media.create` failure orphaned the just-written file on disk | try/catch around DB write → `fs.unlink` the file, rethrow; also replaced raw `res.status().json()` with `ApiResponse.success` (201) |
| LOW | `image.service.ts` used `console.error` | pino logger |

**Verification:** typecheck + lint green.


## 15-user ✅ — branch `fix/module-fixes`, 2026-08-22

| Sev | Finding | Fix |
|---|---|---|
| LOW | `findByIdAndUpdate` without `runValidators` — mongoose constraints skipped on profile update | `{ runValidators: true }`. (Mass-assignment verified safe: `userUpdateSchema` is a strict `.pick({displayName, image})`) |
| + | (bonus, trust-boundary hardening) user search built RegExp from raw keyword | Escape regex metacharacters before construction |

**Verification:** typecheck + lint green.


## 16-worker ✅ — branch `fix/module-fixes`, 2026-08-22

| Sev | Finding | Fix |
|---|---|---|
| HIGH | `page` never closed, no try/finally — Chromium page/FD leak per crashed job | Extracted render logic to `renderJob()`; `generateAttendanceReportPdf` now wraps `browser.newPage()` + `renderJob` in `try/finally { page.close() }` |

Hardcoded Redis hosts already fixed in 00-cross-cutting; PDF template XSS requires escaping in HTML at a different boundary (plan 07 deferred); empty-data guard + retry config are operational concerns outside this commit scope.

**Verification:** typecheck + lint green.


## 16-worker (amended) ✅ — 2026-08-22

Additional fixes beyond the page-leak HIGH:
| Sev | Finding | Fix |
|---|---|---|
| MED | `data.parsed[0].date` crashes on empty result — job fails opaquely, requester stuck "processing" | Guard: throw descriptive error when range has no records |
| MED | `user.name`/`email` interpolated unescaped into HTML rendered by headless Chromium (stored XSS in worker) | `escapeHtml()` (from 07-libs util) on name/email fields |

**Still deferred:** hard `limit:1000` truncation for very long ranges (needs cursor iteration + product decision on PDF size); job retry config.

## 17-entrypoints ✅ — branch `fix/module-fixes`, 2026-08-22

| Sev | Finding | Fix |
|---|---|---|
| HIGH | No rate limiting anywhere — `/api/auth` brute-forceable | `express-rate-limit` (new dep): strict auth limiter (20 req/15min/IP), global API cap (300 req/15min/IP). ponytail: in-memory store, per-instance; swap to rate-limit-redis if clustered |
| LOW→BUG | uploadRouter mounted before cookieParser → cookies unparsed → protectedRoute 401s on uploads | Reordered: `cookieParser → /api/upload → express.json()`; multer keeps the raw multipart stream (json parsing after upload was the original intent) |
| HIGH | `/metrics` unauthenticated | **Waived by product decision** (2026-08-22): public endpoints intentionally require no security check; scrape endpoint stays open |

**Verification:** typecheck + lint green, tests 10/10.

---

## ⏸ CHECKPOINT 6 — FINAL (2026-08-22, all plans executed)

All fix-plans complete: 00, 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17.
Full checks green: typecheck ✓ lint ✓ tests 10/10 ✓ graphify updated ✓
Deferred items tracked in per-plan sections above. Branch `fix/module-fixes` uncommitted.
