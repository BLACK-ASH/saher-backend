# saher-backend — Module Deep-Dive & Bug Audit

- **Date:** 2026-08-21
- **Scope:** All 16 modules under `src/` plus the application entrypoints (`src/index.ts`, `src/worker/index.ts`)
- **Method:** Full source review of every file per module (5 parallel audit passes), findings deduplicated across modules
- **Stack context:** Express 5 + TypeScript, Mongoose 9 (MongoDB), Redis + BullMQ, pino/prom-client observability, Resend (mail), web-push, Multer + Sharp (uploads), Puppeteer (PDF reports), Redocly OpenAPI docs

## Severity legend

| Level | Meaning |
|---|---|
| CRITICAL | Exploitable now or guarantees broken behavior; fix immediately |
| HIGH | Security hole, data corruption, or core feature breakage |
| MEDIUM | Correctness bug, race, perf/memory issue, or stale-data risk |
| LOW / NIT | Hygiene, dead code, minor inconsistency |

## Findings summary

| Severity | Count (deduped) |
|---|---|
| CRITICAL | 13 |
| HIGH | 30 |
| MEDIUM | ~50 |
| LOW / NIT | ~30 |

---

## Top-10 "Fix First" Roadmap

Ranked by exploitability × blast radius:

1. **Secret hygiene** — `.env.example:6` contains a real-format Resend API key (`re_B3Z43…`); rotate it and purge git history. Add zod-based env validation at boot (fail fast on missing `JWT_*`, `VAPID_*`, `MONGO_URI`, `REDIS_URL`, `GOOGLE_API_KEY`).
2. **Kill the CORS/CSRF chain** — `cors({origin:true, credentials:true})` (`src/index.ts:56-61`) reflects every origin while auth cookies ship `sameSite:'none'` (`src/auth/refresh/refresh.controller.ts:12`). Any website can make credentialed cross-origin calls. Allowlist origins + `sameSite:'lax'|'strict'`.
3. **Authorization overhaul** — `authorize()` passes *every* `read` action unconditionally (`src/permission/authorize.ts:22-24`), and 5 admin routes have **no** authorization middleware at all (`src/admin/admin.routes.ts:33,55,58,62,66`). Any authenticated `'user'` can list all users and read any employee's bank/aadhar/pan/resume documents.
4. **Stop privilege escalation & plaintext passwords** — `userUpdateSchema = userSchema.partial()` admits `role` and `password` and pipes them into `findByIdAndUpdate` (`src/admin/user/schema.ts:5`, `controller.ts:59`). Any manager can promote anyone to admin; supplied passwords are stored **plaintext** (no hash hooks exist anywhere in `src/database/`). Strip fields + add hashing hooks.
5. **Attendance mass-exposure** — `all-attendance.controller.ts:10-22` drops the user filter when `req.params.id` is unauthorized-but-present (`Attendance.find({ user: undefined })` returns everyone's rows); `retrieve-attendance.controller.ts:19-23` accepts any `:id` with no role check (direct IDOR).
6. **Session lifecycle** — logout never deletes the Redis session nor `saher_session_id` cookie (`src/auth/logout/logout.controller.ts:18-19`); password change/reset revokes no other sessions; `protected-route.ts:95-107` never binds the session's `user.id` to the JWT subject (stolen access token + attacker's own session id authenticates as victim).
7. **Seed & cron credentials** — hardcoded seed admin password `ADMIN000` (`src/seeds/create-first-user.ts:55`); trivial `CRON_SECRET=super` compared non-constant-time **in the URL path** of fully public endpoints (`src/public/public.routes.ts:10-11`). Randomize, move secret to header, `crypto.timingSafeEqual`.
8. **Correction-flow integrity** — approver identity never checked against requester (`src/attendance/correction/handle-correction.ts:20-158`): anyone with `update: attendance-correction` approves their own correction; `input.isAdmin` is client-controlled and injects arbitrary statuses/times.
9. **Functional breakage quick-wins** — `DELETE /event` has no `:id` param yet reports success (`src/calendar/calender.controller.ts:56-57`); web-push disable deletes zero rows (`{ userId }` vs model field `user`, `webpush.controller.ts:74`); mail send can never succeed (`receiverID` schema vs `receiversIDs` controller, `src/mail/mail.schema.ts:6` / `mail.controller.ts:31`).
10. **Worker/cron hardening** — Chromium pages never closed (`src/worker/attendance-report.ts:20`, try/finally needed); `data[0].date` crashes on empty ranges; vanished cached job leaves requester in "processing" forever; cron find-then-insert race hits E11000 → 500.

---

## Module inventory

| # | Module | Purpose |
|---|--------|---------|
| 1 | `src/admin` | Admin API: employee onboarding (User+Account+Bank atomic), bank mgmt, user CRUD/restore, 7-day Redis-cached reads |
| 2 | `src/attendance` | Check-in/out, corrections workflow, holidays, PDF export queue, cron jobs (create daily rows, auto-checkout) |
| 3 | `src/auth` | JWT access + opaque rotating refresh tokens, cookie sessions in Redis, verify-email / forgot-password / change flows |
| 4 | `src/calendar` | Month-view aggregation (holidays + sessions + custom events) with Redis caching, Google-holidays sync |
| 5 | `src/database` | All Mongoose schemas + connection helper |
| 6 | `src/events` | Workshops, sessions, participants, bulk session-attendance marking (under development) |
| 7 | `src/libs` | Shared infra: ApiResponse/ApiError, logger/metrics, middlewares, Redis utils, mail templates, RBAC helpers, custom ESLint rules |
| 8 | `src/mail` | Internal mailbox (inbox/outbox/send) persisted to Mongo (Resend not used here) |
| 9 | `src/notification` | In-app notifications (global/role/specific) + Web Push subscriptions |
| 10 | `src/permission` | String-typed `resource:action` RBAC with `authorize()` middleware |
| 11 | `src/public` | Unauthenticated health check + pass-protected cron triggers |
| 12 | `src/seeds` | First-admin bootstrap + placeholder rows in a Mongo transaction |
| 13 | `src/types` | Express `Request` augmentation (`req.id`, `req.startTime`, `req.user`) |
| 14 | `src/upload` | Authenticated image pipeline: multer memory → sharp resize/webp → disk + Mongo metadata |
| 15 | `src/user` | Self-service profile read/update (`/api/user`) |
| 16 | `src/worker` | Separate BullMQ process rendering attendance PDFs via Puppeteer + notifying users |

---

# Per-module deep dive

## 1. `src/admin/`

**Purpose:** Employee onboarding creates User + Account + Bank atomically in a transaction; bank detail management; user CRUD with soft-delete/restore. Reads go through `_services/` caches (7-day TTL).

| Sev | Location | Issue | Impact | Fix |
|---|---|---|---|---|
| CRIT | `src/admin/admin.routes.ts:33,55,58,62,66` | Five routes (GET `/users`, `/user/:id`, `/account/:id`, `/bank/:id`, PATCH `/user/:id/restore`) have no `authorize()`; router only behind `protectedRoute` | Any authenticated user lists all staff, reads any bank/KYC data, restores deleted accounts | Add `authorize('read', …)`/`authorize('update','user')` + ownership scoping |
| CRIT | `src/admin/user/schema.ts:5` + `src/admin/user/controller.ts:59` | `userSchema.partial()` admits `role` and `password`; parsed body piped straight into `findByIdAndUpdate` | Manager promotes anyone to admin (escalation); no self-demotion guard | Omit `role`/`password` from update schema; gate to dedicated admin-only logic |
| CRIT | `src/admin/user/controller.ts:59` | Client-supplied `password` written verbatim — **no pre-save/pre-update hash hooks exist** in any model | Plaintext credential at rest; account can never log in (`bcrypt.compare` fails) | Hash in controller or add `pre('save')`+`pre('findOneAndUpdate')` hooks (then audit register path for double-hash) |
| HIGH | `src/admin/account/controller.ts:82`, `src/admin/bank/controller.ts:57` | Direct `findByIdAndUpdate(id, req.body)`; `.partial()` drops the partTime→employeeShift cross-field refine (`account/schema.ts:49-60`) | Updates can create invalid shift states | Re-apply cross-field refinement on updates |
| HIGH | `src/admin/account/schema.ts:71-72` | Default password = first 4 name letters + birth year; never emailed to employee (`account/controller.ts:56-60` omits credentials) | Fully predictable initial passwords | Random temp password + force-reset-on-first-login + email it |
| MED | `src/admin/account/controller.ts:23-30` | Email/employeeId uniqueness checked outside the transaction (TOCTOU) | Concurrent requests → E11000 → 500 instead of 400 | Catch duplicate-key errors or check inside tx |
| MED | `src/admin/account/controller.ts:85-89`, `user/controller.ts:90-97,145-148` | Cache invalidation deletes `account:{id}` but not `account:userId:{uid}`; delete/restore paths miss keys entirely | Stale account/profile data up to 7 days | Centralize invalidation helper covering all key shapes |
| MED | `src/admin/user/controller.ts:94` | Hard-delete removes only the User doc | Orphaned Account/Attendance/Corrections/PushSubscriptions/sessions/Media files | Transactional cascade cleanup |
| MED | `src/admin/bank/controller.ts:74` | Bank deleted while `Account.bank` still references it (no FK enforcement) | `populate('bank')` silently returns null | Block delete when referenced |
| LOW | `src/admin/bank/controller.ts:40` | `id === 'me'` with no account falls through returning misleading "Bank Details Not Exist" | Confusing API errors | Early-return 404 |
| LOW | `src/admin/account/controller.ts:91` | Update endpoint says "Employee registered." | Copy-paste message | Correct text |
| LOW | `src/admin/_services/user.ts:19,21` | Deleter populated through schema requiring `image` ObjectId | Parse throws 500 for users without image | Dedicated partial schema |

## 2. `src/attendance/`

**Purpose:** Daily attendance rows are created by cron; users check in/out against them; admins override status. Corrections flow: user files → privileged approve/reject/on-hold → approval rewrites the row in a transaction. Export enqueues BullMQ PDF jobs keyed per user+range. Holidays are CRUD-managed but **not consulted** by marking logic.

### mark/

| Sev | Location | Issue | Impact | Fix |
|---|---|---|---|---|
| MED | `mark/check-in.controller.ts:19-67` | Find-then-create race on concurrent check-ins | Loser gets E11000 → 500 despite success semantics | `findOneAndUpdate` upsert with conditions |
| MED | `mark/check-out.controller.ts:17-53` vs `cron-job/auto-checkout-attendance.cron.ts:30-100` | Checkout and auto-checkout both read `outTime:null` then blind-write | Shift-end overwrites user's real checkout time | Add `outTime: null` to bulkWrite filter |
| MED | `mark/reject-mark.controller.ts:49` | Cache invalidated for the *admin's* key instead of target user's | Target keeps stale today/me data | Invalidate `input.id`'s key |
| LOW | `mark/reject-mark.controller.ts:13-18` | `id`/`date` unvalidated strings | Garbage in queries | objectId + date coercion schemas |

### correction/

| Sev | Location | Issue | Impact | Fix |
|---|---|---|---|---|
| CRIT | `correction/handle-correction.ts:20-158` | No check approver ≠ requester; privilege alone suffices | Self-approval of own corrections | Explicit self-denial + manager/admin assertion |
| HIGH | `correction/handle-correction.ts:107-127` | `input.isAdmin` taken from client body | Injects arbitrary `status`/`isLate`/times bypassing recalculation | Derive from verified role |
| MED | `correction/handle-correction.ts:61,84,149` | Notification HTTP call inside `withTransaction` | Transaction held open on slow IO | Move outside commit |
| MED | `correction/create-correction.ts:21-34` | No ownership check (`attendance.user === req.user.id`); pending-duplicate check racy (no unique index) | Users file corrections on others' rows; duplicates possible | Scope query + unique index |
| LOW | `correction/create-correction.ts:40-51`; `handle-correction.ts:60,83,148` | `outTime > inTime` never validated; `getMonth()` missing `+1` in notification text | Invalid ranges; wrong month labels | Validate; `getMonth()+1` |

### export/ + worker interplay

| Sev | Location | Issue | Impact | Fix |
|---|---|---|---|---|
| HIGH | `export/report.ts:89-129` | Cached jobId whose job was pruned → `getState()` undefined → "processing" forever (24h cache blocks regen) | Users stuck permanently | Treat missing job as cache miss, re-enqueue |
| MED | `export/report.ts:114-119` | Completed-request polls re-send notification every poll | Notification spam | Send once / flag notified |
| MED | `export/report-download.ts:10-23` | No ownership check on UUID downloads; `fs.stat` ENOENT → 500; files never cleaned from `public/temp` | IDOR (UUID-entropy-mitigated), disk growth | Ownership map, 404 on ENOENT, TTL cleanup |

### retrieve/ + service

| Sev | Location | Issue | Impact | Fix |
|---|---|---|---|---|
| CRIT | `retrieve/all-attendance.controller.ts:10-22` | Non-'me', non-admin path leaves `id` undefined → `find({ user: undefined })` drops filter | **Returns everyone's attendance to regular users** | Reject unauthorized ids explicitly |
| HIGH | `retrieve/retrieve-attendance.controller.ts:19-23` | Custom-range path accepts any `:id`, no role check | IDOR on any user's attendance | Gate like all-attendance intends |
| HIGH | `attendance.service.ts:24` | `.sort({ finalSort })` sorts by literal nonexistent field | Week/month/year listings (and PDF order) effectively unsorted | `{ date: finalSort }` |
| HIGH | `retrieve/get-all-user.controller.ts:23-27,57-58` | Server-TZ `setHours(0,0,0,0)` then IST conversion: end bound 23:59:59.999 UTC = next-day 05:29 IST | `$lte` includes an extra day | Do boundary math in IST/Temporal fixed zone |
| MED | `attendance.service.ts:12`, `all-attendance.controller.ts:18-19` | `limit` query param unclamped | `?limit=1000000` memory blowup | Clamp max |
| MED | `retrieve/today.controller.ts:63-71` | Live `workHours = now − inTime`, ignoring shift clamping used elsewhere; snapshot cached | Inflated/inconsistent hours | Reuse clamped computation |
| LOW | `retrieve/me.controller.ts:56` | Placeholder `id: 'test'` in response | Data pollution | Remove |

### holiday/

| Sev | Location | Issue | Impact | Fix |
|---|---|---|---|---|
| HIGH | `holiday/holiday.controller.ts:65-67` | `const id = req.params` passed to `findById` | `GET /holiday/:id` always CastError 500 | Use `req.params.id` |
| MED | `holiday/holiday.controller.ts:47-53` | `findByIdAndUpdate` returns pre-update doc; invalidates old month only | New-date month stays stale | `{ new:true }` + invalidate both months |
| MED | `holiday/holiday.controller.ts:29-31` vs `:50,:99` | Add path uses 0-based `getMonth()`, others `+1` | Add invalidates wrong cache key | Consistent month math |
| MED | Design | Holidays never consulted by cron/mark/status logic | Users marked absent on declared holidays | Join Holiday in create/status paths |
| LOW | `holiday/holiday.controller.ts:14-19` | Exact-match dup check racy, misses same-date-different-type | Duplicate holidays possible | Unique index on normalized fields |

### cron-job/ (see also §public, §worker)

| Sev | Location | Issue | Impact | Fix |
|---|---|---|---|---|
| MED | `create-attendance.cron.ts:26-43` | Find-then-insertMany race between concurrent triggers | Second run hits unique `{user,date}` index → unhandled E11000 → 500 | Catch duplicate-key or upsert |
| MED | `auto-checkout-attendance.cron.ts:80` | `outTime` stamped as shift-end even if fired before shift end | Future checkout times persisted | Guard `outTime <= now` |
| MED | `auto-checkout-attendance.cron.ts:47-55` | Populates bank/aadhar/pan/resume/image per account just to read `employeeType` | Memory/latency at scale | Select only needed fields |
| LOW | `auto-checkout-attendance.cron.ts:57` | `return null` from handler (also unreachable) | Hangs response if hit | Proper response |

## 3. `src/auth/`

**Purpose:** Access tokens HS384/15m; opaque 256-bit refresh hashed in Redis (60d) with rotation + 15s grace; sessions tracked per device via ua-parser; verify-email / forgot-password / change-password/email use single-use Redis-backed tokens. *(Note directory typo: `verfiy-email`.)*

| Sev | Location | Issue | Impact | Fix |
|---|---|---|---|---|
| CRIT | `refresh/refresh.controller.ts:12` + `src/index.ts:56-61` | Prod cookies `sameSite:'none'` combined with reflect-all-origin credentialed CORS | Full CSRF + cross-origin read of all `/api/*` | Origin allowlist + `sameSite:'lax'\|'strict'` (roadmap #2) |
| HIGH | `../libs/middleware/protected-route.ts:95-107` | Session existence checked; never binds `session.user.id` === JWT subject | Stolen access token + attacker's own session id ⇒ victim identity | Compare ids |
| HIGH | `login/login.controller.ts:29-33` | Distinct 404/403 messages; bcrypt skipped when user missing | Login enumeration + timing oracle | Generic 401 + dummy-bcrypt |
| HIGH | `login/login.controller.ts:29-39` | `emailVerified` never checked at login | Email verification is decorative (full bypass) | Reject unverified logins |
| HIGH | `logout/logout.controller.ts:18-19` | Clears 2 cookies (not `saher_session_id`); never deletes Redis session or sRem from `user_session` | Refresh stays valid ≤60d after logout | Delete `session:<id>`, clear all cookies |
| HIGH | `change-password/controller.ts:53-57`, `forgot-password/controller.ts:61-65` | Password rotation revokes no other sessions | Stolen sessions survive credential reset | Iterate `user_session:<id>` set, purge all |
| MED | `_utils/token.ts:58,135,150` | `JWT_ACCESS_SECRET!` assertions, no boot validation | Missing secret fails late/opaquely | Boot-time env validation |
| MED | `_utils/token.ts:102-133` | Refresh rotation GET-then-SET non-atomic | Concurrent refreshes last-write-wins → legitimate client logged out | Lua/WATCH or delete-on-read |
| MED | `change-email/controller.ts:39-51` | Raw body email, no zod/uniqueness check; no verification ever sent to new address | E11000 → 500; `emailVerified:false` dead-end | Validate, pre-check, verify new address |
| MED | `change-password/controller.ts:41-53`, `forgot-password/controller.ts:49-61`, `verfiy-email/controller.ts:37-42` | Confirm endpoints lack zod validation | Undefined password → bcrypt 500; tokenless requests collide on `…:undefined` keys | Add `validate()` schemas |
| MED | `login/login.controller.ts:58-62` | Access/refresh/session tokens also in JSON body | Defeats httpOnly cookies under XSS | Cookies-only |
| MED | `register/register.middleware.ts:15,41-43` | Dead (unmounted) code permitting self-assigned `admin`/`manager` roles and name-derived default passwords | Landmine if ever wired | Delete or harden |
| LOW | `verfiy-email/controller.ts:47-48` | Verify token never deleted post-use (15-min replay window) | Replayable verification | `deleteCache(key)` on success |
| LOW | `forgot-password/controller.ts:29-31` | Reset tokens stored unhashed at rest | Redis-compromise exposure | Store SHA-256(token) |
| LOW | `_utils/session-meta.ts:29-45` | ipapi.co fetch awaited inline on login/logout despite "non-blocking" comment | ≤800ms latency; IPs to third party | Fire-and-forget or remove |
| NIT | `_utils/token.ts:157-171` | Unused `verifyRefreshToken` with destructive mismatch path | Dead risk surface | Remove |
| NIT | `_utils/token.ts:109` | Hash compare `===` not constant-time | Minor | `timingSafeEqual` |

## 4. `src/calendar/`

**Purpose:** Month view aggregating holidays + event sessions + custom meetings, Redis-cached per month; Google Calendar holidays sync.

| Sev | Location | Issue | Impact | Fix |
|---|---|---|---|---|
| CRIT | `calender.controller.ts:56-57` + `calendar.routes.ts:20` | Route `DELETE /event` declares no `:id`; `findByIdAndDelete(undefined)` deletes nothing yet returns 204 "deleted" | Feature silently broken | Route → `/event/:id` |
| MED | `calendar.schema.ts:19-25` | No end>start refine; `type: z.string()` bypasses `eventType` enum used by response schema | Invalid ranges stored; later `z.array(event).parse` can throw 500 | Refine + `z.enum(eventType)` |
| MED | `calender.controller.ts:80-84` | Cache invalidated only for start-month | Multi-month events leave other months stale | Invalidate start+end months |
| MED | `calender.controller.ts:24-25` | `Number(req.params.year/month)` unvalidated | NaN into queries/cache keys | Zod params |
| LOW | `calender.controller.ts:43,46,96,111` | Double `setCacheWithGroup`; dead `if (!year)`; `new Date(holiday.start?.date)` may be Invalid Date | Minor waste/bad rows | Cleanup + guards |

## 5. `src/database/`

**Purpose:** All Mongoose models + `connection.ts`. **No hooks exist anywhere** (no hashing, no cascades).

| Sev | Location | Issue | Impact | Fix |
|---|---|---|---|---|
| HIGH | `media-upload.model.ts:7,12` | `require:` instead of `required:` | `src`/`alt` constraints silently disabled | Fix option name |
| HIGH | models-wide + `account.model.ts:69-83` | Populates return full `bank`/`aadhar`/`pan`/`resume` docs, no projection for non-admin readers | KYC leakage amplified by admin-route gap (§1) | Project safe fields |
| MED | `connection.ts:8-12` | No pool options (`maxPoolSize`, timeouts, retryWrites); bare `process.exit()` exits **code 0** on failure | Orchestrators see healthy crash | Options + `exit(1)` |
| MED | `notification.model.ts:51-55,104` | Hot path (unseen-per-user) lacks compound `{user,isSeen,createdAt}` index; standalone low-cardinality indexes near-useless | Slow scans at scale | Compound indexes |
| MED | `session.model.ts:22-28,61-65` | No index on `workshopId`/`participants`/attendance-participant lookups | Collection scans | Add indexes |
| MED | `attendance.model.ts:24-27` | `date` free-form String (vs Date for in/out times) | Format drift breaks unique/range/sort | Regex-validate ISO or day-granular Date |
| MED | `bank.model.ts:9-12` | `accountNumber` not unique-indexed | Duplicate financial identifiers | Sparse-unique index (+ phone uniqueness on `account.model.ts:41-47`) |
| MED | models-wide | No cascade delete middleware anywhere | Deleting User/Bank/Workshop orphans dependent docs/files | Cascade strategy |
| NIT | `holiday.model.ts:3-10` | `holidayTypes` missing `as const`; no unique date+title | Weaker types; duplicate holidays | Align with siblings |
| NOTE | — | Adding `pre('save')` hashing later would double-hash `accountRegisterController`'s already-hashed save | Future footgun | Audit when introducing hooks |

## 6. `src/events/`

**Purpose:** Workshop/session/participant CRUD + bulk session-attendance marking; marking auto-enrolls participants into workshop. Under development.

| Sev | Location | Issue | Impact | Fix |
|---|---|---|---|---|
| HIGH | `events.routes.ts:26-62` | Zero ownership/role checks on any workshop/session/participant mutation | Any authenticated user deletes/edits anything | Apply existing `authorize()` middleware |
| HIGH | `session/session-attendance.controller.ts:60-61` | `session.participants = success` wholesale replacement | Marking group B erases group A; concurrent writes lost | `$addToSet` (as sibling controller already does) |
| HIGH | `events.routes.ts:58` + `workshop-participant.controller.ts:9` | `addParticipantToWorkshop` skips validate(); `participantId` unchecked against collection | Garbage IDs persisted | Zod objectId + existence check |
| MED | `session/session.controller.ts:38-39` | `PUT /sessions/:id` route ⇒ `req.params.workshopId` always undefined | Workshop-scoping guard is dead code | Fix route or drop phantom param |
| MED | `session/session.controller.ts:59-68` | deleteSession never clears calendar cache that addSession populates | Stale calendar ≤90d | Call `deleteCache` |
| MED | `session/session.schema.ts:25` + controller:21 | `date: z.string()`; cache keys from `new Date(garbage)` → NaN months | Broken cache buckets | `z.coerce.date().refine(isFinite)` |
| MED | `participant/participant.controller.ts:39-44` | 404 wrapped in success envelope | Contract inconsistency | `throw new ApiError(404,…)` |
| LOW | `participant/participant.controller.ts:10,33` | Re-parse validated body; unrouted `readAllParticipant` without pagination | Dead weight | Cleanup |
| NOTE | Models | No capacity/seats field exists | Unlimited enrollment by design gap | Product decision |

## 7. `src/libs/`

### middleware/

| Sev | Location | Issue | Impact | Fix |
|---|---|---|---|---|
| HIGH | `middleware/error-handler.ts:39-44` | Non-ApiError messages sent verbatim to clients | Leaks Mongo/Mongoose/JWT internals | Generic message unless dev |
| HIGH | `middleware/metrics.ts:10-16` | Labels use raw `originalUrl` | Unbounded cardinality (`/api/user/:id` × ids) → memory blowup | Use `req.route.path` normalizer |
| MED | `middleware/request-id.ts:5-8` | Client `x-request-id` echoed to header/logs unsanitized | CRLF values throw 500s; log injection | Validate `/^[\w-]{1,64}$/` else regenerate |
| NIT | `middleware/protected-route.ts:6-84` | ~80 lines commented dead code | Noise | Delete |

### redis/

| Sev | Location | Issue | Impact | Fix |
|---|---|---|---|---|
| MED | `redis/redis-client.ts:7` | Silent fallback to `localhost:6379` | Prod works against wrong Redis | Fail fast in prod |
| MED | `redis/redis-utils.ts:40` | Unguarded `JSON.parse` of cached value | One corrupt entry → 500s until TTL | try/catch → treat as miss |
| LOW | `redis/redis-client.ts:11-14` | Hard stop after 10 retries, no reconnect-on-demand | Long outages need restart | Backoff ceiling instead of stop |

### utils/

| Sev | Location | Issue | Impact | Fix |
|---|---|---|---|---|
| HIGH | `utils/push-notification.ts:9-13` | `setVapidDetails(env!* )` at import time | Missing env crashes app at boot, obscure error | Lazy init + env validation |
| MED | `utils/mark-seen.ts:8-14` | Filter not scoped by `user` | Anyone marks any notification seen by ID | `{_id, user: userId}` |
| MED | `utils/push-notification.ts:24-37` | Unbounded concurrent sends per user | Push-service stampede | Chunk/p-limit |
| LOW | `utils/browser.ts:11` | Chromium `--no-sandbox` | Risk if fed untrusted content (it is — see worker XSS) | Sandboxed non-root |
| LOW | `utils/convert-object-id.ts:4` | Plain `Error` → 500 for bad input | Wrong status class | `ApiError(400,…)` |
| NIT | `utils/date-range.ts:1` | Empty dead file | Noise | Delete |

### class/, mail/, logger/, eslint-rules/

| Sev | Location | Issue | Impact | Fix |
|---|---|---|---|---|
| MED | `class/notification.ts:186-202` | Global notifications insert one doc per user + per-user Redis read-modify-write with unbounded `Promise.all` | O(users) writes; lost-update races | Fan-out-on-read or pipeline/lock |
| MED | `class/notification.ts:205-213` | `specific` branch skips `formatMessage` | Inconsistent titles/descriptions | Uniform formatting |
| MED | `mail/templates/*.ts:3` (all five) | `new Date().toLocaleString()` evaluated once at module load | Every email shows server-start timestamp | Move inside functions |
| MED | `mail/templates/onboard-mail.ts:118` | Login link lacks `https://` scheme | Broken relative link in email | Add scheme |
| LOW | `class/api-response.ts:13` | `success()` accepts arbitrary statusCode (e.g. 404 + success:true) | Envelope inconsistency | Constrain 2xx |
| LOW | `mail/templates/*` (pattern) | `name`/URL interpolated unescaped into HTML | HTML/phishing injection | Escape entities |
| LOW | `mail/resend-send-mail.ts:4,25` | Resend built at import (`API_KEY!`); errors to `console.error` | Boot-crash risk; lost logs | Lazy init + pino |
| LOW | `logger/http-logger.ts:29` | Logs full `originalUrl` incl. query string | Tokens in URLs get logged | Strip query (as request-logger does) |
| NIT | `eslint-rules/no-res-json.ts:16-24,71-73` | Matches any `.json()` call (false positives); ts-expect-error + any | DX annoyance | Narrow to res identifiers; type properly |

## 8. `src/mail/`

**Purpose:** Internal mailbox: inbox/outbox/send persisted to Mongo (Resend unused here).

| Sev | Location | Issue | Impact | Fix |
|---|---|---|---|---|
| CRIT | `mail.schema.ts:6` vs `mail.controller.ts:31` | Schema key `receiverID`, controller reads `receiversIDs` | Every send either rejected or sees `undefined` — feature cannot work | Align names |
| MED | `mail.controller.ts:11,61` | Inbox/outbox load all mails, no pagination/sort | Unbounded responses | skip/limit + sort |
| MED | `mail.controller.ts:48` | `body` stored verbatim (`z.string()`), rendered as HTML downstream | Stored XSS/injection vector | Sanitize or plain-text |

## 9. `src/notification/`

**Purpose:** Scoped notifications (global/role/specific) + Web Push subscriptions; 404/410 subscription cleanup correctly implemented (`../libs/utils/push-notification.ts:57-61` ✓).

| Sev | Location | Issue | Impact | Fix |
|---|---|---|---|---|
| CRIT | `webpush.controller.ts:74` | `deleteMany({ userId })` but model field is `user` (`database/push-subscription.ts`) | Disable-notifications deletes **zero rows**; pushes keep firing | `{ user: userId }` |
| HIGH | `webpush.controller.ts:17-27` + `notification.routes.ts:33` | Raw body upserted, endpoint-keyed, no zod, no user scoping | User A overwrites user B's subscription row (push-target hijack) | Validate + scope by `{user, endpoint}` |
| MED | `notification.controllers.ts:99` | Per-user list cached 7d; creation never invalidates | New notifications invisible up to TTL | Short TTL or invalidate on create |
| MED | `notification.controllers.ts:128-131` | Unseen count queries only `user: userId`, ignoring global/role scopes included in list (line 86) | Count diverges from list | Mirror `$or` filter |
| LOW | `notification.controllers.ts:85-87` | Main list unpaginated | Unbounded payloads | Paginate |

## 10. `src/permission/`

**Purpose:** `resource:action` string RBAC; `ROLE_PERMISSIONS` per-role Sets; `authorize(action, resource)` gates non-read actions.

| Sev | Location | Issue | Impact | Fix |
|---|---|---|---|---|
| CRIT | `authorize.ts:22-24` | `action === 'read'` unconditionally `next()` for every role | Read protection impossible **by construction**; root cause of admin GET exposures (§1) | Check `read` against ROLE_PERMISSIONS |
| MED | `authorize.ts:14-19,31-36` | Authz failures return `ApiResponse.success(…, 401/403)` | Breaks ApiError contract | Throw ApiError |
| LOW | `role-permission.ts:4` | `Record<string, Set<string>>` loses exhaustiveness; new `'intern'` role (`database/user.model.ts:3`) silently all-deny | Silent lockout | `Record<UserRole, Set<string>>` |

## 11. `src/public/` + cron endpoint security

**Purpose:** Health check + pass-protected cron triggers, mounted before auth (`src/index.ts:75`).

| Sev | Location | Issue | Impact | Fix |
|---|---|---|---|---|
| CRIT | `public.routes.ts:10-11` + `src/index.ts:75` | Cron triggers fully public; secret in URL path | Attendance creation/auto-checkout triggerable by outsiders knowing/guessing secret | Auth/network-restrict + header secret |
| HIGH | `../attendance/cron-job/create-attendance.cron.ts:15`, `auto-checkout-attendance.cron.ts:23` | Secret compared with `!==` (not constant-time), passed in path (leaks to logs/proxies) | Secret extraction feasible | `timingSafeEqual` + `Authorization` header |
| HIGH | `.env.example:12` | `CRON_SECRET=super` trivially guessable | Combined with above: full cron control | Min-length enforcement, rotate |

## 12. `src/seeds/`

**Purpose:** Bootstrap first admin + placeholder bank/account/media rows in a Mongo transaction.

| Sev | Location | Issue | Impact | Fix |
|---|---|---|---|---|
| CRIT | `create-first-user.ts:55` | Hardcoded admin password `ADMIN000` (pre-verified `admin@saher.com`) shipped in source | Guessable superuser on every seeded deployment | Random password, print once, force reset |
| HIGH | `create-first-user.ts:88-90` + `runner.ts:18-20` | Transaction failure caught/logged/**swallowed**; runner prints "Seed executed", exits 0 | Deployment "succeeds" with no user created | Rethrow + `process.exit(1)` |
| MED | `create-first-user.ts:52-53` | Emptiness check outside transaction (TOCTOU) | Concurrent runs → duplicate admins | Unique-index upsert / check inside tx |
| LOW | `runner.ts:8` | `MONGO_URI!` assertion | Opaque driver error | Explicit check + clear message |

## 13. `src/types/`

| Sev | Location | Issue | Impact | Fix |
|---|---|---|---|---|
| MED | `express.d.ts:10` | References `UserRole` without importing it while `export {}` makes this a module | TS2304 under strict — augmentation may not attach | `import type { UserRole } …` |
| OK | — | `req.user` shape matches what `protected-route.ts:107` attaches; `id`/`startTime` wired by request-id/request-timer | — | — |

## 14. `src/upload/`

**Purpose:** multer memoryStorage (5 MB cap, MIME whitelist, UUID filenames) → sharp webp resize → `public/uploads/images` + Media doc.

| Sev | Location | Issue | Impact | Fix |
|---|---|---|---|---|
| HIGH | `src/index.ts:64` | Router mounted **without** `protectedRoute` | Anonymous uploads | Mount behind auth |
| LOW | `image/image.controller.ts:16-19` | `Media.create` failure orphans written file | Disk garbage | Cleanup on failure |
| LOW | `image/image.service.ts:32` | `console.error` instead of logger | Lost structured logs | Use pino |
| OK | Config | Memory storage, size cap, whitelist, UUID names — no traversal; sharp errors caught | — | — |

## 15. `src/user/`

| Sev | Location | Issue | Impact | Fix |
|---|---|---|---|---|
| LOW | `user.controller.ts:13` | `findByIdAndUpdate` without `runValidators` | Schema constraints skipped on profile update | Pass option |
| NIT | `user.controller.ts:10,32` | Double-guard/assert on `req.user?.id` guaranteed by middleware | Noise | Single accessor |

## 16. `src/worker/`

**Purpose:** BullMQ worker rendering attendance PDFs via Puppeteer singleton browser; notifies users on completion.

| Sev | Location | Issue | Impact | Fix |
|---|---|---|---|---|
| HIGH | `attendance-report.ts:20` + `libs/utils/browser.ts:6-16` | `page` never closed, no try/finally | Chromium page/FD leak per job; crashed jobs abandon pages | try/finally `page.close()`; monitor browser |
| MED | `attendance-report.ts:102` | `data[0].date` crashes on empty result; no retry config | Job fails permanently; requester stuck "processing" | Guard empty; retries |
| MED | `attendance-report.ts:22-26` | Hard `limit:1000` silently truncates | Wrong totals/PDF for long ranges | Cursor iteration |
| MED | `attendance/template/attendance-pdf.ts:280-300` | `user.name/email` interpolated into HTML unescaped | Stored XSS executing inside headless Chromium render | Escape entities |
| LOW | `report.ts:12-18`, `attendance-report.ts:113-117` | Redis host hardcoded `'redis'` | Breaks non-compose deployments | Env-driven |

## Entrypoints: `src/index.ts` / `src/worker/index.ts`

| Sev | Location | Issue | Impact | Fix |
|---|---|---|---|---|
| HIGH | `index.ts:88-91` | `/metrics` unauthenticated | Exposes traffic patterns/statuses/Node internals | IP allowlist or auth |
| HIGH | `index.ts` (app-wide) | No rate limiting anywhere (no helmet/rate-limit deps) | Brute-forceable `/api/auth` | Global limiter + stricter auth limiter |
| MED | `index.ts:53` | `trust proxy = true` | Client-spoofable `X-Forwarded-For` poisons IP logging/limiting | Hop count or specific proxy IP |
| MED | `index.ts:86` | `docs/` served publicly at `/` | Internal docs/notes become world-readable | Restrict contents or gate path |
| MED | `index.ts:96` + `libs/redis/redis-client.ts:35-38` | No SIGTERM handler, no `server.close()`; only SIGINT quits Redis | Docker/K8s stops hard-kill mid-request | Handle SIGTERM → drain → quit |
| MED | `index.ts:72` | `await connectRedis()` uncaught | Redis outage at boot → opaque unhandled rejection | Wrap like `connectDb` |
| LOW | `index.ts:64-65` | uploadRouter before json/cookieParser | Cookies/body parsing differ on `/api/upload` | Confirm intentional or reorder |

---

# Cross-cutting concerns (merged findings spanning modules)

1. **Env & secrets discipline** — dotenv loaded but zero schema validation; `!` assertions everywhere (`token.ts`, `browser.ts`, `runner.ts`, VAPID, GOOGLE_API_KEY). Real-format Resend key committed in `.env.example:6` (rotate + purge history). Weak defaults: `JWT` example secrets, `CRON_SECRET=super`.
2. **CORS + cookies** — reflect-all origins + credentials + `sameSite:'none'` is the highest-severity systemic issue; affects every endpoint simultaneously (fix once in `index.ts` + refresh controller).
3. **Authorization consistency** — `authorize()` read-bypass + 5 unguarded admin routes + events module with none + `authorize` returning success envelopes. One coherent RBAC pass needed.
4. **Password handling** — no hash hooks anywhere; predictable seeded/default passwords; admin update path stores plaintext. Introduce hooks carefully (double-hash audit for existing hashed saves).
5. **Cache invalidation gaps (systemic)** — admin account/user delete-restore, calendar multi-month, session deletion, notification creation, reject-mark target — nearly every writer forgets some reader's keys; centralize an invalidation registry.
6. **Race conditions** — check-in TOCTOU, cron insertMany, refresh-token rotation, seeds duplicate-admin, correction pending-check. Prefer conditional updates/upserts + unique indexes over find-then-write.
7. **Timezone handling** — mixed naive Date/server-TZ math vs IST domain logic (`standardDateString`, `setHours`, `getMonth()+1` misses, future-dated auto-checkout). Standardize on Temporal/fixed-zone helpers (the dep already exists).
8. **Data lifecycle** — no cascades (User/Bank/Workshop deletes orphan children), temp PDFs never cleaned, orphaned upload files, soft-delete without restore-side cleanup.
9. **Observability safety** — metric cardinality blowup, query-string logging, error-message leakage, `console.error` stragglers.
10. **Operational readiness** — no rate limiting, helmet, graceful shutdown, or boot-time dependency failure strategy (DB exit(0), Redis unhandled rejection).

---

*Generated by automated deep-review agents; every finding cites `file:line`. Verify each against current HEAD before fixing — line numbers drift.*
