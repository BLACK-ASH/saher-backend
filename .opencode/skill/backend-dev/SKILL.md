---
name: backend-dev
description: Use when developing, debugging, or reviewing saher-backend code - Express 5 + TypeScript + Mongoose conventions, commands, module map, and verification workflow for this repository.
---

# Backend Development Workflow

## Stack

Express 5 · TypeScript (ESM, `type: module`) · Mongoose 9 / MongoDB · Redis + BullMQ · pino + prom-client · zod v4 · Resend · web-push · Multer/Sharp · Puppeteer.

## Module map

| Path                  | Role                                                                                                |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| `src/index.ts`        | HTTP entrypoint; mounts ALL routers and middlewares                                                 |
| `src/worker/index.ts` | Separate BullMQ worker process (`pnpm dev:worker`)                                                  |
| `src/admin`           | Admin API: accounts, banks, users (requires `authorize`)                                            |
| `src/attendance`      | Mark/check-in/out, corrections, holidays, export, cron jobs                                         |
| `src/auth`            | JWT access + rotating refresh tokens, Redis sessions, email flows                                   |
| `src/calendar`        | Month aggregation with Redis cache, Google holidays sync                                            |
| `src/database`        | Every Mongoose model + connection                                                                   |
| `src/events`          | Workshops/sessions/participants (under development)                                                 |
| `src/libs`            | ApiResponse/ApiError, middleware, redis utils, logger/metrics, mail templates, RBAC (`permission/`) |
| `src/mail`            | Internal mailbox endpoints                                                                          |
| `src/notification`    | In-app notifications + web push                                                                     |
| `src/public`          | Health check + pass-protected cron triggers                                                         |
| `src/seeds`           | First-admin bootstrap (`pnpm seed`)                                                                 |
| `src/upload`          | Image pipeline: multer memory → sharp → disk + Media doc                                            |
| `src/user`            | Self-service profile                                                                                |

## Commands

```bash
pnpm dev          # API server (tsx watch)
pnpm dev:worker   # background worker
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint .   (lint:fix to autofix)
pnpm format       # prettier write
pnpm spellcheck   # cspell .
pnpm seed         # bootstrap first admin
pnpm docs:build   # Redocly HTML from openapi/openapi.yaml
```

## Request flow convention

`route file` → `validate(zodSchema)` → `controller` → model/service. Responses via `ApiResponse.success`; failures throw `ApiError`. Express 5 forwards async rejections to the global error handler — no try/catch wrappers needed.

## Before finishing any task

1. `pnpm typecheck && pnpm lint`
2. Confirm new routes are mounted in `src/index.ts` behind the right middleware.
3. Confirm cache writes have invalidation counterparts.
4. Run `graphify update .` after code changes to keep the knowledge graph current.
