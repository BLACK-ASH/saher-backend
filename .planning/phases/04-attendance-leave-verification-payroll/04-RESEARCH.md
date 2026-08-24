# Phase 04: Session Export, Reporting & Attendance Refinement - Research

**Researched:** 2026-08-24
**Domain:** Session Reporting, Attendance Refinement, Soft-Delete Auditing
**Confidence:** HIGH

## Summary

This phase aims to implement session-specific reporting (PDF/Excel), audit existing soft-delete/restore mechanisms, and ensure bill attachment integrity. We will leverage the existing pattern established by `src/attendance/export/report.ts` and `src/worker/attendance-report.ts` to implement session exports, ensuring consistency across the codebase and minimal overhead.

**Primary recommendation:** Mirror the attendance report queue mechanism (`BullMQ`) and Puppeteer PDF rendering for session reports. Audit all `delete` and `restore` endpoints for sessions, workshops, and participants to ensure soft-delete consistency.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| 04.1 | Attendance Audit (Soft-delete/restore) | Analysis of `eventRouter` confirms `underDevelopment` middleware usage. |
| 04.2 | Permanent Delete Mitigation | Audit of route files required to ensure only soft-delete paths exist. |
| 04.3 | Session Reporting (PDF/Excel) | Mirroring `attendance/export` pattern using BullMQ. |
| 04.4 | Bill Attachment Verification | Verified via `Session.populate('bills')` existence. |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Export Queue | API | Worker | API handles request, Worker handles PDF/Excel processing (heavy). |
| Soft-Delete Logic | Database | API | DB schema holds `isDeleted`, API validates and updates. |
| Report Generation | Worker | Storage | Worker writes to `/public/temp`, API serves. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `bullmq` | [repo] | Queue management | Existing pattern for exports. |
| `puppeteer-core` | [repo] | PDF rendering | Existing pattern for attendance reports. |
| `exceljs` (implied) | [repo] | Excel generation | Standard for Excel reports. |

## Architecture Patterns

### Pattern 1: BullMQ Export Queue
**What:** Offload report generation (PDF/Excel) to a background worker to avoid blocking the API server.
**When to use:** Any large-scale data export.
**Example:**
```typescript
// Pattern exists in src/attendance/export/report.ts
export const attendanceReportQueue = new Queue('pdf-attendance-report', ...);
```

### Pattern 2: Soft-Delete/Restore
**What:** Use `isDeleted: boolean` field in Mongoose schema + `undoDelete` endpoints.
**When to use:** All entity deletions.
**Example:**
```typescript
// Pattern exists in src/events/session/session.controller.ts
session.isDeleted = true;
await session.save();
```

### Anti-Patterns to Avoid
- **Permanent Delete:** Avoid `Model.findOneAndDelete()` or `Model.deleteOne()`.
- **Blocking Export:** Never generate a PDF directly in the request handler; use a worker queue.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF Generation | Custom HTML-to-PDF parser | Puppeteer (`page.pdf`) | Reliability, consistency with existing reports. |
| Excel Generation | Custom CSV string builder | `exceljs` | Correctness (formatting, multiple sheets). |

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `isDeleted` flag in `Session`, `Program`, `Workshop`, `Participant` schemas. | Audit all `delete`/`restore` endpoints for consistent flag toggling. |
| Live service config | `public/temp` directory for temporary exports. | Ensure cleanup logic exists if missing. |
| OS-registered state | None — verified via codebase scan. | None. |
| Secrets/env vars | None — verified via codebase scan. | None. |
| Build artifacts | `public/temp` for generated PDFs. | None. |

## Common Pitfalls

### Pitfall 1: Redis Cache Invalidation
**What goes wrong:** Export or report data remains cached after a session update.
**Why it happens:** Incomplete invalidation in writer modules.
**How to avoid:** Explicitly invalidate cache in *every* session/attendance writer function.

### Pitfall 2: Puppeteer Page Leak
**What goes wrong:** Chromium instances remain open, causing memory leaks.
**Why it happens:** Failure to close pages in `try/finally` blocks in the worker.
**How to avoid:** Always use `finally { await page.close() }` in worker handlers.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V4 Access Control | yes | `authorize('delete', 'event')` / `authorize('update', 'event')` |

### Known Threat Patterns
- **IDOR:** Ensure `authorize()` is coupled with database queries scoping by `req.user.id` or `programId` ownership.

## Sources

### Primary (HIGH confidence)
- `src/attendance/export/report.ts` - Export queue pattern.
- `src/worker/attendance-report.ts` - Worker pattern + PDF template integration.
- `src/events/session/session.controller.ts` - Session controller + Soft-Delete implementation.
- `src/events/events.routes.ts` - Route definitions + middleware usage.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Directly observed in code.
- Architecture: HIGH - Consistent with existing attendance export module.
- Pitfalls: HIGH - Documented in `MODULE_ANALYSIS.md` (by reference).

**Research date:** 2026-08-24
**Valid until:** 2026-09-24
