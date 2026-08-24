# Phase 06: Hard-Delete Audit — Context

**Gathered:** 2026-08-24
**Status:** Ready for planning
**Source:** User directive (plan-phase args)

<domain>
## Phase Boundary

All modules/resources audited for hard delete. Business resources get soft delete + restore only; no permanent-delete path may remain. Push subscriptions are exempt (device infra, hard delete approved by user).

</domain>

<decisions>
## Implementation Decisions

### Converted to soft delete + restore (locked)
- CalendarEvent — `calendar/calender.controller.ts` `deleteCalendarEventController`
- Bank — `admin/bank/controller.ts` `deleteBankDetailController`
- Holiday — `attendance/holiday/holiday.controller.ts` delete controller
- Notice — `notice/notice.controller.ts` delete controller
- User — remove `User.findByIdAndDelete` branch in `userDeleteController`; repeat delete of inactive user → 404 'User Not Found.'

### Kept as hard delete (locked)
- PushSubscription (`webpush.controller.ts:94`, `push-notification.ts:67`) — device endpoint cleanup, not business data.

### the agent's Discretion
- Schema shape of `isDeleted` field: copy `workshop.model.ts` definition verbatim.
- Restore route paths/mounting follow each module's existing router conventions.
- Cache invalidation in restore endpoints mirrors each module's existing writer invalidation keys.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Soft-delete reference pattern
- `src/events/workshop/workshop.controller.ts` — undoDelete + delete guard convention (404 when already deleted)
- `src/database/workshop.model.ts` — isDeleted schema shape
- `src/events/events.routes.ts` — restore route mounting pattern

### Files to convert
- `src/calendar/calender.controller.ts`, `src/calendar/calendar.routes.ts`, `src/libs/utils/calendar.ts`
- `src/admin/bank/controller.ts`, `src/admin/_services/bank.ts`
- `src/attendance/holiday/holiday.controller.ts`
- `src/notice/notice.controller.ts`
- `src/admin/user/controller.ts`

</canonical_refs>

<deferred>
## Deferred Ideas

None.
</deferred>
