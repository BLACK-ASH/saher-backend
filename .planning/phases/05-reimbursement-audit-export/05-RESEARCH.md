# Phase 05: Reimbursement Module Audit & Bill Export Research

**Gathered:** 2026-08-24
**Status:** Ready for planning
**Source:** Manual Codebase Analysis

<domain>
## Phase Boundary

This phase focuses on:
1. **Reimbursement Audit:** Verify bill lifecycle (creation, approval, rejection, settlement) and balance calculation logic.
2. **Bill Export:** Add PDF and Excel export for bills, leveraging the established `attendance/export` pipeline.
3. **Balance Integrity:** Ensure balance enquiry correctly reflects advances and settlements.
</domain>

<decisions>
## Implementation Decisions

### Reimbursement
- Audit status transitions in `bill.user.controller.ts` and `admin.controller.ts`.
- Verify balance math in `user-balance-enquiry.controller.ts` against `settlement` and `bill` models.
- Create `src/reimbursement/export/bill-report.ts` and `src/reimbursement/export/bill-excel.service.ts`.
- Reuse `src/worker/attendance-report.ts` pattern for a `pdf-bill-report` worker.
- Add BullMQ queue for `pdf-bill-report`.
</decisions>

<canonical_refs>
## Canonical References

### Reimbursement
- `src/reimbursement/reimbursement.routes.ts` — Route definitions.
- `src/reimbursement/bill/user.controller.ts` — User bill logic.
- `src/reimbursement/settlement/handle-bill.controller.ts` — Bill handling/settlement.
- `src/reimbursement/balance-enquiry/user-balance-enquiry.controller.ts` — Balance calculation.

### Export Patterns
- `src/attendance/export/report.ts` — Queue/controller pattern.
- `src/worker/attendance-report.ts` — Worker pattern.
</canonical_refs>
