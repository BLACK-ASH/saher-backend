# Fix plan — `src/user`

Source: `MODULE_ANALYSIS.md` §15. Self-service profile; smallest module.

## Findings status at HEAD (2026-08-22)

| Sev | Location                                                              | Status             |
| --- | --------------------------------------------------------------------- | ------------------ |
| LOW | `user.controller.ts:13` — `findByIdAndUpdate` without `runValidators` | ⚠️ verify then fix |
| NIT | double-guard on `req.user?.id`                                        | ⚠️                 |

## Fixes

1. Add `{ runValidators: true, new: true }` (and `context: 'query'`) to the profile update.
2. Ensure the update schema is explicit (not `.partial()` of full user schema) so users
   cannot self-modify `role`, `emailVerified`, or other privileged fields — same
   mass-assignment class as the admin bug (audit only rated this module LOW, but verify
   what fields the route accepts).
3. Single accessor for `req.user.id` (it's guaranteed by `protectedRoute`).

## Verification

- Update with invalid value violating a schema validator → 400/422 not silent success.
- POST body containing `role:"admin"` → ignored/rejected.
