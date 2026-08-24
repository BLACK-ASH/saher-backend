# Roadmap

## Phase 1: Expand File Upload Support

**Goal:** Extend the existing `/api/upload/image` endpoint to support PDF, DOC, PPT, and Excel files, following the current Multer/Sharp implementation patterns.

**Deliverables:**
- Update Zod validation schemas to accept new MIME types.
- Modify Multer storage/filter logic to allow document extensions.
- Ensure Media model and downstream processing (if any) handle non-image types.
- Update tests to cover new file types.

---

## Phase 2: Attendance Export — Excel Format and One-Day Temporary Storage

**Goal:** Extend attendance export so users can download reports as Excel in addition to the existing PDF, and store generated PDF/Excel files temporarily (auto-deleted after one day) instead of persisting them indefinitely.

**Deliverables:**
- Add Excel (.xlsx) generation alongside the existing Puppeteer PDF pipeline for attendance report exports.
- Store both PDF and Excel exports as temporary artifacts with a one-day retention window.
- Automatic cleanup of expired export files (cron suggested by user; evaluate alternatives already present in the codebase, e.g. BullMQ delayed/repeatable jobs, before adding a new cron surface).
- Tests covering Excel export output validity and cleanup behavior.

---

## Phase 3: Attendance and Leave Verification for Payroll

**Goal:** Ensure attendance and leave data is accurate to serve as the foundation for payroll tracking. This phase tracks estimated payroll based on attendance and leave records, providing a mechanism for admin review and final approval, without implementing a payment gateway.

**Deliverables:**
- Audit attendance and leave tracking mechanisms to ensure data integrity for payroll calculations.
- Implement payroll estimation logic based on verified attendance and leave records.
- Create an admin review interface/workflow for final payroll approval.
- Investigate existing patterns for payroll approval and implement if missing.
- Tests to verify payroll estimation accuracy and approval workflows.

---

## Phase 4: Events Module Audit, Soft Delete Enforcement & Session Exports

**Goal:** Audit the events module end to end (routes, controllers, models), make soft delete + restore fully functional with no permanent-delete path anywhere, add session report exports (session details and session attendance as PDF/Excel following the existing attendance export pipeline), and confirm bills can be attached to sessions.

**Deliverables:**
- Audit events functionality against MODULE_ROUTES.md: route structure, middleware order (`protectedRoute` → `authorize` → `validate`), validation coverage.
- Enable the restore endpoints (workshop/session/program/participant) by removing the `underDevelopment` gate — soft delete + restore must work in production.
- Verify every delete in events is soft-only; no hard-delete code path may exist or be added.
- Add export endpoints for (a) session report and (b) session attendance, in PDF and Excel, mirroring `src/attendance/export/report.ts` → BullMQ queue → `src/worker/attendance-report.ts` worker → notification-with-download pattern; reuse the temp-file download + cleanup lifecycle from Phase 2.
- Confirm/wire bill attachment to sessions (`Session.bills` exists; ensure create/update paths validate and persist bill ids).
- Tests covering restore endpoints, export enqueue behavior, and session-bill attachment.

---

## Phase 5: Reimbursement Audit, Balance Update Validation & Bill Export

**Goal:** Audit the reimbursement module (bill lifecycle and user balance updates) for accuracy and implement bill export capabilities (PDF/Excel) mirroring the attendance export pipeline.

**Deliverables:**
- Audit bill lifecycle (creation, admin approval/rejection, settlement) and user balance update logic for correctness.
- Implement PDF and Excel export endpoints for bills, reusing the infrastructure from Phase 2 (attendance export).
- Ensure bill export respects filtering/sorting criteria.
- Tests to verify bill lifecycle integrity, balance calculation accuracy, and export generation.

---

## Phase 6: Hard-Delete Audit — Soft Delete + Restore Everywhere

**Goal:** Audit every module for hard-delete code paths; business resources must only ever be soft-deleted (recoverable via restore), while infrastructure collections keep legitimate hard deletes.

**Deliverables:**
- Convert CalendarEvent, Bank, Holiday, Notice delete controllers to soft delete (`isDeleted: true`), each with a matching `PATCH .../restore/:id` route mirroring the events module undoDelete pattern.
- Remove the `User.findByIdAndDelete` backdoor branch in `userDeleteController` (already-inactive users → 404, consistent with events convention).
- Add `isDeleted: false` filters to every read/update path of converted models (calendar aggregates, holiday/notice/bank queries).
- Keep PushSubscription hard deletes (device infra cleanup — user-approved).
- Tests: delete→restore round-trips per resource; deleted records invisible on reads.

---

## Phase 7: Soft-Delete-Aware GETs, Search Consistency & OpenAPI

**Goal:** Every GET respects soft delete while preserving current behavior; keyword search is consistent and safe across modules (especially events + reimbursement); OpenAPI documents restore endpoints and GET query params with proper input/output schemas.

**Deliverables:**
- Reimbursement bill search: add `isDeleted` filter (deleted bills currently leak), escape regex input, IST date boundaries via shared date helpers.
- Events search: filter `isDeleted: false` in the Program/Workshop sub-queries inside workshop/session keyword search (deleted parents currently match children).
- Shared escaped-regex/keyword-filter helper reused by events + reimbursement search.
- GET consistency: list endpoints accept validated `isDeleted` boolean query param (default false) — align reimbursement with events convention.
- Hot-path indexes at model definition for keyword/list queries.
- OpenAPI: document all restore endpoints from Phase 6 + `isDeleted` query params on GETs with request/output schemas; run `pnpm docs:lint`.

---

## Phase 8: Production Compose Support & Frontend Handbook

**Goal:** Verify and close gaps so the backend runs under the production architecture — nginx reverse proxy serving a Next.js frontend with `/api` forwarded to the backend, backend + worker as services in one docker-compose. Produce a frontend handbook documenting the backend structure for the frontend agent.

**Deliverables:**
- Versioned reference compose (`deploy/docker-compose.yml`: nginx, frontend, backend, worker) + `deploy/nginx.conf` (`/api` → backend:4000, `/docs`, `/temp` statics, upload body-size limit).
- Fix deploy workflow staleness: `docker compose up -d --build backend worker` (worker currently never rebuilt).
- `.env.example`: document BASE_URL (public URL used in mail links), CORS_ORIGINS, worker needs.
- `FRONTEND-HANDBOOK.md`: module map, auth cookie flow, response envelope, pagination meta, RBAC matrix, soft-delete/restore conventions, notification action objects, IST date semantics, OpenAPI pointer.

**Audit verdict (research):** REDIS_URL-derived connections ✓, trust-proxy ✓, chromium-in-image ✓, health endpoint ✓, start/start:worker scripts ✓. Gaps are compose/deploy-side only.


