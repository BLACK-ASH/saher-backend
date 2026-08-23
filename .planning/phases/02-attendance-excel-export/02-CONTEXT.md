# Phase 2: Attendance Excel Export & Temp Storage - Context

**Gathered:** 2026-08-23
**Status:** Ready for planning
**Source:** User decisions (inline during plan-phase)

<domain>
## Phase Boundary

Attendance report export gains Excel (.xlsx) alongside existing PDF, and generated files live for one day then are deleted. Out of scope: changes to report data logic, new export types beyond xlsx/pdf.
</domain>

<decisions>
## Implementation Decisions

### Architecture (LOCKED)
- **D-01:** Excel export MUST follow the exact same process as PDF export: route → BullMQ queue → worker processes job → file written to temp storage → notification sent to user with download link. No synchronous/excel-in-request-path shortcut.

### Storage & Cleanup (LOCKED)
- **D-02:** Both PDF and XLSX exports are temporary artifacts retained for one day, then removed automatically. Cleanup runs server-side without external triggers where possible (research recommends BullMQ repeatable job over HTTP cron route; final choice is the agent's discretion informed by RESEARCH.md).
- **D-03:** Fix pre-existing format-collision bug while touching the pipeline: cache key hardcodes `'pdf'` (`src/attendance/export/report.ts:81`) — must key on actual format or PDF/XLSX entries collide.

### the agent's Discretion
- Excel library choice (RESEARCH.md recommends exceljs), sheet layout/styling, cleanup cadence, test structure details.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Current Export Flow
- `.planning/phases/02-attendance-excel-export/02-RESEARCH.md` — full flow map with file:line refs (report.ts → queue → worker → Puppeteer → public/temp/{uuid}.pdf → notification → authenticated download)
- `.planning/phases/02-attendance-excel-export/02-VALIDATION.md` — sampling contract for execution

</canonical_refs>

<specifics>
## Specific Ideas

- Same `data.parsed` array should feed both PDF and Excel renderers (single data-collection step, two renderers) per RESEARCH.md.
</specifics>

<deferred>
## Deferred Ideas

None — phase scope is fully captured above.
</deferred>

---

*Phase: 02-attendance-excel-export*
*Context gathered: 2026-08-23 inline during plan-phase*
