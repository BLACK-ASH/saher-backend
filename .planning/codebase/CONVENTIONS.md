# Coding Conventions

**Analysis Date:** 2026-08-23 (updated post fix-plans 00–17)

## Naming Patterns

**Files:**
- Kebab-case: `src/auth/auth.routes.ts`, `tests/user/user.test.ts` (enforced by `unicorn/filename-case`)

**Functions:**
- CamelCase: `loginController`, `hashPassword`, `validate`

**Variables:**
- CamelCase (default): `const user = await User.findOne(...)`
- Uppercase (constants): `const PASSWORD = '...'`, `const NOW = new Date(...)`

**Types:**
- PascalCase: `UserType`, `ApiError`, `SessionT`, `UserRole`

## Code Style

**Formatting:**
- Tool: `prettier`
- Settings: `.prettierrc` (semi: true, singleQuote: true, trailingComma: 'all', printWidth: 100)

**Linting:**
- Tool: `eslint` with `typescript-eslint` and `eslint-plugin-ununicorn` config in `eslint.config.mjs`
- Key rules: `custom/no-res-json` (autofixes raw `res.status().json()` to `ApiResponse.success`), `import/order` (enforced), `unicorn/filename-case` (kebabCase)

## Import Organization

**Order:**
1. Builtin/External: e.g., `import { Router } from 'express';`
2. Internal/Project: e.g., `import { app } from '../../src/app.js';`
- Enforced by `eslint` `import/order` rule in `eslint.config.mjs`
- ESM: relative imports inside `.ts` must end in `.js`

**Path Aliases:**
- Not used; relative paths with `.js` suffix

## Error Handling

**Patterns:**
- Centralized `errorHandler` middleware (`src/libs/middleware/error-handler.ts`)
- Throw `ApiError` (`src/libs/class/api-error.ts`) for operational errors
- Express 5 forwards async rejections — no try/catch wrappers around handlers
- Non-`ApiError` messages are masked as generic `Internal Server Error.` in production (real message only when `NODE_ENV !== 'production'`; always pino-logged)

## Validation & Security Conventions (post fix-plans)

- **Env:** validated at boot via zod in `src/config/env.ts` — never bare `!` assertions; secrets ≥32 chars where enforced
- **Input:** every body/params/query goes through zod via `validate(schema, source)` (`src/libs/middleware/validate-zod-schema.ts`); strict schemas (`.strict()`, cross-field `.refine()` re-applied on updates) — never pipe raw `req.body` into Mongo filters/updates
- **Auth:** user routes get `protectedRoute`; privileged routes add `authorize(action, resource)` — read actions now require explicit role permission (`src/permission/authorize.ts`, read-bypass removed 2026-08-22)
- **Rate limiting:** `express-rate-limit` — strict limiter on `/api/auth` (20 req/15min/IP) + global API cap (300 req/15min/IP)
- **Cron/public routes:** secret-protected via shared `requireCronSecret` guard (`src/libs/middleware/cron-secret.ts`) — sha256 + `timingSafeEqual`
- **Sessions:** password change/reset revoke sessions via `revokeUserSessions(uid)` (`src/libs/utils/token.ts`); logout purges Redis session
- **One-time tokens:** stored SHA-256-hashed in Redis keys (`hashToken`), deleted immediately after use
- **HTML output:** interpolate with `src/libs/utils/html-escape.ts` (mail templates, worker PDF HTML)

## Logging

**Framework:** `pino` (`src/libs/logger/logger.ts`)

**Patterns:**
- `httpLogger` for request tracking; `req.log` attached to request
- Query strings stripped from logs (`http-logger.ts`) — tokens in URLs not logged
- Never `console.error` — use pino logger

## Comments

**When to Comment:**
- Complex logic, domain-specific constraints (IST time math via `src/libs/utils/` date helpers), or deliberate shortcuts marked `ponytail:` naming ceiling + upgrade path

## Function Design

**Parameters:** Zod schemas + `validate()` middleware for body/query validation
**Return Values:** `ApiResponse.success` / `ApiResponse.created` only (type-level 2xx constraint catches misuse); errors via thrown `ApiError`

## Module Design

**Structure:** Feature-based modules in `src/<name>/` (e.g., `src/auth/`, `src/attendance/`); all Mongoose models centralized in `src/database/*.model.ts`; routers mounted only in `src/index.ts`

---

*Convention analysis: 2026-08-23*
