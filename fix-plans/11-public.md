# Fix plan — `src/public` + cron trigger security

Source: `MODULE_ANALYSIS.md` §11. These routes are mounted **before auth**
(`index.ts:79`) — treat as fully public surface.

## Findings status at HEAD (2026-08-22)

| Sev  | Location                                                      | Status                                                                                                                                                        |
| ---- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CRIT | cron triggers public, secret in URL path (`public.routes.ts`) | ❌ open (mount point verified at `index.ts:79`)                                                                                                               |
| HIGH | secret compared `!==`, passed in path (cron controllers)      | ❌ **verified open** — `create-attendance.cron.ts:16`, `auto-checkout-attendance.cron.ts:24`; note both now ALSO allow `req.user?.role === 'admin'` as bypass |
| HIGH | `.env.example:12` `CRON_SECRET=super`                         | ❌ **verified open**                                                                                                                                          |

## Fixes in order

1. **Secret transport**: move from URL path to `Authorization: Bearer <CRON_SECRET>`
   header (or `x-cron-secret`); update the external cron scheduler config in the same deploy.
2. **Constant-time compare**: `crypto.timingSafeEqual` over hashed/sha'd buffers with
   length guard; never raw `!==` on secrets.
3. **Secret strength**: enforce ≥32 random chars via boot env validation
   (`00-cross-cutting.md`); rotate current value; purge `super` from `.env.example`
   (placeholder like `change-me-32+chars`).
4. Keep the admin-role bypass only if the route also sits behind `protectedRoute`;
   currently it doesn't — either mount a second admin-authed variant or drop the bypass.
5. Consider network-level restriction for cron endpoints (compose/ingress rule) as defense
   in depth.

## Verification

- `curl /api/cron/create-attendance` (no header) → 401.
- Wrong/garbage headers → 401; correct header → 200.
- Secret never appears in access logs (header not path).
