# Fix plan — `src/notification`

Source: `MODULE_ANALYSIS.md` §9. Note: the 404/410 subscription cleanup in
`libs/utils/push-notification.ts` is marked ✅ correct by the audit — preserve it.

## Findings status at HEAD (2026-08-22)

| Sev  | Location                                                                                                             | Status                                      |
| ---- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| CRIT | `webpush.controller.ts:74` — `deleteMany({ userId })` but model field is `user`                                      | ❌ **verified open** (exact line confirmed) |
| HIGH | subscription upsert: raw body, endpoint-keyed, no zod, no user scoping → push-target hijack                          | ⚠️ verify then fix                          |
| MED  | per-user list cached 7d, never invalidated on create; unseen count filter diverges from list `$or`; unpaginated list | ⚠️                                          |

## Fixes in order

1. **One-line CRIT fix**: `{ userId }` → `{ user: userId }` at
   `webpush.controller.ts:74`. Verify against `database/push-subscription.ts` field name.
2. **Subscription upsert**: zod schema (endpoint URL format, keys object shape); scope
   writes with `{ user: req.user.id, endpoint }` upsert so user A can never overwrite
   user B's row; reject endpoints already bound to a different user.
3. **Cache lifecycle** (repo rule #6): either drop the 7-day TTL to something short
   or invalidate the user's list key inside notification creation paths
   (`class/notification.ts` fan-out + specific sends).
4. **Unseen count parity**: mirror the list query's `$or` (user + global + role scopes)
   in `countDocuments`.
5. Paginate main list.

## Verification

- Enable → disable push for a user → zero rows remain (`db.pushsubscriptions.countDocuments({user:id})` = 0) and no further pushes fire.
- User B posts subscription with user A's endpoint → rejected/403.
- Create a global notification → target user's cached list shows it immediately.
- Unseen badge == list items without isSeen across all scopes.
