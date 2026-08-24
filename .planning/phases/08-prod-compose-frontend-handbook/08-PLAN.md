---
wave: 1
depends_on: []
files_modified:
  - deploy/docker-compose.yml
  - deploy/nginx.conf
  - .github/workflows/dev-deploy.yml
  - .env.example
  - FRONTEND-HANDBOOK.md
autonomous: true
---

# Phase 08: Plan — Production Compose Support & Frontend Handbook

**Goal:** Repo carries the production topology (nginx + frontend + backend + worker); deploys rebuild worker; frontend agent gets a complete integration handbook.

## must_haves
- [ ] deploy/docker-compose.yml defines nginx, frontend, backend, worker services (backend/worker from this Dockerfile).
- [ ] deploy/nginx.conf routes /api → backend:4000, /docs + /temp statics to backend, catch-all → frontend:3000, sets X-Forwarded-* and client_max_body_size.
- [ ] dev-deploy.yml runs `docker compose up -d --build backend worker`.
- [ ] .env.example documents BASE_URL (public origin for mail links) and CORS_ORIGINS semantics.
- [ ] FRONTEND-HANDBOOK.md covers envelope, auth cookies, RBAC matrix, soft delete/restore conventions, pagination meta, notification actions, IST dates, upload endpoints, OpenAPI pointer.

## Task 1: Reference compose + nginx config
### read_first
- Dockerfile, docker-compose.dev.yml, src/app.ts:99-100 (static paths), .github/workflows/dev-deploy.yml
### action
Create deploy/docker-compose.yml with services nginx (80), frontend (image placeholder nextjs-app:3000), backend (build .., env_file .env, depends_on mongo+redis optional external note), worker (same build, command overridden to pnpm start:worker). Healthchecks hit backend /api/health. Create deploy/nginx.conf with upstream blocks and location routing per must_haves.
### acceptance_criteria
- `docker compose -f deploy/docker-compose.yml config` exits 0
- grep "start:worker" deploy/docker-compose.yml matches; grep "proxy_pass" deploy/nginx.conf shows backend and frontend upstreams

## Task 2: Deploy workflow + env docs
### read_first
- .github/workflows/dev-deploy.yml, .env.example
### action
1. dev-deploy.yml: change compose command to `docker compose up -d --build backend worker`.
2. .env.example: add comment lines — BASE_URL: public https origin used in mail/notification links; CORS_ORIGINS: comma-separated allowlist, empty reflects all origins (dev only).
### acceptance_criteria
- grep "backend worker" .github/workflows/dev-deploy.yml matches
- grep "BASE_URL" .env.example has explanatory comment

## Task 3: FRONTEND-HANDBOOK.md
### read_first
- openapi/openapi.yaml, src/app.ts route mounts, src/libs/class/api-response.ts, src/libs/middleware (protectedRoute/authorize), one routes file per module (events/reimbursement/notice/attendance), RESEARCH.md handbook inputs
### action
Write FRONTEND-HANDBOOK.md with sections: Base URL & proxying (/api via nginx), Response envelope + error shape, Auth (cookie session, login/refresh/logout flow), RBAC matrix table (module × action × resource from route files), Resource modules table (path prefix, key endpoints), Soft-delete conventions (isDeleted param default false, restore PATCH), Pagination meta shape, Notifications + action objects, Dates are IST, Uploads (multipart endpoints), OpenAPI/docs pointer (/docs).
### acceptance_criteria
- test -f FRONTEND-HANDBOOK.md; grep "isDeleted" and "ApiResponse" both match in it
- pnpm spellcheck passes on new files
