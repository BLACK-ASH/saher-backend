# Fix plan — `src/auth`

Source: `MODULE_ANALYSIS.md` §3. Coordinates with `00-cross-cutting.md` (CORS) and
`17-entrypoints.md`. Read `MODULE_ANALYSIS.md` §3 before touching — auth has the densest
bug history in the repo.

## Findings status at HEAD (2026-08-22)

| Sev  | Location                                                                                                                                        | Status                                        |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| CRIT | `refresh/refresh.controller.ts:12` sameSite:'none' + reflect-all CORS                                                                           | ❌ CORS half verified open (`index.ts:59-64`) |
| HIGH | `protected-route.ts:95-107` session.user.id not bound to JWT subject                                                                            | ⚠️ verify then fix                            |
| HIGH | login 404/403 distinction, no dummy-bcrypt; `emailVerified` never checked                                                                       | ⚠️                                            |
| HIGH | logout clears cookies only — no Redis session delete, no `saher_session_id` clear                                                               | ❌ verified open (lines 18-19)                |
| HIGH | change/forgot-password revoke no other sessions                                                                                                 | ⚠️                                            |
| MED  | refresh rotation GET-then-SET race; change-email raw body; missing zod on confirm endpoints; tokens also in JSON body; dead register.middleware | ⚠️                                            |

## Fixes in order

1. **Cookie/CORS pairing** (CRIT): with the origin allowlist from `00-cross-cutting`,
   switch prod cookies to `sameSite:'lax'` (or `'strict'`). Keep `'none'` only if a
   documented cross-site frontend requires it — then the allowlist is mandatory.
2. **Bind session to token**: in `protected-route.ts`, after loading session compare
   `session.user.id === decoded.sub`; mismatch → 401 and delete that session key.
3. **Logout revocation** (verified open): delete Redis `session:<id>`, `srem user_session:<uid>`,
   clear all three cookies incl. `saher_session_id`.
4. **Credential-reset revocation**: on change-password / forgot-password success, iterate
   `user_session:<uid>` set and purge every session except the caller's (or all — force re-login).
5. **Login hardening**: single generic 401 for unknown-user AND bad-password; add fixed work
   factor dummy bcrypt when user missing; reject unverified email with a distinct-but-safe
   message ("verify your email" is fine — it leaks no account existence beyond what
   registration already did).
6. **Refresh rotation atomicity**: Lua script or `GETDEL`-style delete-on-read with grace
   reuse so concurrent refreshes don't log clients out.
7. **Zod everywhere**: schemas for change-email (email format + uniqueness pre-check +
   send verification to new address), confirm-password endpoints, forgot-password submit.
8. **Cookies-only tokens**: stop returning access/refresh/session in JSON body (breaking —
   coordinate with frontend).
9. Cleanup: delete dead `register.middleware.ts`, remove unused `verifyRefreshToken`,
   constant-time hash compare, fire-and-forget ipapi lookup, delete verify-token on use,
   SHA-256 reset tokens.

## Verification

- Logout → `session:<id>` gone from Redis, refresh call after logout → 401.
- Change password → other device's session dies within one request.
- Steal an access token but use attacker's own session id → 401 (binding test).
- Unverified account login → rejected.
- Parallel double-refresh (Promise.all from two tabs) → both succeed or one retries cleanly.
