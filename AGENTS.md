# saher-backend — agent notes

Express 5 + TypeScript ESM REST API (Mongoose 9/MongoDB, Redis + BullMQ, zod v4, pino/prom-client, Puppeteer). NGO workforce platform: attendance, workshops/events, notifications.

## Commands

- `pnpm dev` — API server (tsx watch). `pnpm dev:worker` — separate BullMQ worker. Both processes are needed for full behavior (attendance-report jobs run only in the worker).
- Verify changes with `pnpm typecheck && pnpm lint`. There is no test suite — don't search for one.
- `pnpm build` runs `docs:build` (Redocly → `docs/index.html`) **before** `tsc`; docs generation failure breaks compilation order assumptions.
- `pnpm format` (prettier), `pnpm spellcheck` (cspell over the whole repo, including markdown), `pnpm seed` (bootstraps the first admin from `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` env, pre-verified; fails without them).
- Prod: `pnpm prod` = clean → redocly lint → build → start.

## Toolchain quirks

- `"type": "module"`: relative imports inside `.ts` must end in `.js` (e.g. `./user/user.routes.js`).
- Express 5 forwards async rejections to the global error handler (`src/libs/middleware/error-handler.ts`) — no try/catch wrappers around handlers.
- Responses use `ApiResponse.success(...)` / thrown `ApiError`; a custom ESLint rule (`src/libs/eslint-rules/`) autofixes raw `res.status().json()`.
- Env loads via `dotenv/config` import at the top of `src/index.ts`. There is no env schema validation — missing vars fail late via `!` assertions.

## Layout

- Feature modules under `src/<name>/` (admin, attendance, auth, calendar, events, mail, notification, upload, user), each with its own `*.routes.ts`; routers are mounted only in `src/index.ts`.
- ALL Mongoose models live centrally in `src/database/*.model.ts`. Shared infra in `src/libs/` (middleware incl. `protectedRoute` and the zod `validate()` wrapper, RBAC in `permission/`, redis cache utils, mail templates).
- `src/public/` holds unauthenticated routes (health check + pass-protected cron triggers); `src/worker/` holds BullMQ consumers.

## Conventions that matter

- Authorization: user-facing routes get `protectedRoute`; admin routes additionally get `authorize(action, resource)`. Caveat: `authorize()` passes every `read` action unconditionally (`src/permission/authorize.ts:22`) — scope queries by `req.user.id` instead of trusting it.
- Validate every body/params/query with zod via `validate()`; never feed raw `req.body` into Mongo filters or updates (this repo has mass-assignment history).
- Every Redis-cached read needs invalidation in EVERY writer of that data — recurring bug class across modules.
- Attendance/calendar time math is IST domain logic; reuse `src/libs/utils/` date helpers, never mix server-timezone boundaries into range queries.

## Gotchas

- `openapi/openapi.yaml` is outdated and NOT a reliable endpoint reference — read the route files instead. Redocly still builds public docs from it (`docs/` is served at `/`).
- The worker hardcodes Redis host `redis` (`src/attendance/export/report.ts`, `src/worker/attendance-report.ts`) — only works under docker-compose service naming.
- Deploy: push to `main` triggers a self-hosted runner that `git reset --hard origin/main`s `/home/saher/Test/saher-backend` and `docker compose up -d --build backend` (`.github/workflows/dev-deploy.yml`).
- **Branch Pushing Rule:** MUST ALWAYS ask explicit user permission before pushing commits to `main` or `dev` branches.
- Commits follow conventional commits (commitlint + husky + lint-staged).
- Read `MODULE_ANALYSIS.md` before touching auth, admin, attendance, or permission code — it catalogs ~120 known bugs (13 CRITICAL) with `file:line` refs; don't reintroduce those patterns.
- Use GSD for work: plan → execute → verify per task; keep atomic commits per fix.
- Autonomous iterative fixing (fix-plans/): analyze → baseline-verify → minimal fix → test (`pnpm typecheck && pnpm lint && pnpm test`) → update `FIX-REPORT.md` + OpenAPI if endpoints changed. Only stop to ask when a change is major/product-level or breaks compatibility; otherwise proceed and report.
- A knowledge graph lives in `graphify-out/` — prefer `graphify query "<question>"` over grep for codebase questions.
