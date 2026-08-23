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

