# Fix plan — `src/libs`

Source: `MODULE_ANALYSIS.md` §7 (middleware/, redis/, utils/, class/, mail/, logger/,
eslint-rules/). Shared infra — every change here is repo-wide; land in small PRs.

## Findings status at HEAD (2026-08-22)

All ⚠️ (not individually re-verified; audit cites exact lines).

## middleware/

1. **error-handler.ts**: non-ApiError → generic 500 message (`Internal Server Error`),
   real message only when `NODE_ENV !== 'production'`; keep pino error log server-side.
2. **metrics.ts**: normalize route label to `req.route?.path ?? req.baseUrl` pattern;
   cap cardinality, never raw `originalUrl`.
3. **request-id.ts**: accept client `x-request-id` only if `/^[\w-]{1,64}$/`, else generate.
4. NIT: delete ~80 lines commented code in `protected-route.ts`.

## redis/

1. **redis-client.ts**: fail fast if `REDIS_URL` missing in production (pairs with boot
   env validation in `00-cross-cutting.md`); replace hard stop after 10 retries with
   backoff ceiling + reconnect.
2. **redis-utils.ts getCache**: wrap `JSON.parse` in try/catch → treat corrupt entry as
   cache miss and delete the key.

## utils/

1. **push-notification.ts**: lazy VAPID init (no import-time env deref); chunk/p-limit
   concurrent sends.
2. **mark-seen.ts**: filter `{ _id, user: req.user.id }` — IDOR fix.
3. **convert-object-id.ts**: throw `ApiError(400, …)` instead of plain Error.
4. LOW: browser `--no-sandbox` (needs non-root user in image — ops task); delete dead
   `date-range.ts`.

## class/ · mail/ · logger/ · eslint-rules/

1. **notification.ts fan-out**: global sends currently do O(users) inserts + unbounded
   Promise.all RMW — move to BullMQ job or bulkWrite + pipelined Redis; make `specific`
   branch use `formatMessage` too.
2. **mail templates**: move `new Date().toLocaleString()` inside render functions (5 files);
   add `https://` to onboard login link; HTML-escape user-supplied name/URLs.
3. **api-response.ts**: constrain `success()` to 2xx codes (type-level).
4. **resend-send-mail.ts**: lazy init, log via pino not console.error.
5. **http-logger.ts**: strip query string from logged URL.
6. NIT: narrow eslint no-res-json rule to res identifiers.

## Verification

- Trigger a thrown Mongoose CastError via API → response body has generic message.
- Seed one garbage Redis value for a cached read → endpoint returns fresh data, not 500.
- Mark-seen another user's notification id → 404/403.
- Send global notification to 10k users (staging) → completes without event-loop stall.
