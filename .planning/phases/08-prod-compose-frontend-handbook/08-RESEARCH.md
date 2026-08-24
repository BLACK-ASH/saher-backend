# Phase 08: Research

## Architecture compatibility audit (target: nginx + Next.js frontend + backend + worker, single compose)

| Concern | State | Verdict |
|---|---|---|
| BullMQ/redis connection | derived from REDIS_URL (`src/libs/redis/redis-client.ts:17`, hardcoded-host fix landed) | ✓ |
| Worker process | `pnpm start:worker` (`node dist/worker/index.js`) exists | ✓ |
| Puppeteer in image | chromium + PUPPETEER_EXECUTABLE_PATH in Dockerfile | ✓ |
| Reverse proxy trust | `app.set('trust proxy', true)` (src/app.ts) | ✓ |
| CORS behind same-origin nginx | CORS_ORIGINS allowlist env; empty = reflect-all (dev only) | ✓ document only |
| Health endpoint | src/public health route | ✓ compose healthcheck target |
| Statics via nginx | backend serves docs/ + public/ (temp downloads) at root paths — nginx must forward `/docs`, `/temp` (or let backend own them) | plan nginx config |
| **Prod compose** | lives ONLY on server (/home/saher/Test/docker-compose.yml), unversioned | GAP → deploy/docker-compose.yml reference |
| **Deploy staleness** | workflow runs `docker compose up -d --build backend` only — worker never rebuilt/restarted | GAP → include worker |
| .env.example BASE_URL/CORS_ORIGINS | present but underdocumented (BASE_URL = public origin used in mail links) | GAP → doc lines |

## Frontend handbook inputs
- Envelope: ApiResponse.success shape {success, message, data, meta?}; errors thrown ApiError → global handler envelope.
- Auth: httpOnly cookie session; protectedRoute on user routes; admin adds authorize(action, resource); caveat: authorize passes all read actions — irrelevant to frontend but note RBAC matrix per module from routes files.
- Soft delete: isDeleted query param (default false) on list GETs; PATCH .../restore/:id endpoints.
- Notification action objects {type,label,url,method}; IST dates; upload endpoints; OpenAPI at /docs (redoc build).
