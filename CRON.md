# Cron & Scheduled Jobs Reference

This file documents every scheduled/recurring job in the SAHER backend and how it is
triggered. It is a **reference** — it lists existing jobs so the whole cron landscape
lives in one place. Two mechanisms exist: **HTTP-triggered** jobs (an external cron
pings a route) and **BullMQ self-scheduled** jobs (registered in-process).

## Trigger mechanisms

| Mechanism | How it fires | Guard |
|-----------|--------------|-------|
| External cron → HTTP route | A scheduler (cron system, k8s CronJob, GitHub Actions, etc.) POSTs the route | `requireCronSecret` (Bearer `CRON_SECRET`) or role guard |
| BullMQ `upsertJobScheduler` | Registered in-process at boot; BullMQ repeats on a fixed interval | N/A (internal worker) |
| BullMQ on-demand queues | Report generation queues — NOT periodic; fired per-request | N/A (worker consumes added jobs) |

The public cron routes are the modern, secure path. The legacy `/attendance/cron/...` routes
carry the secret in the URL path (logged / visible in history) and should be retired once
anything external points at the public routes.

---

## 1. Create daily attendance

Generates absent/on-leave `Attendance` rows for every user for the current IST day, skipping
users who already have a record (uploads only missing ones). Users on approved leave get
`status: "on-leave"`; everyone else missing a record gets `status: "absent"`. Clears the
`today` cache group afterwards.

- **Purpose:** seed attendance for the day so check-in/out has a row to fill.
- **Mechanism:** external cron → HTTP POST.
- **Public route:** `POST /api/cron/create-attendance` (`src/public/public.routes.ts`) — `requireCronSecret`
- **Legacy route:** `POST /api/attendance/cron/create/:pass` (`src/attendance/attendance.route.ts` — path secret)
- **Handler:** `createAttendanceCron` — `src/attendance/cron-job/create-attendance.cron.ts`
- **Suggested cadence:** once daily, ~just after IST midnight (before shift start).
- **Notes:** uses `Attendance.insertMany(..., { ordered:false })` and swallows only E11000
  duplicate-key errors so racing cron triggers don't abort the batch (`ponytail` guard in source).

## 2. Auto checkout

Finds today's attendance rows that have an `inTime` but no `outTime`, and finalizes them to the
employee's shift end time (IST-aware). Skips users without an account/shift, and never writes an
`outTime` in the future. Computes `workHours` + `status`, sets `autoCheckout: true`, then
bulk-writes in chunks and clears the `today` cache group.

- **Purpose:** backstop for employees who forget to check out — no dangling open records.
- **Mechanism:** external cron → HTTP POST.
- **Public route:** `POST /api/cron/auto-checkout` (`src/public/public.routes.ts`) — `requireCronSecret`
- **Legacy route:** `POST /api/attendance/cron/auto-checkout/:pass` (`src/attendance/attendance.route.ts` — path secret)
- **Handler:** `autoCheckoutCron` — `src/attendance/cron-job/auto-checkout-attendance.cron.ts`
- **Suggested cadence:** once daily, in the evening / after last shift ends (e.g. ~23:30 IST).
- **Notes:** overtime for a day is finalized by the check-out flow (see
  `src/attendance/mark/check-out.controller.ts` / `overtime.controller.ts`), not by this cron.

## 3. Payroll generation

Computes and inserts this month's `Payroll` records for all accounts (one per employee).
Skips employees who already have a payroll for the current month. Deducts leave and half-day
pay from the base salary per working days; deductions are only counted when backed by approved
leave applications.

- **Purpose:** auto-generate month-end payroll.
- **Mechanism:** external cron → HTTP POST.
- **Route:** `POST /api/payroll/cron` (`src/payroll/payroll.routes.ts`) — `authorize('write','payroll')`
- **Handler:** `payrollLeaveMangement` — `src/payroll/payroll-management.cron.ts`
- **Suggested cadence:** once at the start of each month.

## 4. Temp file cleanup

Sweeps `public/temp` and deletes files older than 24h. Effective retention is ~24h because the
sweep runs hourly.

- **Purpose:** disk hygiene for temp/upload staging files.
- **Mechanism:** BullMQ self-scheduled (`upsertJobScheduler('temp-cleanup-sweep', { every: 60*60*1000 })`)
  registered in-process at boot.
- **Handler/reg:** `src/worker/cleanup.ts` (`cleanupTempFiles` + `cleanupWorker`)
- **Cadence:** every 1 hour (24h retention). Non-blocking — won't crash worker boot if Redis is briefy unavailable.

---

## On-demand queues (NOT periodic)

These are BullMQ queues consumed by background workers. They fire per-request (report
export), not on a schedule — listed here so the full worker landscape is in one place:

| Queue | Report | Producer | Worker |
|-------|--------|----------|--------|
| `pdf-attendance-report` | Attendance export | `src/attendance/export/report.ts:145` | `src/worker/attendance-report.ts` |
| `pdf-bill-report` | Bill/reimbursement export | `src/reimbursement/export/bill-report.ts:88` | `src/worker/bill-report.ts` |
| `pdf-session-report` | Session/events export | `src/events/export/session-report.ts:112` | `src/worker/session-report.ts` |

---

## Running the crons

The attendance and payroll crons are **HTTP-triggered** — you must point an external scheduler
at them, e.g. a cron line:

```cron
# IST 00:15 daily — seed attendance
15 0 * * *  curl -sS -X POST https://<host>/api/cron/create-attendance -H "Authorization: Bearer $CRON_SECRET"

# IST 23:30 daily — auto checkout
30 23 * * *  curl -sS -X POST https://<host>/api/cron/auto-checkout -H "Authorization: Bearer $CRON_SECRET"

# 1st of month 01:00 — payroll
0 1 1 * *    curl -sS -X POST https://<host>/api/payroll/cron -H "Authorization: Bearer <token>"
```

Notes:

- The public attendance cron routes require `CRON_SECRET` in `Authorization: Bearer ...` (or
  `x-cron-secret`). Never put the secret in the URL path.
- The payroll cron requires a user token with the `write:payroll` permission (it uses the
  normal `authorize` guard), not `CRON_SECRET`.
- The temp-cleanup and report workers need the BullMQ worker process running and a reachable
  Redis (see `src/libs/redis/`).
