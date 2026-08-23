# Fix plan — `src/events`

Source: `MODULE_ANALYSIS.md` §6. Module is under development — cheapest time to fix.

## Findings status at HEAD (2026-08-22)

Graphify confirms all listed controllers/routes exist as cited
(`events.routes.ts`, `session-attendance.controller.ts`, `workshop-participant.controller.ts`,
`participant.controller.ts`, `session.controller.ts`).

| Sev  | Location                                                                                                                                        | Status             |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| HIGH | `events.routes.ts` — zero ownership/role checks on mutations                                                                                    | ⚠️ verify then fix |
| HIGH | `session-attendance.controller.ts:60-61` — wholesale `participants = success` replacement                                                       | ⚠️                 |
| HIGH | `addParticipantToWorkshop` skips validate(); unchecked participantId                                                                            | ⚠️                 |
| MED  | PUT route ⇒ phantom `req.params.workshopId`; deleteSession misses calendar cache; session date string → NaN cache keys; 404-in-success-envelope | ⚠️                 |

## Fixes in order

1. **Authorization**: every workshop/session/participant mutation gets
   `authorize('write'|'update'|'delete', '<resource>')`. Depends on the permission read-fix
   only if you also guard reads — do reads too, scoped.
2. **Attendance marking atomicity**: switch to `$addToSet: { participants: ids }`
   (sibling controller already does this) so marking group B preserves group A and concurrent
   writes merge instead of clobbering.
3. **Input validation**: add `validate()` to the workshop-participant route; zod
   objectId for participant/workshop/session ids + existence check before write.
4. **Session schema**: `date: z.coerce.date().refine(isFinite)`; derive cache month keys from
   the parsed Date, guarding NaN.
5. **Cache pairing** (repo rule #6): deleteSession must invalidate the same calendar keys
   addSession populates (start+end months).
6. **Contract fixes**: replace success-wrapped 404 with `throw new ApiError(404, …)`;
   fix or drop the phantom `:workshopId` param on PUT `/sessions/:id`.
7. Cleanup: remove double-parse of validated body in participant controller; paginate or
   delete unrouted `readAllParticipant`.

## Verification

- As role `user`: DELETE any workshop/session → 403.
- Mark attendance for users [a,b], then for [c] → final participants ⊇ {a,b,c}.
- POST garbage sessionId → 400 zod, nothing persisted.
- Delete a session → calendar GET for that month reflects it immediately.
