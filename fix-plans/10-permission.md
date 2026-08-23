# Fix plan — `src/permission`

Source: `MODULE_ANALYSIS.md` §10. **Wave-1 blocker**: admin/events read guards are
no-ops until this module is fixed. Do this FIRST in the authorization overhaul.

## Findings status at HEAD (2026-08-22)

| Sev  | Location                                                                                           | Status                                   |
| ---- | -------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| CRIT | `authorize.ts:22-24` — every `read` action unconditionally passes                                  | ❌ **verified open** (read file at HEAD) |
| MED  | `authorize.ts:14-19,31-36` — authz failures returned as `ApiResponse.success(…, 401/403)`          | ❌ **verified open**                     |
| LOW  | `role-permission.ts:4` — `Record<string, Set<string>>` not exhaustive; new roles silently all-deny | ⚠️                                       |

## Fixes in order

1. **Check reads against ROLE_PERMISSIONS** (CRIT): delete the unconditional
   `if (action === 'read') next();` branch; run reads through the same
   `createPermission(action, resource)` check as everything else. Then populate
   ROLE_PERMISSIONS with the `resource:read` entries each role genuinely needs — expect a
   round of product decisions (e.g. can `user` role read any admin resource? default: no).
2. **Error contract** (repo rule #3): replace both `ApiResponse.success(res, …, 401/403)`
   blocks with `throw new ApiError(401/403, …)` (or `return next(ApiError)`).
3. **Exhaustive typing**: `Record<UserRole, Set<string>>` so adding a role to
   `user.model.ts` without permissions becomes a compile error instead of silent lockout.
4. After landing: re-run the two-role curl matrix from `01-admin.md` and `06-events.md`.

## Verification

- Role `user` + `authorize('read','bank')` route → 403.
- Role `manager` with documented read grants → allowed where intended.
- Unauthorized call returns error envelope (`success:false`), never success envelope.
- Add dummy role to enum → typecheck fails until ROLE_PERMISSIONS updated.
