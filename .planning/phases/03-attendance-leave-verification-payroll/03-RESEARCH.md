# Phase 03: Attendance-Leave-Verification-Payroll - Research

**Researched:** 2026-08-23
**Domain:** Attendance, Leave, and Payroll integration
**Confidence:** HIGH

## Summary

This phase involves creating an integrity layer between existing Attendance, Leave, and Payroll modules. The core objective is to ensure that payroll calculations (currently triggered by `payroll-management.cron.ts`) accurately account for validated attendance and approved leave data, and to introduce an admin approval workflow for payroll records before they can be marked as 'paid'.

The current system calculates payroll automatically via a cron job. This cron job uses basic attendance status ('on-leave', 'week-off', 'half-day') but lacks explicit verification against approved leave applications. The payroll system allows updating payment status ('partially-paid' to 'paid'), but lacks a formal 'review/approval' state.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Data Verification | Backend | — | Ensuring attendance/leave consistency for payroll happens in business logic. |
| Payroll Calculation | Backend Server | — | Scheduled cron logic runs on the backend server. |
| Admin Approval | API / Backend | — | Workflow state changes require DB updates via authenticated API. |

## Standard Stack

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Mongoose | 9.x | ODM | Core database interaction |
| BullMQ | — | Background Jobs | Used for cron/async tasks |
| Zod | 4.x | Validation | Schema validation for all inputs |

## Architecture Patterns

### Pattern: Approval Workflow
**What:** Introduce a `status` field transition for Payroll records: `calculated` (default) -> `approved` -> `paid` / `partially-paid`.
**Implementation:**
1. Update `src/database/payroll.model.ts` to add `status: 'approved'` to `salaryStatus`.
2. Update `payroll-management.cron.ts` to default new payroll records to `calculated`.
3. Add a new `approvePayrollController` in `src/payroll/` to transition `calculated` -> `approved`.
4. Restrict `update-payroll.controller.ts` (the payment logic) to only allow records with status `approved`.

### Recommended Project Structure
Updates in `src/payroll/`:
```
src/payroll/
├── ...
└── approve-payroll.controller.ts  # New controller
```

## Anti-Patterns to Avoid
- **Implicit payroll approval:** Payroll should never move to 'paid' without an explicit 'approved' state.
- **Trusting attendance blindly:** Payroll calculation must verify leave against `Leave` model (status 'approved') rather than just `Attendance` model (which can be manipulated).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cron Scheduling | Custom intervals | BullMQ | Reliable job management |
| Authorization | Custom logic | `authorize()` | Existing repo pattern |
| Schema Validation | Hand-rolled checks | `zod` | Consistent with codebase |

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Payroll collection schema | Schema update (status enum) |
| Live service config | Cron job logic | Patch `payroll-management.cron.ts` |
| OS-registered state | None | N/A |
| Secrets/env vars | None | N/A |
| Build artifacts | None | N/A |

## Common Pitfalls

### Pitfall: Payroll-Attendance Mismatch
**What goes wrong:** Payroll calculated on inaccurate attendance data.
**Why it happens:** Attendance might be corrected *after* payroll is generated.
**How to avoid:**
1. Payroll generation should explicitly fetch approved leaves (`Leave` collection with `status: 'approved'`) and cross-reference with `Attendance` status.
2. Provide an endpoint for payroll recalculation for a specific month if attendance/leave data changes.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `Leave` application status `approved` is sufficient for payroll deduction. | Common Pitfalls | Might miss specific leave types that are unpaid. |

## Open Questions

1. **How to handle payroll recalculation?** If an employee's attendance is corrected after payroll is generated, should it be automatically updated or require manual intervention?
   - *Recommendation:* Implement a manual recalculation trigger per employee/month.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V4 Access Control | Yes | `authorize('update', 'payroll')` |

### Known Threat Patterns
- **IDOR:** Ensure payroll updates are restricted to authorized admins.
