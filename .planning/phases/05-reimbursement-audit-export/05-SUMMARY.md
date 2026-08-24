# Phase 05 SUMMARY — Reimbursement Audit, Balance Integrity & Bill Export

## Audit findings (Wave 1)
1. **Reject path returned `message: undefined`** — handle-bill only set a message for accept/already-rejected; rejecting pending/on-hold bills produced an envelope without a message. Fixed: explicit transition guard (`400 Invalid status transition` for garbage statuses) + messages for reject/on-hold.
2. **Balance enquiry ignored settlements** — Total was static per-bill math and never netted money actually paid out. Fixed: new `SettledUse` (Σ Settlement.amount where status='settle') netted into `Total`, label-string bug (leading space / number+text concat) cleaned into `"N Amount to Received|Paid"`. Empty state no longer returns `data: []` (was shape-inconsistent); emits zeroed object with `Empty:true`.
3. Money-model rework (full double-entry) deliberately deferred — grey area, flagged not silently skipped.

## Bill export (Wave 2) — mirrors session/attendance export pattern
- `src/reimbursement/export/bill-report.ts`: `pdf-bill-report` BullMQ queue + controller. Zod-validated filters (user ObjectId, status enum, from/to IST day windows, format pdf|xlsx). Redis dedupe key; empty-match short-circuit returns before enqueueing.
- `src/reimbursement/export/bill-excel.service.ts` — ExcelJS sheet with totals row.
- `src/worker/bill-report.ts` — Puppeteer PDF / ExcelJS XLSX into shared `public/temp`, notification with download action pointing at the existing generic `/api/attendance/download/:file`. Registered in `src/worker/index.ts`.
- Route `GET /api/reimbursement/export/report` behind `authorize('read','preReimbursement')`, registered before `/:billId` shadows; OpenAPI documented.

## Verification
typecheck 0 · lint 0 errors · docs:lint valid · full suite **257/257** · new files spell-clean.
