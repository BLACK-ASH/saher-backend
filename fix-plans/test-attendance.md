# Test Plan — attendance module

## Surface (src/attendance)
- Marking: check-in, check-out, overtime check-in, week-off claim
- Retrieve: /me, /today (admin/manager), /user/:id, /retrieve/:id, /record/:id, /retrieve
- Admin override: PATCH / (reject-mark — set status/isLate for a user+date)
- Corrections: POST /correction, PUT /correction/:id (approve/reject/on-hold, transactional), GET lists
- Holidays: full CRUD + duplicate guard + calendar cache invalidation
- Crons: /cron/create (rows for all users, honors leave), /cron/auto-checkout

## Seeding helpers
- `createFullAccount()` in `tests/helpers/account.ts` — user + Media×4 + Bank + Account
  (needed because mark/approve flows call getAccountByUser which zod-parses the populated doc)
- Attendance rows seeded directly with `date = standardDateString(new Date())`

## Determinism notes
- IST shift math depends on wall clock → never assert exact isLate/workHours on live
  check-in/out; assert DB effects (inTime/outTime set, status present) and use admin
  PATCH for exact-value assertions.
- Cache assertions via fake redis keys (`saher:attendance:today:*`).

## Cases (~40)
Retrieve 1–12, Mark 13–18, Overtime 19–20, Week-off 21–24, Reject-mark 25–27,
Cron 28–29, Holiday 30–35, Correction 36–42.

## Known-risk endpoints (may expose latent bugs)
- List endpoints parse populated users against userSchemaFinal → fixed by adding
  model-matching defaults to emailVerified/isActive/isBanned.
