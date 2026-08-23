# saher-backend — Module-wise Fix Plans

Derived from `MODULE_ANALYSIS.md` (2026-08-21 audit) and re-verified against current HEAD via
graphify queries + direct source checks. One file per module.

> **Line numbers drift.** Every plan below was re-checked against HEAD on 2026-08-22;
> findings already fixed are marked ✅ so nobody re-does them.

## Files

| File                                         | Module                                | CRIT open         |
| -------------------------------------------- | ------------------------------------- | ----------------- |
| [00-cross-cutting.md](./00-cross-cutting.md) | Env/secrets, CORS, ops readiness      | 2                 |
| [01-admin.md](./01-admin.md)                 | `src/admin`                           | 2                 |
| [02-attendance.md](./02-attendance.md)       | `src/attendance` (+ worker interplay) | 2                 |
| [03-auth.md](./03-auth.md)                   | `src/auth`                            | 1                 |
| [04-calendar.md](./04-calendar.md)           | `src/calendar`                        | 0 (CRIT fixed ✅) |
| [05-database.md](./05-database.md)           | `src/database`                        | 0                 |
| [06-events.md](./06-events.md)               | `src/events`                          | 0                 |
| [07-libs.md](./07-libs.md)                   | `src/libs`                            | 0                 |
| [08-mail.md](./08-mail.md)                   | `src/mail`                            | 0 (CRIT fixed ✅) |
| [09-notification.md](./09-notification.md)   | `src/notification`                    | 1                 |
| [10-permission.md](./10-permission.md)       | `src/permission`                      | 1                 |
| [11-public.md](./11-public.md)               | `src/public` + cron triggers          | 1                 |
| [12-seeds.md](./12-seeds.md)                 | `src/seeds`                           | 1                 |
| [13-types.md](./13-types.md)                 | `src/types`                           | 0                 |
| [14-upload.md](./14-upload.md)               | `src/upload`                          | 0                 |
| [15-user.md](./15-user.md)                   | `src/user`                            | 0                 |
| [16-worker.md](./16-worker.md)               | `src/worker`                          | 0                 |
| [17-entrypoints.md](./17-entrypoints.md)     | `src/index.ts`, `src/worker/index.ts` | 0                 |

## Fix order (dependency-aware waves)

```
Wave 0 — Secrets & blast-radius (no code dependencies)
  00-cross-cutting  → rotate Resend key, purge git history, .env.example, boot env validation
  12-seeds          → random admin password
  11-public         → cron secret to header + timingSafeEqual

Wave 1 — Authorization foundation (must land together)
  10-permission     → fix read-bypass FIRST (routes guarded with authorize('read') are no-ops until this lands)
  01-admin          → add missing authorize() to 5 routes + strip role/password from update schema
  06-events         → apply authorize() to all mutation routes

Wave 2 — Identity & sessions
  03-auth           → logout revocation, session↔JWT binding, emailVerified gate, CORS sameSite (with 17)

Wave 3 — Data integrity
  02-attendance     → IDOR filters, self-approval denial, IST boundaries, races
  09-notification   → push hijack + deleteMany field bug
  05-database       → require: typo, indexes, projections (needed by 01's KYC-leak fix)

Wave 4 — Hygiene & resilience
  04-calendar · 07-libs · 08-mail · 14-upload · 15-user · 16-worker · 17-entrypoints · 13-types
```

## Status legend used in every plan

- ❌ **OPEN** — verified still present at HEAD (2026-08-22)
- ✅ **FIXED** — verified resolved at HEAD; keep as regression check only
- ⚠️ **UNVERIFIED** — cited by audit, not re-checked here; verify before fixing

## Gap: unaudited modules

`MODULE_ANALYSIS.md` covers 16 modules, but `src/` also contains **`leave`, `notice`,
`payroll`, `reimbursement`** (mounted in `index.ts:78,81,88,91`) with no audit section.
Before touching them, run a fresh pass (they may share the same bug classes: raw-body
updates, missing ownership scoping, cache invalidation gaps).

## Per-task workflow (every fix)

1. Read the plan file for the module; cite the finding you're fixing.
2. Follow repo conventions: zod `validate()`, `ApiResponse.success` / thrown `ApiError`,
   cache invalidation paired with every cached read, IST helpers for date math.
3. Verify: `pnpm typecheck && pnpm lint`. No test suite exists — verify behavior manually
   (curl with two roles) for authz/scoping changes.
4. Run `graphify update .` after code changes.
