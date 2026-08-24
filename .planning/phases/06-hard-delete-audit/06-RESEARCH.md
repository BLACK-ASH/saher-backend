# Phase 06: Research — Hard-Delete Audit

## 1. Inventory (grep `deleteOne|deleteMany|findByIdAndDelete|findOneAndDelete` over src/)

| Site | Model | Verdict |
|---|---|---|
| `calendar/calender.controller.ts` `deleteCalendarEventController` (`event.deleteOne()`) | CalendarEvent | convert |
| `admin/bank/controller.ts:91` `deleteBankDetailController` (`findByIdAndDelete`) | Bank | convert |
| `admin/user/controller.ts:108` hard-deletes already-inactive users on repeat delete | User | remove branch |
| `attendance/holiday/holiday.controller.ts:102` (`findByIdAndDelete`) | Holiday | convert |
| `notice/notice.controller.ts:60` (`findByIdAndDelete`) | Notice | convert |
| `notification/webpush.controller.ts:94`, `libs/utils/push-notification.ts:67` | PushSubscription | keep (device infra, user-approved) |

## 2. Models lacking `isDeleted`
calendar-event.model.ts, bank.model.ts, holiday.model.ts, notice.model.ts — all need the field added (copy workshop.model.ts shape). user.model.ts already has isActive/deletedAt/deletedBy.

## 3. Read paths needing `isDeleted: false` after conversion
- `src/libs/utils/calendar.ts` — `getCalendarHoliday` + `getCalendarEvents` aggregates ($match)
- `src/calendar/calender.controller.ts` — duplicate-check `findOne` (:82), edit `findByIdAndUpdate` (:113)
- `holiday.controller.ts` — dup-check find (:14), update (:46), getById (:72), getAll (:86)
- `notice.controller.ts` — edit findOneAndUpdate (:37), list find (:75)
- `admin/bank/controller.ts` — edit findByIdAndUpdate (:64); `src/admin/_services/bank.ts` findById (:17)

## 4. Restore endpoints to add
Mirror events undoDelete controllers: guard 404 when not deleted, set `isDeleted: false`. Mount in each module's router with the same middleware chain as its delete route. Bank restore must invalidate the same cache keys as delete/edit (`createKey('bank', id)` + account-holder keys).

## 5. Risks
- Calendar caches are long-lived (7776000s) — restore/delete must invalidate via existing `deleteCacheGroup('calendar')` path already present in calendar controller.
- Bank is referenced by Account; soft delete keeps FK integrity intact (this is why hard delete was dangerous).
