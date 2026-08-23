# Phase 2: Attendance Export — Excel Format - Pattern Map

**Mapped:** 2026-08-23
**Files analyzed:** 3
**Analogs found:** 3 / 3

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/attendance/export/report.ts` | controller | request-response | (self) | exact |
| `src/worker/attendance-report.ts` | service | event-driven | (self) | exact |
| `src/worker/attendance/template/attendance-excel.ts` | utility | transform | `src/worker/attendance/template/attendance-pdf.ts` | role-match |

## Pattern Assignments

### `src/attendance/export/report.ts` (controller, request-response)

**Analog:** (self)

**Redis Key Pattern** (lines 78-85):
```typescript
  const key = createKey(
    'attendance',
    'report',
    'pdf', // Must be made format-aware (e.g., dynamic)
    req.user?.id as string,
    dateRange.startDateString,
    dateRange.endDateString,
  );
```

**Queue Job Pattern** (lines 131-137):
```typescript
  await attendanceReportQueue.add(
    'pdf-attendance-report',
    { ...dateRange, type, user: req.user?.id },
    {
      jobId,
    },
  );
```

---

### `src/worker/attendance-report.ts` (service, event-driven)

**Analog:** (self)

**Worker Setup Pattern** (lines 125-131):
```typescript
export const attendanceReportWorker = new Worker(
  'pdf-attendance-report',
  generateAttendanceReportPdf,
  {
    connection: bullmqConnection,
  },
);
```

---

### `src/worker/attendance/template/attendance-excel.ts` (utility, transform)

**Analog:** `src/worker/attendance/template/attendance-pdf.ts`

**Template Transformation Pattern** (from pdf analog, lines 14-27):
```typescript
export const createAttendancePdfBody = (data: AttendanceResponseT[]) => {
  const totalPresent = data.filter((d) => d.status === 'present').length;
  // ... calculations
  const user = data[0]?.user;
  
  // Return template/Excel workbook object
};
```
*Note: Use `exceljs` ^4.4.0. Extract data to a shared format, then map to exceljs sheet structure instead of HTML string.*

## Shared Patterns

### Error Handling
**Source:** `src/worker/attendance-report.ts`
**Apply to:** All worker renderers. Ensure failed jobs unlink target file to prevent partial file leaks.
```typescript
// Example of required cleanup pattern
try {
  return await renderJob(job, page);
} finally {
  await page.close().catch((err) => logger.warn({ err }, `Failed to close page for job ${job.id}`));
}
```

### Cleanup
**Source:** `src/worker/attendance-report.ts` (new pattern)
**Apply to:** Worker startup to initialize cleanup.
```typescript
// Pattern: BullMQ repeatable job for file cleanup
// scheduler upserted idempotently at worker startup
// runs mtime sweep of the temp dir
// deletes files older than 24h
```

## Metadata

**Analog search scope:** `src/attendance`, `src/worker`
**Files scanned:** 3
**Pattern extraction date:** 2026-08-23
