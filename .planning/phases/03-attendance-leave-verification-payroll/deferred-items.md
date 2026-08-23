# Deferred Items — Phase 03

Out-of-scope discoveries logged during 03-01 execution (pre-existing, not caused by this plan):

1. **Stale PUT documentation** — `openapi/paths/payroll/id.yaml` documents a `status` field in the PUT `/payroll/{id}` request body, but the zod schema (`createPayrollSchema`) only accepts `mode` and `paidSalary`; status in the body has always been stripped/ignored. After 03-01's approval guard, that doc is further misleading.
2. **Wrong response field name** — `openapi/components/schemas/payroll-response.yaml` documents `netSalary`, but the Payroll model/schema expose `expectedSalary`.
3. **Pre-existing dirty working tree at execution start** — `graphify-out/*` modifications and a deletion of `MODULE_ANALYSIS.md` were present before plan execution began; left untouched/uncommitted for whoever owns that session's work. Graph was refreshed on disk via `graphify update .` per end-of-phase rule.
