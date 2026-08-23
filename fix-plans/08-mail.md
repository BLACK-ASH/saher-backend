# Fix plan — `src/mail`

Source: `MODULE_ANALYSIS.md` §8.

## Findings status at HEAD (2026-08-22)

| Sev  | Location                                                               | Status                                                                              |
| ---- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| CRIT | schema `receiverID` vs controller `receiversIDs` — send can never work | ✅ **FIXED** — `mail.schema.ts` now uses `to: z.array(z.string()).min(1)` (+cc/bcc) |
| MED  | inbox/outbox no pagination/sort (`mail.controller.ts`)                 | ⚠️ verify then fix                                                                  |
| MED  | `body` stored verbatim, rendered as HTML downstream → stored XSS       | ⚠️                                                                                  |

## Fixes

1. **Pagination**: inbox/outbox get `page`/`limit` via validate() (clamped, e.g. ≤50),
   `.sort({ createdAt: -1 })`, return total count for client paging.
2. **Body handling**: store plain text (strip tags on ingest) or sanitize if rich text is a
   product requirement; render with escaping downstream. Decide once — this is also the
   vector that matters if mail bodies ever reach the PDF renderer.
3. Regression note: keep the fixed `to/cc/bcc` array shape as-is; add email-format refine
   per element if recipients are free-form addresses.

## Verification

- Send mail → appears in recipient inbox and sender outbox.
- Inbox with 500 docs → payload bounded by limit, sorted desc.
- Body containing `<script>` → stored/rendered inert (escaped or stripped).
