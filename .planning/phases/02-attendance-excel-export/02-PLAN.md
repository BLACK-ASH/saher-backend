---
wave: 1
depends_on: []
files_modified:
  - src/attendance/export/report.ts
  - src/attendance/export/excel.service.ts
  - src/worker/attendance-report.ts
autonomous: true
---

# Plan: Attendance Export - Excel & Cleanup

Extend attendance reports to support Excel (`.xlsx`) and implement a 24-hour retention policy for generated reports.

## Tasks

### [T1] Implement Excel Service
- **Read First:** `src/attendance/export/report.ts`
- **Action:**
  - Create `src/attendance/export/excel.service.ts` to generate Excel reports using `exceljs`.
  - Reuse data extraction logic from `report.ts` (PDF service).
- **Acceptance Criteria:**
  - Generates valid `.xlsx` files with correct column headers and data formatting.

### [T2] Update Export Controller/Worker
- **Read First:** `src/attendance/export/report.ts`, `src/worker/attendance-report.ts`
- **Action:**
  - Update `report.ts` and `attendance-report.ts` to handle `format=xlsx`.
  - Ensure exported files are saved to `public/temp/`.
- **Acceptance Criteria:**
  - Request with `format=xlsx` triggers Excel export.

### [T3] Implement Cleanup Job
- **Read First:** `src/worker/index.ts`
- **Action:**
  - Implement BullMQ repeatable job to sweep `public/temp/` for files older than 24 hours.
- **Acceptance Criteria:**
  - Files in `public/temp/` older than 24 hours are deleted.

### [T4] Tests
- **Action:**
  - Add tests for Excel generation and cleanup job.
- **Acceptance Criteria:**
  - Tests pass, no regressions.
