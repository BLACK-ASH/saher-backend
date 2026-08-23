<!-- refreshed: 2026-08-23 -->
# Architecture

**Analysis Date: 2026-08-23**

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                       Client Request                        │
├──────────────────┬──────────────────┬───────────────────────┤
│   [Express App]  │ [Middleware/RBAC]│   [Static Docs]       │
│   `src/app.ts`   │  `src/libs/`     │     `/docs`           │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                    │
         ▼                  ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    Feature Modules                          │
│         `src/<feature>/` (e.g., `attendance`, `auth`)        │
└─────────────────────────────────────────────────────────────┘
         │                  │
         ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│  [Mongoose Models]        [Redis/BullMQ Worker]             │
│  `src/database/`          `src/worker/`                     │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| **Entry Point** | App initialization, DB/Redis connection | `src/index.ts` |
| **Routing** | Request handling and routing logic | `src/app.ts` |
| **Modules** | Feature logic (controllers, schemas, routes) | `src/<feature>/` |
| **Data Models** | Mongoose schemas and models | `src/database/` |
| **Worker** | Background task processing (BullMQ) | `src/worker/` |
| **Infrastructure** | Shared libs, middlewares, utilities | `src/libs/` |

## Pattern Overview

**Overall:** Modular Express 5 + TypeScript + Mongoose (REST API)

**Key Characteristics:**
- **Modularization:** Feature-based structure (`src/feature-name/`) encapsulating routes, controllers, and schemas.
- **Async Handling:** Express 5 auto-handles async errors; no try/catch wrappers required. Global handler at `src/libs/middleware/error-handler.ts`.
- **RBAC:** Centralized authorization via `src/permission/`.
- **Background Tasks:** Separate BullMQ process for intensive tasks (e.g., attendance reports).

## Data Flow

### Primary Request Path

1. **Request Received:** Routed via `src/app.ts`.
2. **Pre-processing:** Request ID, Logger, Timer, Metrics, CORS, `cookieParser`, Rate Limiting (`src/app.ts`).
3. **Route Matching:** `protectedRoute` middleware checks authentication (`src/libs/middleware/protected-route.ts`).
4. **Validation:** Feature-specific Zod schema validation (`validate()` middleware).
5. **Logic:** Controller interacts with Mongoose Models (`src/database/`) or Redis.
6. **Response:** `ApiResponse.success(...)` or thrown `ApiError` (caught by `errorHandler`).

### Worker Flow

1. **Trigger:** API or Cron job adds a job to BullMQ.
2. **Worker:** `src/worker/index.ts` consumes the job.
3. **Task:** Executes task (e.g., `src/worker/attendance-report.ts`).

## Architectural Constraints

- **Type:** ESM (`"type": "module"`), requires `.js` extensions in imports.
- **Auth:** Protected routes use `protectedRoute`; admin routes add `authorize()` (`src/permission/authorize.ts`).
- **Data Validation:** Zod schemas MUST be used for all inputs; no raw mass-assignment.
- **Timezone:** Use `src/libs/utils/` for IST domain logic.
- **Redis:** Writers MUST invalidate corresponding cached reads.

## Error Handling

**Strategy:** Global middleware wrapper.

**Patterns:**
- Throw `ApiError` for domain-specific errors.
- `src/libs/middleware/error-handler.ts` handles all errors.

## Cross-Cutting Concerns

**Logging:** Pino (`src/libs/logger/logger.ts`).
**Validation:** Zod.
**Authentication:** JWT (`src/libs/middleware/protected-route.ts`).
**Observability:** Prometheus metrics (`prom-client`).

---

*Architecture analysis: 2026-08-23*
