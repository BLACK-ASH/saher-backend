---
wave: 1
depends_on: []
files_modified:
  - src/reimbursement/reimbursement.routes.ts
  - src/reimbursement/bill/user.controller.ts
  - src/reimbursement/settlement/handle-bill.controller.ts
  - src/reimbursement/balance-enquiry/user-balance-enquiry.controller.ts
autonomous: true
---

# Phase 05: Plan - Reimbursement Audit, Balance Integrity & Bill Export

**Goal:** Audit reimbursement lifecycle, fix balance update leaks, and implement bill export.

## Wave 1: Balance & Lifecycle Audit
- [ ] Audit `user-balance-enquiry.controller.ts`: Ensure it correctly sums `accepted` bills vs `settlements`.
- [ ] Verify `settlement/handle-bill.controller.ts` correctly updates bill status and logs to `AuditLog`.
- [ ] Fix any balance leaks found in audit.

## Wave 2: Bill Export Implementation
- [ ] Create `src/reimbursement/export/report.ts` (Mirror `attendance/export/report.ts`).
- [ ] Add `pdf-bill-report` queue to `bullmqConnection`.
- [ ] Create `src/worker/bill-report.ts` (Mirror `attendance-report.ts`).
- [ ] Implement `src/reimbursement/export/excel.service.ts` for bill listing exports.
- [ ] Update `src/reimbursement/reimbursement.routes.ts` with export endpoints.

## Wave 3: Verification & Cleanup
- [ ] Ensure Phase 2 cleanup worker handles files in `public/temp` regardless of module origin (standardize cleanup).
- [ ] Run tests for bill lifecycle and balance accuracy.
