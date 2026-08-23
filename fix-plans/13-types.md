# Fix plan — `src/types`

Source: `MODULE_ANALYSIS.md` §13. Small module, one finding.

## Findings status at HEAD (2026-08-22)

| Sev | Location                                                                                     | Status             |
| --- | -------------------------------------------------------------------------------------------- | ------------------ |
| MED | `express.d.ts:10` — `UserRole` referenced without import while `export {}` makes it a module | ⚠️ verify then fix |

## Fixes

1. `import type { UserRole } from '../database/user.model.js'` (ESM: `.js` suffix per
   repo convention) at the top of `express.d.ts`; keep the augmentation attached.
2. Confirm with `pnpm typecheck` under strict — if TS2304 appears, this was silently
   broken; fix before any code that narrows `req.user.role`.

## Verification

- `pnpm typecheck` clean; autocomplete on `req.user.role` yields the union.
