---
name: add-module
description: Use when adding a new feature module, route, endpoint, or Mongoose model to saher-backend - step-by-step wiring recipe matching this repo's patterns (routes, zod schemas, controllers, RBAC, index.ts mounting).
---

# Adding a Module / Endpoint to saher-backend

Follow the nearest sibling module as a template (e.g. copy the shape of `src/notification/` for a small feature).

## New REST module checklist

1. **Schema (zod)** — `<module>/<name>.schema.ts`: input validation only. Reuse helpers from `src/libs/utils/` (objectId coercion etc.). Never trust raw bodies.
2. **Controller** — `<module>/<name>.controller.ts`:
   - Read parsed data from `req.validated` / validated body per sibling style.
   - Scope every user-data query by `req.user.id`.
   - Return `ApiResponse.success(res, { message, data, statusCode })`; throw `new ApiError(status, msg)` on failure.
3. **Routes** — `<module>/<name>.routes.ts`: `Router()` with handlers wired through `validate()` middleware.
4. **Mount in `src/index.ts`**:
   - User-facing: `app.use('/api/<name>', protectedRoute, <name>Router);`
   - Admin-only: import `authorize` and add it too: `protectedRoute, authorize('action','resource'), router`.
5. **Model** (if new collection): create `src/database/<thing>.model.ts`, add indexes for hot queries now, register any enums as `as const`.
6. **Cache** (if reading through Redis): use `getCache/setCacheWithGroup/deleteCache` from `src/libs/utils/cache*` / `redis-utils`; add invalidation calls to EVERY writer of that data.
7. **Notifications/push** fan-out: reuse `NotificationService` in `src/libs/class/notification.ts`, never inline loops over users in controllers.
8. **OpenAPI**: add paths to `openapi/openapi.yaml` so `pnpm docs:build` stays complete.

## New background job

Queue producer in the module; consumer in `src/worker/` registered from `src/worker/index.ts`. Always close Puppeteer pages in `finally`. Guard against empty result sets before indexing `[0]`.

## Verify

`pnpm typecheck && pnpm lint`, then exercise the route in dev (`pnpm dev`). Update graph afterwards: `graphify update .`
