# Saher Backend

REST API for the **SAHER NGO workforce platform** — attendance, workshops/events, leave,
payroll, reimbursement, notifications. Express 5 + TypeScript (ESM) on Mongoose/MongoDB,
Redis + BullMQ for background jobs, Puppeteer/ExcelJS for report generation.

> Frontend integration? Read **[FRONTEND-HANDBOOK.md](./FRONTEND-HANDBOOK.md)** — response
> envelopes, auth cookies, RBAC matrix, soft-delete conventions, IST dates.
> Full API contract: **OpenAPI at `/docs`** once running (Redoc, built from `openapi/openapi.yaml`).

## Stack

| Layer | Tech |
|---|---|
| Runtime | Node 24 · TypeScript ESM (`"type": "module"` — relative imports end in `.js`) |
| HTTP | Express 5 (async rejections flow to the global error handler) |
| Data | MongoDB via Mongoose 9 (transactions → replica set required) |
| Cache / jobs | Redis + BullMQ (separate worker process) |
| Validation | zod v4 via `validate()` middleware on every body/query/params |
| Files | Multer memory storage; images normalized to WebP via Sharp; docs stored as-is |
| Reports | Puppeteer (PDF, chromium bundled in image) + ExcelJS (xlsx) |
| Observability | pino logging, prom-client metrics |

## Modules

`src/<module>` each with its own router, mounted only in `src/app.ts`:

| Module | Purpose |
|---|---|
| `auth` | JWT access+refresh cookies, Redis sessions, email verify/reset flows |
| `admin` | accounts, bank details, users (soft delete + restore) |
| `user` | self-service profile, colleague search |
| `attendance` | check-in/out, overtime, corrections, holidays (+restore), BullMQ report exports |
| `events` | programs / workshops / sessions / participants (all soft-delete + restore), session attendance, reminder push, session report export |
| `reimbursement` | bill lifecycle (create→handle→settle), recycle, balance enquiry with settlement netting, filtered PDF/XLSX bill export |
| `payroll` | cron generation, approval gate, installment payments |
| `leave` | types, applications, balances |
| `calendar` | month aggregation (holidays+sessions+events), custom events (+restore), Google holidays sync |
| `notice` | noticeboard (soft delete + restore; TTL expiry is separate lifecycle) |
| `notification` | feed, unseen count, web-push (VAPID) subscribe/enable/disable |
| `mail` | internal inbox/outbox |
| `upload` | images/documents → Media ids used across payloads (see `samples/README.md`) |
| `public` | `/api/health`, secret-guarded cron triggers |

Shared infra lives in `src/libs` (ApiResponse/ApiError, middleware, RBAC in
`src/permission`, redis utils, date helpers). All Mongoose models are centralized in
`src/database`.

## Quickstart

```bash
pnpm install

# local infra (mongo replica set + redis)
docker compose -f docker-compose.dev.yml up -d

cp .env.example .env          # fill secrets (JWT_ACCESS_SECRET, RESEND_API_KEY, ...)

pnpm seed                     # bootstrap first admin from SEED_ADMIN_EMAIL/PASSWORD

pnpm dev                      # API on :4000
pnpm dev:worker               # BullMQ worker — run BOTH for full behavior
```

Reports/export jobs execute only in the worker; notifications carry the download link.

## Scripts

| Command | What |
|---|---|
| `pnpm dev` / `dev:worker` | tsx watch for API / worker |
| `pnpm typecheck` / `lint` / `format` | tsc --noEmit · eslint · prettier |
| `pnpm test` | vitest (in-memory MongoDB replica set, fake Redis, inert BullMQ — no external services) |
| `pnpm build` | Redocly docs → `docs/index.html`, then tsc |
| `pnpm prod` | clean → docs lint → build → start (`node dist/index.js`) |
| `node scripts/make-upload-samples.mjs` | regenerate `samples/` upload fixtures |

## Environment

See [`.env.example`](./.env.example) — every var is commented. Highlights:

- `MONGO_URI` must point at a **replica set** (transactions).
- `BASE_URL` = public https origin used inside mail/notification links.
- `CORS_ORIGINS` = comma-separated allowlist; unset reflects any origin (dev only).

## Conventions that matter

- Responses: `ApiResponse.success` envelope `{ success, message, data, meta? }`; failures throw `ApiError` (global handler formats them). Never hand-roll `res.status().json()`.
- **Soft delete everywhere**: business resources use `isDeleted` + `PATCH .../restore/:id`;
  no permanent-delete paths. List GETs accept `?isDeleted=true` for trash views.
- Timezone: attendance/calendar math is **IST** (`src/libs/utils/date-time.ts`) — never server-TZ boundaries.
- Every cached read has invalidation in *every* writer of that data.
- After any endpoint change: update `openapi/` + register in `openapi.yaml`, run `pnpm docs:lint`.

## Deployment

Single docker-compose topology (reference in [`deploy/`](./deploy)): **nginx** reverse proxy
serves the Next.js frontend and forwards `/api`, `/docs`, statics to the backend container;
**backend** and **worker** build from the repo Dockerfile (chromium included for Puppeteer),
sharing a volume so worker-generated exports are downloadable.

Push to `main` triggers a self-hosted runner that rebuilds both `backend` and `worker`
(`.github/workflows/dev-deploy.yml`). Branch policy: explicit permission required before
pushing to `main` or `dev`.

## Testing

```bash
pnpm test            # or: pnpm vitest run tests/<module>
```

Integration-style supertest suites per module plus worker/cleanup coverage. Upload fixture
files for manual poking live in [`samples/`](./samples).
