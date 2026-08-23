# Test Plan & Coverage Tracker — saher-backend

## Approach
- **Framework**: `vitest` + `supertest` + `mongodb-memory-server`
- **Target**: 25+ test cases per route/module.
- **Workflow**: Module-wise plan → implement tests → reconcile OpenAPI → verify → checkpoint.
- **Documentation**: `fix-plans/TEST-REPORT.md` (Tracks coverage, gaps, and OpenAPI sync status).

## Module Priority & Plan
1. `auth` & `permission` (Core)
2. `attendance` & `events` (Logic)
3. `admin` & `user` (RBAC)
4. `notification` & `mail` (Async)
5. `calendar` & `reimbursement` (Misc)

## Current Status (Checkpoint 0)
- [ ] Vitest setup
- [ ] Test helper setup
- [ ] `auth` module coverage
- [ ] `permission` module coverage
...
