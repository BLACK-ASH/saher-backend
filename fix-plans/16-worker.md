# Fix plan — `src/worker`

Source: `MODULE_ANALYSIS.md` §16. BullMQ attendance-PDF worker + Puppeteer.

## Findings status at HEAD (2026-08-22)

| Sev  | Location                                                                                    | Status                                        |
| ---- | ------------------------------------------------------------------------------------------- | --------------------------------------------- |
| HIGH | page never closed (no try/finally)                                                          | ⚠️ verify then fix                            |
| MED  | `data[0].date` crash on empty result; no retries; `limit:1000` truncation; PDF template XSS | ⚠️                                            |
| LOW  | hardcoded Redis host `'redis'`                                                              | ⚠️ known gotcha (documented in AGENTS.md too) |

## Fixes in order

1. **Page lifecycle**: wrap render in try/finally with `await page.close()`; consider
   `browser.isClosed()` check before reuse in `getBrowser()`.
2. **Empty-result guard**: bail early with a clear failed-state message when the range has
   no rows (requester must see failure, not eternal "processing" — pair with the export
   cache-miss fix in `02-attendance.md` Chunk D).
3. **Job retries**: BullMQ job opts `{ attempts: 3, backoff: { type: 'exponential', delay: 5000 } }`,
   removeOnComplete/removeOnFail TTLs aligned with the 24h report cache.
4. **Cursor iteration**: replace `limit:1000` with cursor batch loop for long ranges.
5. **PDF XSS**: HTML-escape `user.name`, `user.email`, and any row strings interpolated
   into `attendance-pdf.ts` templates (content is user-controlled and executes inside
   headless Chromium).
6. **Env-driven Redis**: read host from `REDIS_URL`/env instead of literal `'redis'`
   (fixes non-compose deploys; also update AGENTS.md gotcha note once fixed).

## Verification

- Run 20 jobs → FD/page count stable (`ps` / Chromium task manager), no leak.
- Request report for empty range → job fails fast, poll endpoint reports failed state.
- User named `<img src=x onerror=…>` → escaped text in PDF, no execution.
