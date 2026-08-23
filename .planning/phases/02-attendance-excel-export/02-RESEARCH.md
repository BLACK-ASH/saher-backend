# Phase 2: Attendance Export — Excel Format & One-Day Temporary Storage - Research

**Researched:** 2026-08-23
**Domain:** Node.js file generation (exceljs), BullMQ job scheduling/retention, Express download routes
**Confidence:** HIGH (current state fully traced; exceljs verified via Context7 + registry; cleanup design derived from code)

## Summary

The current export flow is small and fully traceable: `GET /api/attendance/export/report` (auth via mount-level `protectedRoute`) builds an IST `DateRange`, dedupes via a Redis key with **86400s TTL already matching the one-day retention goal**, enqueues a job named `pdf-attendance-report` on queue `pdf-attendance-report` with `jobId = crypto.randomUUID()`. A separate worker process fetches attendance rows (`retrieveCustomAttendace`, limit 1000), renders HTML, writes Puppeteer PDF to `public/temp/{jobId}.pdf` (cwd-relative, auto-mkdir), and pushes a notification containing the download URL `/api/attendance/download/{jobId}.pdf`. The download route streams from the same dir with a `path.basename` traversal guard. **There are no DB records for exports — files are named by jobId and the only metadata is the Redis dedup key. Files today are never cleaned up** (only the Redis dedup key expires).

Recommended approach: add `format=pdf|xlsx` query param (default pdf); generate Excel with **exceljs ^4.4.0** from the *same* `data.parsed` array the PDF template consumes (one shared data-collection step, two renderers). Cleanup = a **BullMQ repeatable job** (scheduler upserted idempotently at worker startup) running an mtime sweep of the temp dir that deletes files older than 24h. The sweep keys on **file mtime**, needs no DB tracking, no IST timezone logic (elapsed-time comparison), and self-heals every orphan class (never-downloaded, crashed jobs, missing records).

Two pre-existing defects surface directly in this phase's code paths: the Redis dedup cache key hardcodes `'pdf'` (`src/attendance/export/report.ts:81`) so Excel/PDF requests for the same user+range would collide unless made format-aware; and the cached-job re-notification reads `data.result?.downloadPath` (`report.ts:111`) which is always `undefined` because the worker returns `{type,label,url,method}`. Also flagged: `express.static(cwd/public)` (`src/app.ts:100`) serves `public/temp/*` **unauthenticated** at `/temp/<uuid>.pdf`, bypassing the protected download route.

**Primary recommendation:** exceljs + format-aware dedup key + BullMQ repeatable mtime-sweep job in the worker; keep zero new DB state.

<user_constraints>
## User Constraints (from CONTEXT.md)

No CONTEXT.md exists for this phase (no `/gsd-discuss-phase` session). No locked decisions. Per ROADMAP.md, the user suggested cron for cleanup but explicitly asked to **evaluate BullMQ repeatable/delayed jobs before adding a new cron surface** — this evaluation is done below (verdict: BullMQ repeatable wins).
</user_constraints>

## Project Constraints (from AGENTS.md)

Directives binding this phase:
- ESM `"type": "module"` — relative imports inside `.ts` must end in `.js`.
- Express 5 forwards async rejections to global error handler — no try/catch wrappers around handlers.
- Responses use `ApiResponse.success(...)` / thrown `ApiError`; custom ESLint rule autofixes raw `res.status().json()`.
- Validate inputs with zod via `validate()`; never feed raw `req.query/body` into Mongo filters.
- Every Redis-cached read needs invalidation in EVERY writer of that data.
- IST date-boundary logic: reuse `src/libs/utils/` date helpers (`DateRange`, `standardDateString`, `formatTime`); never mix server-timezone boundaries into range queries.
- Verify with `pnpm typecheck && pnpm lint`; tests run via `pnpm test` (vitest).
- **End-of-phase rule:** update `openapi/` path files + register in `openapi.yaml`, run `pnpm docs:lint`, run `graphify update .` after endpoint changes.
- Conventional commits (commitlint + husky + lint-staged); never push to main/dev without explicit permission.
- AGENTS.md claims report.ts hardcodes Redis host `redis` — **STALE**: `src/libs/redis/redis-client.ts:17-23` now derives `bullmqConnection` from `REDIS_URL` ("was hardcoded" comment). Do not re-fix.
- AGENTS.md references MODULE_ANALYSIS.md — file is now `MODULE_ROUTES.md` (no bug catalog by that name exists).

## Phase Deliverables → Research Support

| ID | Deliverable (ROADMAP.md) | Research Support |
|----|--------------------------|------------------|
| D1 | Excel (.xlsx) generation alongside Puppeteer PDF | Standard Stack: exceljs; Pattern 1: dual-format worker branch sharing `data.parsed` |
| D2 | Both formats stored as temp artifacts, 1-day retention | Current-state map (no DB records; jobId filenames; Redis TTL already 86400); Q3 storage design |
| D3 | Automatic cleanup of expired exports | Q4 mechanism comparison (BullMQ repeatable recommended); Pattern 2: mtime sweep |
| D4 | Tests covering Excel output validity + cleanup behavior | Validation Architecture section |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Export request + dedup | API / Backend | Redis | Queue producer lives in route controller (API process) |
| Report data collection | Worker | Database / Storage | Heavy query (limit 1000) must not block API event loop; already worker-side |
| Excel generation | Worker | — | Pure JS, no browser; sibling of Puppeteer renderer |
| PDF generation | Worker | — | Puppeteer/Chromium only available in Docker image |
| Temp artifact storage | Database / Storage (filesystem) | — | Shared volume between API+worker containers (existing implicit contract) |
| Authenticated download | API / Backend | — | `protectedRoute` mounted at `app.ts:90`; streams file |
| Retention cleanup | Worker | Filesystem | Runs where BullMQ lives; filesystem sweep is process-agnostic |

## Current State Map (verified, file:line refs)

### Flow: request → notification → download

1. **Route registration:** `src/attendance/attendance.route.ts:56-57`
   - `GET /export/report` → `exportReportController`
   - `GET /download/:fileName` → `downloadReportController`
   - Mounted with auth at `src/app.ts:90`: `app.use('/api/attendance', protectedRoute, attendanceRouter)` → both endpoints require JWT session.
2. **Producer:** `src/attendance/export/report.ts`
   - :13-15 `Queue('pdf-attendance-report', { connection: bullmqConnection })`
   - :18-76 query params `type` (today|week|month|year|lastDays|custom), `includeToday`, `startDate/endDate`, `days` → `DateRange.*()` (IST via Temporal, `src/libs/class/date-range.ts`). **No zod validation — raw `req.query`.**
   - :78-85 dedup key `createKey('attendance','report','pdf', userId, startStr, endStr)` — literal `'pdf'` segment
   - :86-126 cache-hit path: if job missing → delete key, fall through; if pending → "processing"; if completed → re-send notification using `data.result?.downloadPath` (**always undefined — worker returns `{type,label,url,method}`, no `downloadPath` field**)
   - :128-137 `jobId = crypto.randomUUID()`; `setCache(key, jobId, 86400)` (TTL = one day); `queue.add('pdf-attendance-report', {...dateRange, type, user}, { jobId })`
3. **Worker:** `src/worker/attendance-report.ts` (runs ONLY in `pnpm dev:worker` / `start:worker`; registered by side-effect import in `src/worker/index.ts:6`)
   - :33-37 `retrieveCustomAttendace(user, start, end, { page:1, limit:1000, sort:'desc' })` → returns `{ parsed: AttendanceResponseT[], count }` (`src/attendance/attendance.service.ts:8-43`)
   - :40-42 throws when range has zero rows
   - :44-48 `createAttendancePdfBody(data.parsed)` (`src/worker/attendance/template/attendance-pdf.ts:14` — pure function consuming `AttendanceResponseT[]`: date, inTime, outTime, workHours, status enum ['present','half-day','absent','week-off','on-leave'], isLate) → `page.setContent(html)`
   - :53 `fs.mkdirSync(tempPath, { recursive:true })` where `tempPath = process.cwd()/public/temp` (:15)
   - :56-57 `pdfPath = public/temp/{job.id}.pdf`; `downloadPath = /api/attendance/download/{job.id}.pdf`
   - :59-106 `page.pdf({ path: pdfPath, ... })` via `getBrowser()` (`src/libs/utils/browser.ts` — puppeteer-core, executablePath `/usr/bin/chromium-browser`, Docker-only)
   - :108-120 returns action `{type:'download', label:'Report', url: downloadPath, method:'GET'}` and sends `notification.specific.info([userId], title, desc, action)` (`src/libs/class/notification.ts:100-101`)
   - :125-131 `new Worker('pdf-attendance-report', handler, { connection: bullmqConnection })`
4. **Download:** `src/attendance/export/report-download.ts`
   - :8 `REPORT_DIR = process.cwd()/public/temp`
   - :13-15 `path.basename(fileName)` traversal guard
   - :17-27 stat check → `ApiError(404, 'Report not found.')`
   - :29 `res.download(filePath, safeFileName)`

### What exists for cron/scheduling today

- **HTTP cron surface:** `src/public/public.routes.ts:13-14` — unauthenticated-mount routes `POST /api/cron/create-attendance` and `/api/cron/auto-checkout` guarded by `requireCronSecret` (`src/libs/middleware/cron-secret.ts` — Bearer `CRON_SECRET`, timing-safe compare). These run in the **API server process** and depend on an **external scheduler outside the repo** (host crontab presumably) to trigger them — reliability unverifiable from git.
- Legacy pass-in-URL variants also exist at `src/attendance/attendance.route.ts:97-98` (marked "WARN: Do Not Change").
- **No BullMQ repeatable/delayed jobs anywhere yet**: only plain `queue.add` (`report.ts:131`); grep for `repeat|delay|upsertJob` across src finds nothing.

### What does NOT exist

- No Excel library installed (`package.json` verified: no exceljs/xlsx/write-excel-file).
- No DB model/records for exports; no export tests (`grep export/download tests/` → nothing).
- No cleanup of `public/temp/*` — files accumulate forever; `.gitignore` `temp/` keeps them out of git; dir doesn't even exist until first worker job creates it.
- `tests/setup.ts:24-31` mocks `../src/libs/redis/redis-client.js` (fakeRedis + dummy bullmqConnection) but does NOT mock the `bullmq` module itself — importing `report.ts` in a test constructs a real `Queue` (lazy connect; only fires on commands like `add`/`getJob`).

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| exceljs | ^4.4.0 [VERIFIED: npm registry + Context7 official README] | Write .xlsx (one worksheet, header styling, ~1000 rows) | De-facto Node xlsx writer; pure JS (no native deps, works in worker container as-is); 13.6M downloads/wk; passed slopcheck [OK] |
| bullmq (installed) | ^5.77.6 | Repeatable cleanup scheduler via `repeat: { pattern }` / `upsertJobScheduler` | Already in stack; runs in existing worker process [VERIFIED: Context7 taskforcesh/bullmq docs] |
| vitest (installed) | ^4.1.11 | Tests for Excel validity + cleanup | Existing framework, globals enabled, mongo+fakeRedis setup |

### Supporting (already installed, reused)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @js-temporal/polyfill | ^0.5.1 | (via DateRange) report ranges | Already used; do NOT need it for retention (mtime age is TZ-free) |
| zod | ^4.3.5 | validate new `format` param | Repo convention; current export route skips it — adding zod for the new param matches AGENTS.md |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| exceljs | xlsx (SheetJS on npm) | npm build frozen at 0.18.5; known prototype-pollution/ReDoS CVEs fixed only in ≥0.19.3 distributed on vendor CDN (cdn.sheetjs.com), not npm [ASSUMED — training knowledge, registry shows 0.18.5]. Avoid npm `xlsx`. |
| exceljs | write-excel-file ^4.1.1 | Lighter, fine for simple sheets, but smaller ecosystem; exceljs better documented for styled reports [VERIFIED: registry; Context7 lists both]. Either would work — pick ONE: exceljs. |
| BullMQ repeatable | HTTP cron route (+ external trigger) | Existing pattern but depends on out-of-repo scheduler hitting `/api/cron/*`; adds secret distribution + curl plumbing. Loses worker-process affinity. |
| BullMQ repeatable | bare `setInterval(sweepFn, N)` in `src/worker/index.ts` | Even simpler (zero Redis dependency); invisible to any BullMQ observability. Acceptable fallback if scheduler API misbehaves — one-line swap. |

**Installation:**
```bash
pnpm add exceljs
```

## Package Legitimacy Audit

> slopcheck v-available was run; all candidates scanned against npm before install simulation.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| exceljs | npm | ~12 yrs (v4.4.0 pub 2024-12) | 13.6M/wk | github.com/exceljs/exceljs | OK | Approved — install |
| xlsx (SheetJS) | npm | ~13 yrs (npm frozen 0.18.5) | 12.3M/wk | github.com/SheetJS/sheetjs | OK | Rejected — stale npm build w/ unfixed-on-npm CVEs; not needed |
| write-excel-file | npm | ~6 yrs (v4.1.1) | active | github.com/catamphetamine/write-excel-file | OK | Alternative only — not selected |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
                        ┌──────────────────────────── API process (pnpm dev) ───────────────────────────┐
  logged-in user        │                                                                                │
  ── GET /api/attendance/export/report?format=xlsx&type=month                            │
       │                │  [protectedRoute @app.ts:90]                                                  │
       │                ▼                                                                               │
       │         exportReportController (report.ts)                                                     │
       │           ├─ DateRange.month() (IST)                                                           │
       │           ├─ getCache(attendance:report:{fmt}:{user}:{s}:{e}) ── hit&completed ──► notify+200 │
       │           └─ setCache(key, uuid, 86400s)                                                       │
       │                 queue.add('pdf-attendance-report', {…range, type, user, FORMAT}, {jobId})     │
       └──────────────────────────────┬─────────────────────────────────────────────────────────────────┘
                                      │ Redis (BullMQ)
                                      ▼
                        ┌────────────────────────── Worker process (pnpm dev:worker) ───────────────────┐
                        │ Worker('pdf-attendance-report') (attendance-report.ts)                        │
                        │   ├─ retrieveCustomAttendace(user,start,end,{limit:1000}) → data.parsed       │
                        │   ├── format=pdf  ──► createAttendancePdfBody() ─► Puppeteer ─► {id}.pdf     │
                        │   ├── format=xlsx ──► buildAttendanceWorkbook() ─► exceljs ──► {id}.xlsx     │
                        │   ├─ (on throw: unlink partial file)                                          │
                        │   └─ notification.specific.info([user], …, action{url:/api/attendance/download/{id}.{ext}}) │
                        │                                                                               │
                        │  Repeatable job 'cleanup-expired-reports' (scheduler upserted at startup)     │
                        │    └─ sweepTempReports(): readdir(public/temp) → stat each → unlink age>24h   │
                        └──────────────────────────────┬────────────────────────────────────────────────┘
                                                       │ shared filesystem (implicit existing contract)
                                                       ▼
                                        public/temp/{uuid}.pdf | {uuid}.xlsx
                                                       │
  user clicks notification link ── GET /api/attendance/download/{file} ──► downloadReportController ──► res.download
                                                       ⚠ express.static(cwd/public) ALSO exposes these
                                                         unauthenticated at /temp/{file} (app.ts:100)
```

Trace: request enters authenticated → deduped → enqueued → worker renders either format from ONE data array → notification carries download URL → authenticated stream. Cleanup loop runs independently of request flow.

### Recommended Project Structure
```
src/
├── attendance/export/
│   ├── report.ts                  # MODIFIED: format param, format-aware cache key
│   └── report-download.ts         # unchanged (already format-agnostic)
├── worker/
│   ├── attendance-report.ts       # MODIFIED: branch pdf|xlsx after shared data fetch
│   ├── attendance/
│   │   ├── template/attendance-pdf.ts   # unchanged
│   │   └── attendance-excel.ts    # NEW: AttendanceResponseT[] → workbook → file (pure-ish, unit-testable)
│   └── cleanup-reports.ts         # NEW: sweepTempReports() + repeatable scheduler registration
└── worker/index.ts                # MODIFIED: import './cleanup-reports.js'
tests/
└── attendance/export/
    ├── attendance-excel.test.ts   # NEW: generate→read-back assertions
    └── cleanup.test.ts            # NEW: old-file removed, fresh-file kept (fs.utimes fixtures)
```

### Pattern 1: Dual-format branch off one data-collection step
**What:** Fetch `data.parsed` once; dispatch to renderer per `format`; both produce `{jobId}.{ext}` in the same dir and return the same action shape with correct extension.
**When to use:** Always for this phase — the PDF pipeline's data step is already isolated above rendering.
**Example:**
```typescript
// Source: adapted from src/worker/attendance-report.ts:31-123 (current structure)
const ext = job.data.format === 'xlsx' ? 'xlsx' : 'pdf';
const filePath = path.join(tempPath, `${job.id}.${ext}`);
const downloadPath = `/api/attendance/download/${job.id}.${ext}`;
const data = await retrieveCustomAttendace(/* unchanged */);
if (!data.parsed.length) throw new Error(`No attendance records found for user ${job.data.user} in range`);
if (job.data.format === 'xlsx') {
  await writeAttendanceExcel(data.parsed, filePath); // exceljs writeFile
} else {
  /* existing puppeteer path */
}
```

### Pattern 2: mtime-based retention sweep (no DB, no TZ math)
**What:** Periodic readdir+stat over the temp dir; unlink entries whose `Date.now() - stat.mtimeMs > 86_400_000`.
**When to use:** Any time artifacts are named-by-opaque-id with no DB record — covers every orphan cause uniformly.
**Example:**
```typescript
// Age comparison is elapsed-time — deliberately NOT IST DateRange logic (that's for report ranges)
const RETENTION_MS = 24 * 60 * 60 * 1000;
export const sweepTempReports = async (dir = tempPath): Promise<number> => {
  let removed = 0;
  let names: string[];
  try { names = await fs.readdir(dir); } catch { return 0; } // dir may not exist yet
  const now = Date.now();
  for (const name of names) {
    const stat = await fs.stat(path.join(dir, name)).catch(() => null);
    if (stat?.isFile() && now - stat.mtimeMs > RETENTION_MS) {
      await fs.unlink(path.join(dir, name)); removed++;
    }
  }
  return removed;
};
```

### Pattern 3: Repeatable cleanup job registered idempotently at worker boot
**What:** In `cleanup-reports.ts`, create Queue+Worker for a dedicated queue (e.g. `report-cleanup`) and upsert the repeat schedule once at import time; `src/worker/index.ts` imports it alongside existing workers.
**When to use:** Cleanup must survive Redis restarts → upsert on every worker boot makes the schedule self-healing.
**Example:**
```typescript
// Source: https://github.com/taskforcesh/bullmq/blob/master/docs/gitbook/guide/jobs/repeatable.md [CITED]
await cleanupQueue.upsertJobScheduler(
  'daily-report-cleanup',
  { pattern: '0 3 * * *' },            // daily 03:00 server-time; BullMQ cron is 6-field capable
  { name: 'cleanup-expired-reports', data: {} },
);
new Worker('report-cleanup', async () => ({ removed: await sweepTempReports() }), { connection: bullmqConnection });
```
Note: BullMQ cron patterns include seconds (6 fields) — `'0 3 * * *'` is valid (sec=0). Alternatively `every: 6*3600*1000` for interval-based.

### Anti-Patterns to Avoid
- **Per-record deletion tracking (DB collection of exports + createdAt queries):** unnecessary state; mtime sweep is strictly simpler and catches orphans DB-keyed deletion cannot.
- **Timezone-aware retention math:** applying IST helpers to "one day old" — retention is elapsed wall-clock; mixing in Temporal here invites DST/off-by-one bugs for zero benefit.
- **Rendering Excel via Puppeteer print-to-xlsx tricks or CSV-with-.xlsx-extension:** breaks interop, loses types; exceljs is one dep away.
- **Cleaning up inside the request path:** sweeping on each export request couples latency to directory size; keep it in the scheduled job.
- **Feeding raw `req.query.format` into logic without validation** (repo has mass-assignment history): whitelist via zod.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| .xlsx encoding (zip + XML parts + styles) | Custom zip/XML writer or CSV-renamed-to-xlsx | exceljs `Workbook`/`worksheet.writeFile` | OOXML is deceptively deep (shared strings, styles.xml); hand-rolled files break Excel/LibreOffice parsers |
| Cron scheduling | New HTTP cron route + external crontab entry | BullMQ repeatable job scheduler | Scheduler lives in Redis, upserted at boot; no out-of-repo trigger to forget |
| Traversal-safe serving | Custom path sanitization beyond existing | Keep `path.basename` guard in report-download.ts:13 | Already correct; don't touch what works |
| Time formatting in cells | Ad-hoc date string munging | Reuse `formatTime` (`src/libs/utils/format-time.ts`, Asia/Kolkata) and `formatDate` semantics from the PDF template so both formats agree | Consistency across formats is the requirement |

**Key insight:** everything hard in this domain (xlsx spec, scheduling persistence) is one import away; the phase's real work is wiring format-awareness through dedup key → job payload → filename → notification URL.

## Common Pitfalls

### Pitfall 1: Dedup cache-key collision between formats
**What goes wrong:** Key at `report.ts:78-85` embeds literal `'pdf'`; an xlsx request for the same user+range hits the PDF job's cache entry and vice versa — user gets told "already processing/completed" and notified with the WRONG format link.
**Why it happens:** key predates multi-format support.
**How to avoid:** replace literal with the validated `format` value (`'attendance','report',format,…`). Old keys expire within ≤24h naturally (TTL 86400) — no migration needed.
**Warning signs:** same jobId returned for pdf+xlsx requests in quick succession.

### Pitfall 2: Cached-completion branch drops/mangles the URL
**What goes wrong:** `report.ts:111` reads `data.result?.downloadPath` — worker's returnvalue has `.url`, not `.downloadPath`, so the re-notification action url is `undefined` today.
**How to avoid:** when making this branch format-aware, derive url from `job.returnvalue.url` (or rebuild from `job.id` + ext). Fixing is in-scope since this exact line must change anyway.
**Warning signs:** notification with dead/undefined link on second request after completion.

### Pitfall 3: Constructing a real BullMQ Queue in tests
**What goes wrong:** importing `report.ts` instantiates `Queue('pdf-attendance-report')`; `setup.ts` mocks the connection object but NOT bullmq — calling `queue.add/getJob` in tests attempts a real TCP connect to localhost:6379 and hangs/retries.
**Why it happens:** bullmq connects lazily; constructor alone is harmless.
**How to avoid:** in route-level tests `vi.mock('bullmq', …)` returning stub Queue (capture `add` calls to assert format in payload). Unit tests of excel/cleanup modules don't touch bullmq at all.
**Warning signs:** vitest worker hanging after test body completes.

### Pitfall 4: Partial files left by failed jobs
**What goes wrong:** crash mid-`page.pdf`/mid-`writeFile` leaves corrupt `{id}.{ext}`; served 200 with broken bytes until cleanup.
**How to avoid:** wrap render+write so failure unlinks the target file; belt-and-braces, the 24h sweep deletes stragglers regardless.
**Warning signs:** downloads that open corrupted.

### Pitfall 5: Forgetting the end-of-phase OpenAPI/graphify rule
**What goes wrong:** `openapi/paths/attendance/export-report.yaml` gains a `format` param undocumented; `pnpm docs:lint`/graph drift.
**How to avoid:** plan a closing task: edit export-report.yaml (+ note .xlsx filename in download.yaml response examples), `pnpm docs:lint`, `graphify update .`.

### Pitfall 6: Assuming local PDF-path testing
**What goes wrong:** no system chromium on dev machines (verified absent locally); any test touching `getBrowser()` fails outside Docker.
**How to avoid:** tests exercise the excel renderer + cleanup + route wiring; never launch puppeteer in vitest. (Side benefit: the new format is fully testable where the old one isn't.)

## Code Examples

### Excel writer consuming the shared row type
```typescript
// Source: https://github.com/exceljs/exceljs/blob/master/README.md via Context7 (/exceljs/exceljs) [VERIFIED]
import ExcelJS from 'exceljs';
import fs from 'fs/promises';
import type { AttendanceResponseT } from '../../attendance/retrieve/attendance.schema.js';
import { formatTime } from '../../libs/utils/format-time.js';

export const writeAttendanceExcel = async (rows: AttendanceResponseT[], filePath: string) => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Attendance');
  ws.columns = [
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Check In', key: 'inTime', width: 14 },
    { header: 'Check Out', key: 'outTime', width: 14 },
    { header: 'Hours', key: 'workHours', width: 10 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Late', key: 'isLate', width: 10 },
  ];
  ws.getRow(1).font = { bold: true };
  for (const r of rows) {
    ws.addRow({
      date: r.date,
      inTime: formatTime(r.inTime),
      outTime: formatTime(r.outTime),
      workHours: Number(r.workHours.toFixed(1)),
      status: r.status,
      isLate: r.isLate ? 'Late' : 'On Time',
    });
  }
  await wb.xlsx.writeFile(filePath); // also: wb.xlsx.writeBuffer() for in-memory tests
};
```

### Read-back validation pattern (for the test task)
```typescript
// exceljs can read its own output — assert round-trip
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(filePath);
const ws = wb.getWorksheet('Attendance');
expect(ws!.getRow(1).getCell(1).value).toBe('Date');
expect(ws!.rowCount).toBe(rows.length + 1);
```

## Research Question Verdicts

**Q1 — current flow:** documented in Current State Map with file:line refs. Queue name `pdf-attendance-report` (both job and queue), jobIds are UUIDs, storage `<cwd>/public/temp`, response is `ApiResponse.success({message, data:{jobId, dateRange}})`; download arrives via push notification action.

**Q2 — minimal Excel approach:** exceljs ^4.4.0. Yes — one shared collection step: `retrieveCustomAttendace(...).parsed` feeds both `createAttendancePdfBody(data.parsed)` and `writeAttendanceExcel(data.parsed, …)`. Same summary stats (present/absent/half-day/hours) computable once and reused.

**Q3 — temporary storage design:** keep `<cwd>/public/temp` (path shared by producer+consumer constants today; changing location risks breaking the unseen server-side compose volume layout — see Open Questions). Naming `{jobId}.{ext}` stays; retention keyed on **file mtime** (the only durable metadata — there are no DB records; the Redis dedup key already self-expires at 86400s). No timestamp-in-filename needed; UUID collision-safety plus mtime suffices.

**Q4 — cleanup mechanism:** **BullMQ repeatable job** (Pattern 3), registered via `upsertJobScheduler` on worker boot so it survives Redis flushes/restarts. Rationale vs pass-protected HTTP cron route: existing cron routes depend on an external trigger that lives outside the repo (unverifiable reliability, secret distribution burden); BullMQ runs inside the already-required worker process, uses the existing `bullmqConnection` (now correctly derived from REDIS_URL), and appears in standard BullMQ introspection. Documented fallback: bare `setInterval` in worker/index.ts if scheduler friction appears — one-line swap, still worker-local.

**Q5 — orphan coverage:** the mtime sweep covers ALL classes by construction — (a) job completed but user never downloads → file ages out; (b) file written but Redis/queue record evicted → file ages out; (c) partial file from crashed job → try/unlink-on-error in worker + sweep as backstop; (d) cache key expired but file remains → sweep (key expiry ≠ file deletion today). No DB records exist to dangle.

**Q6 — security of downloads:** the `/api/attendance/download/:fileName` route IS behind `protectedRoute` (mount-level, app.ts:90) with basename traversal guard. **BUT** `express.static(cwd/public)` (app.ts:100) serves the same files **unauthenticated** at `/temp/{uuid}.pdf|.xlsx` — the protection is currently bypassed by design accident; only UUID unguessability + (future) 24h TTL mitigate. Consistent with repo conventions (downloads documented as protectedRoute in MODULE_ROUTES.md:113), recommend: minimum — rely on 24h TTL shrinking exposure; optional hardening task (planner decision, ideally human-verify re: prod compose volumes) — move temp dir outside static scope (e.g. `<cwd>/var/reports`, both constants co-located, add gitignore entry) so ONLY the authenticated route serves exports. IDOR on the authenticated route: any logged-in user can fetch any other user's report by guessing/enumerating UUIDs is impractical, but the route does NOT verify ownership — acceptable given UUID entropy, worth noting.

## Runtime State Inventory

Omitted — greenfield feature addition (no rename/refactor/migration).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| npm `xlsx` (SheetJS) as default xlsx lib | SheetJS ships updates via vendor CDN; npm build frozen at 0.18.5 | since 2023 | npm-installed xlsx misses CVE fixes; prefer exceljs for write-heavy needs [ASSUMED for CVE history; VERIFIED that npm latest = 0.18.5 while project active upstream] |
| BullMQ `QueueScheduler` required for repeatables | Removed in v3+; plain Worker handles them; `upsertJobScheduler` is the modern durable API | bullmq v3/v5 era | Don't copy old tutorials instantiating QueueScheduler [CITED: taskforcesh/bullmq docs via Context7] |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | API server and worker containers share the `public/temp` filesystem in production (server-side compose not in repo) | Q3/Q6 | If they DON'T share, current PDF downloads are already broken in prod — Excel inherits whatever is true; moving dirs could break a volume mount. Mitigation: don't move dir without human verify. |
| A2 | SheetJS npm package misses CVE fixes available only on vendor CDN | Alternatives table | If wrong, xlsx becomes viable again — but exceljs choice unaffected (still simpler fit). |
| A3 | External trigger for existing `/api/cron/*` routes lives outside the repo (host crontab) | Q4 | If some in-repo scheduler exists elsewhere, cron-route option gains weight; verdict unchanged (BullMQ still simpler). |
| A4 | BullMQ cron patterns accept 5-field expressions (seconds optional) | Pattern 3 | Wrong field count shifts cleanup schedule harmlessly (hourly/daily either meets 24h SLA); planner should pin explicit 6-field form. |

## Open Questions

1. **Should the static-serving bypass be fixed in this phase?**
   - What we know: `express.static(cwd/public)` exposes temp exports unauthenticated at `/temp/<uuid>` (app.ts:100); fixing = move dir out of `public/`, touching 2-3 constants.
   - What's unclear: whether prod compose mounts a volume specifically at `public/temp` (compose file not in repo) — a silent-break risk for cross-container sharing.
   - Recommendation: default plan KEEPS the current path (retention shrinks exposure to ≤24h); offer dir-move as an optional task gated on `checkpoint:human-verify` confirming compose volume layout.
2. **Should `format` be validated via zod `validate()` middleware?**
   - What we know: existing route reads raw `req.query` with manual switch (repo convention violation, pre-existing).
   - Recommendation: yes for the new param (whitelist `'pdf'|'xlsx'`); full-route zod migration is out of scope.
3. **Cleanup cadence:** hourly vs daily-at-03:00.
   - Recommendation: hourly (`every` interval or 6-field cron `0 0 * * * *`) — cheap sweep, bounds worst-case file lifetime at ~25h; either satisfies "removed after one day".

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| node | everything | ✓ | v24.19.0 | — |
| pnpm | installs/scripts | ✓ | 11.0.9 | — |
| vitest + mongodb-memory-server | tests | ✓ | 4.1.11 / 11.2.0 (mongod binary cached) | — |
| Redis (real) | BullMQ integration tests | ✗ (tests use fakeRedis; no live redis assumed in CI/dev) | — | vi.mock('bullmq'); unit-level coverage — see Pitfall 3 |
| Chromium | PDF-path execution/tests | ✗ locally, ✓ in Docker (`/usr/bin/chromium-browser`) | — | Don't test PDF rendering; excel path needs no browser |
| exceljs | xlsx generation | ✗ (to be installed) | 4.4.0 latest | — |

**Missing dependencies with no fallback:** none blocking.
**Missing dependencies with fallback:** live Redis for tests → mocked bullmq (standard pattern here); local Chromium → skip PDF-render tests.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest ^4.1.11 (globals: true, environment: node) |
| Config file | `vitest.config.ts` (setupFiles: `./tests/setup.ts` — MongoMemoryReplSet + fakeRedis + mail stub) |
| Quick run command | `pnpm vitest run tests/attendance/export` |
| Full suite command | `pnpm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| D1a | Excel workbook built from `AttendanceResponseT[]`: headers, row count, formatted times/statuses, summary | unit (writeBuffer→read back) | `pnpm vitest run tests/attendance/export/attendance-excel.test.ts` | ❌ Wave 0 |
| D2/D1b | `GET /export/report?format=xlsx` enqueues job whose payload carries `format:'xlsx'`; dedup key distinct per format; default remains pdf | integration (vi.mock bullmq Queue; supertest via `mkPerson` helper) | `pnpm vitest run tests/attendance/export/export-route.test.ts` | ❌ Wave 0 |
| D3a | Sweep deletes files older than 24h, keeps fresh ones, tolerates missing dir/non-files | unit (tmp dir + `fs.utimes` fixtures) | `pnpm vitest run tests/attendance/export/cleanup.test.ts` | ❌ Wave 0 |
| D3b | Download route: 404 unknown file, 200 stream for seeded file (existing behavior guard) | integration (supertest + real temp file) | `pnpm vitest run tests/attendance/export/download.test.ts` | ❌ Wave 0 |
| — | Type/lint gate for all of the above | static | `pnpm typecheck && pnpm lint` | ✓ |

### Sampling Rate
- **Per task commit:** `pnpm vitest run tests/attendance/export && pnpm typecheck && pnpm lint`
- **Per wave merge:** `pnpm test` (full suite)
- **Phase gate:** full suite green + `pnpm docs:lint` + `graphify update .` (end-of-phase rule) before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/attendance/export/attendance-excel.test.ts` — D1 (pure exceljs; no mocks needed)
- [ ] `tests/attendance/export/cleanup.test.ts` — D3a (pure fs; no mocks needed)
- [ ] `tests/attendance/export/export-route.test.ts` — D1b/D2 — requires `vi.mock('bullmq')` (Pitfall 3); reuses `mkPerson` from `tests/helpers/person.ts`
- Framework install: none — infrastructure complete

## Security Domain

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | existing JWT `protectedRoute` on export+download mounts |
| V3 Session Management | no | unchanged |
| V4 Access Control | partial | download route lacks per-user ownership check — mitigated by UUID entropy; flag, don't expand scope |
| V5 Input Validation | yes | zod whitelist on new `format` param; never raw req.query into filters |
| V6 Cryptography | no | n/a |
| V7/V14 (file handling) | yes | basename traversal guard (keep); content-type via `res.download`; retention limits exposure window |

### Known Threat Patterns for this stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Path traversal on `:fileName` | Tampering/Elevation | existing `path.basename` guard — preserve |
| Unauthenticated artifact access via static middleware | Information Disclosure | 24h TTL (this phase); optional dir relocation out of static root (Open Question 1) |
| Formula injection (=cmd payloads) into spreadsheet cells | Tampering | escape leading `=`/`+`/`-`/`@` in cell strings — attendance fields are enum/date/time so low risk, but apply to any free-text column |
| Mass assignment via raw query params | Tampering | zod validate new param (AGENTS.md mandate) |

## Sources

### Primary (HIGH confidence)
- Codebase (all file:line refs read this session): src/attendance/export/{report,report-download}.ts, src/worker/{index,model,attendance-report}.ts, src/worker/attendance/template/attendance-pdf.ts, src/app.ts, src/attendance/attendance.route.ts, src/libs/redis/redis-client.ts, src/libs/class/{date-range,notification}.ts, src/public/public.routes.ts, src/libs/middleware/cron-secret.ts, tests/{setup.ts,helpers/*}, vitest.config.ts, package.json, Dockerfile, docker-compose.dev.yml, .gitignore, openapi/openapi.yaml, MODULE_ROUTES.md
- Context7 `/exceljs/exceljs` — workbook/worksheet/addRow/writeFile APIs from official README
- Context7 `/taskforcesh/bullmq` — repeatable jobs guide (repeat pattern/every, upsertJobScheduler)
- npm registry: exceljs@4.4.0 (pub 2024-12), xlsx@0.18.5, write-excel-file@4.1.1; weekly download counts via api.npmjs.org (2026-08-22 week)
- slopcheck scan: exceljs [OK], xlsx [OK], write-excel-file [OK]

### Secondary (MEDIUM confidence)
- Environment probes: node/pnpm versions, absence of local chromium, cached mongod binary, absence of CONTEXT.md/.planning/config.json/docker-compose.yml(prod)

### Tertiary (LOW confidence)
- SheetJS CDN-distribution history and CVE timeline [ASSUMED — training knowledge]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — exceljs triple-verified (registry, slopcheck, Context7 official README); rest already installed
- Architecture/current-state: HIGH — every file in the flow read end-to-end this session
- Pitfalls: HIGH — all six grounded in specific lines read this session (cache-key literal, downloadPath typo, lazy-connect Queue, etc.)
- Deployment assumptions: MEDIUM — prod compose file not in repo (A1)

**Research date:** 2026-08-23
**Valid until:** 2026-09-22 (stable domain; exceljs 4.x is mature)

## RESEARCH COMPLETE

Phase research finished — all six orchestrator questions answered with file:line evidence, one new dependency vetted (exceljs, clean), cleanup mechanism decided (BullMQ repeatable mtime sweep, worker-side, no DB state), test strategy mapped onto existing vitest infra. Planner can proceed; the only human-verify candidate is the optional temp-dir relocation (Open Question 1).
