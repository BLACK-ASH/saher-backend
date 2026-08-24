# Phase 08: Production Compose Support & Frontend Handbook — Context

**Gathered:** 2026-08-24
**Status:** Ready for planning
**Source:** User directive (plan-phase args)

<domain>
## Phase Boundary

Target architecture: single docker-compose running nginx + Next.js frontend + this backend + BullMQ worker; nginx serves the frontend and forwards `/api` to backend. Backend must support this with zero code drift between repo and server. A handbook must be produced so a frontend agent can integrate without reading backend source.

</domain>

<decisions>
## Implementation Decisions

### Locked
- Reference compose + nginx config live in-repo under `deploy/` — the server copy at /home/saher/Test/docker-compose.yml is unversioned and drifted.
- Deploy workflow must rebuild/restart `worker` alongside `backend` (`docker compose up -d --build backend worker`) — currently worker ships stale code forever.
- nginx config: `/api/` → `backend:4000`, `/docs` statics from backend, `/temp` downloads from backend public dir, frontend catch-all → `frontend:3000`, `client_max_body_size` sized for uploads, proxy_set_header X-Forwarded-* (backend sets trust proxy already).
- `.env.example`: BASE_URL documented as PUBLIC https origin (used in mail links), CORS_ORIGINS as comma-separated allowlist (empty = reflect-any, dev only).
- FRONTEND-HANDBOOK.md at repo root: response envelope `{success, message, data, meta}`, cookie auth flow, RBAC actions/resources per module, soft-delete semantics (`isDeleted` query param default false, restore PATCH endpoints), pagination meta shape, notification action objects (`{type:'download',label,url,method}`), IST date semantics, upload endpoints, OpenAPI pointer.

### the agent's Discretion
- Compose details: whether mongo/redis are services in the reference compose or external — mirror what the deploy workflow implies (server-side compose owns them); document either way.
- Handbook section ordering.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `Dockerfile`, `docker-compose.dev.yml` — image/deps baseline
- `.github/workflows/dev-deploy.yml` — deploy path being fixed
- `src/app.ts` (:54-58 cors, :99-100 statics), `src/config/env.ts` (BASE_URL, CORS_ORIGINS)
- `src/libs/redis/redis-client.ts:17` — REDIS_URL-derived BullMQ connection (hardcoded-host fix already landed)
- `package.json` scripts: start / start:worker
- AGENTS.md gotchas (worker redis host note is stale post-fix — verify before repeating it)

</canonical_refs>

<deferred>
## Deferred Ideas

- HTTPS/certbot termination in nginx (assumed handled at host/proxy layer)
- Multi-instance rate-limit store (rate-limit-redis) if backend ever replicas

</deferred>
