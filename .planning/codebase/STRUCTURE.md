# Codebase Structure

**Analysis Date: 2026-08-23**

## Directory Layout

```
src/
├── admin/          # Admin-specific modules and services
├── attendance/     # Attendance logic, cron jobs, export
├── auth/           # Authentication, session, password management
├── calendar/       # Calendar functionality
├── config/         # Environment variables and config
├── database/       # Mongoose models (CENTRALIZED)
├── events/         # Events, workshops, sessions
├── leave/          # Leave management
├── libs/           # Shared infrastructure (middleware, redis, logger, utils)
├── mail/           # Mail-related logic
├── notice/         # Notice management
├── notification/   # Notification and webpush
├── payroll/        # Payroll logic
├── permission/     # RBAC configuration and authorization
├── public/         # Public routes
├── reimbursement/  # Reimbursement logic
├── seeds/          # DB seeding scripts
├── types/          # Global type definitions
├── upload/         # File uploads
├── user/           # User management
├── worker/         # BullMQ background workers
├── app.ts          # Express app definition and routing
└── index.ts        # App server entry point
```

## Directory Purposes

**`src/<feature>/`:**
- Purpose: Feature modules.
- Contains: `*.routes.ts`, `*.controller.ts`, `*.schema.ts`, `*.service.ts`.
- Key files: `*.routes.ts` (router definition).

**`src/database/`:**
- Purpose: Central repository for all Mongoose models.

**`src/libs/`:**
- Purpose: Reusable cross-cutting functionality.
- Key subdirs: `middleware/` (Express middleware), `redis/` (cache utils), `logger/`.

## Key File Locations

**Entry Points:**
- `src/index.ts`: Server startup.
- `src/app.ts`: Express application setup and middleware chain.

**Configuration:**
- `src/config/env.ts`: Environment variables and configuration.

## Naming Conventions

**Files:**
- kebab-case (e.g., `attendance.route.ts`, `get-payroll.controller.ts`).
- ESM import requirement: Explicit `.js` extension in imports.

**Directories:**
- kebab-case for feature folders.

## Where to Add New Code

**New Feature Module:**
- Create `src/<feature>/` directory.
- Define `routes.ts`, `controller.ts`, `schema.ts`.
- Mount in `src/app.ts`.

**New Shared Utility/Middleware:**
- Place in `src/libs/<type>/`.

**New Mongoose Model:**
- Add `*.model.ts` to `src/database/`.

---

*Structure analysis: 2026-08-23*
