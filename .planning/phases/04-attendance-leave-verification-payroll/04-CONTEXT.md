# Phase 04: Session Export, Reporting & Attendance Refinement

**Gathered:** 2026-08-24
**Status:** Ready for planning
**Source:** User Requirement Analysis

<domain>
## Phase Boundary

This phase addresses:
1. **Attendance Audit:** Verify soft-delete/restore for programs/workshops/sessions/participants, and remove `underDevelopment` guard for RESTORE operations.
2. **Permanent Delete Mitigation:** Audit to ensure no permanent delete endpoints exist or are accessible.
3. **Session Reporting:** Implement session-specific PDF/Excel export reports mirroring the existing attendance export module pattern (BullMQ/Puppeteer).
4. **Attendance Reporting:** Implement attendance report generation for individual sessions (PDF/Excel).
5. **Bill Attachment Verification:** Verify existing session bill attachment functionality is fully integrated.
</domain>

<decisions>
## Implementation Decisions

### Events Module
- Remove `underDevelopment` middleware from RESTORE endpoints.
- Ensure only soft-delete is available.
- Create `src/events/export` module.
- Create BullMQ worker for session reports.
- Implement PDF/Excel report generator based on attendance report template.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Core Attendance Export
- `src/attendance/export/report.ts` — Existing export queue/controller.
- `src/worker/attendance-report.ts` — Existing export worker.
- `src/worker/attendance/template/attendance-pdf.ts` — PDF template pattern.
- `src/attendance/export/excel.service.ts` — Excel generation pattern.

### Events
- `src/events/events.routes.ts` — Route definitions.
- `src/events/session/session.controller.ts` — Session logic.
</canonical_refs>

<specifics>
## Specific Ideas
- Use `src/worker/` and `src/libs/utils/` to maintain parity.
</specifics>

<deferred>
## Deferred Ideas
None.
</deferred>
---
*Phase: 04-session-export-and-attendance-refinement*
*Context gathered: 2026-08-24 via Manual Analysis*
