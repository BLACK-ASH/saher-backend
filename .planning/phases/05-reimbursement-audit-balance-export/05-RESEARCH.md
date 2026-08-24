# Phase 05: Research - Reimbursement Audit, Balance Integrity & Bill Export

**Goal:** Research reimbursement module functionality, bill lifecycle, balance calculation integrity, and export infrastructure requirements.

## 1. Audit Scope
*   **Bill Lifecycle:** Map all routes (`/bill`, `/handle`, `/settlement`) to `Bill` model status transitions (`pending`, `accept`, `reject`, `on-hold`).
*   **Balance Integrity:** Analyze how `Bill` approval/rejection and `Settlement` creation impact `User` balance (or wherever balance state is held).
*   **Export Pipeline:** Evaluate feasibility of mirroring `attendance/export` (BullMQ + Puppeteer/ExcelJS) for `reimbursement/get-bill` endpoints.

## 2. Technical Findings
*   **Bill Lifecycle:** Handled primarily in `user.controller.ts` (creation) and `settlement/handle-bill.controller.ts` (settlement/handling).
*   **Balance Integrity:** `user-balance-enquiry.controller.ts` needs analysis to ensure it aggregates accurately. Potential race conditions during rapid bill creation/approval.
*   **Export Infrastructure:** The codebase has a solid foundation in `src/attendance/export/`. Reusing this infra for bills is straightforward; bill export queue needs to be created (`pdf-bill-report`).

## 3. Validation Strategy
*   Must verify user balance balance before and after bill settlement.
*   Must verify export files contain correct data and reflect correct user/date range.
*   Must ensure cleanup cron works for bill exports too (or update existing cleanup).
