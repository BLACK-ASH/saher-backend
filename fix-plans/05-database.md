# Fix plan — `src/database`

Source: `MODULE_ANALYSIS.md` §5. Central models — changes here ripple everywhere;
coordinate with `01-admin.md` (KYC projection) and `03-auth.md`.

## Findings status at HEAD (2026-08-22)

| Sev  | Location                                                                                                                                         | Status               |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- |
| HIGH | `media-upload.model.ts:7,12` — `require:` instead of `required:`                                                                                 | ❌ **verified open** |
| HIGH | populates return full bank/aadhar/pan/resume docs without projection                                                                             | ⚠️                   |
| MED  | connection.ts pool options + `exit(0)` on failure; notification/session/bank indexes; attendance `date` as free-form String; no cascade strategy | ⚠️                   |

## Fixes in order

1. **Typo fix** (1-line, zero risk): `require: true` → `required: true` at
   `media-upload.model.ts:7,12`. Check for other instances repo-wide.
2. **Safe projections**: define populate projections (e.g. bank without accountNumber?
   product call) for any populate reachable by non-admin readers. Pair with the admin-route
   guards from `01-admin.md`.
3. **Indexes at definition time** (repo rule #5):
   - `notification`: compound `{ user: 1, isSeen: 1, createdAt: -1 }`
   - `session`: `{ workshopId: 1 }`, participants lookup support
   - `bank.accountNumber`: sparse unique; `account.phone`: unique
   - `attendance.date`: decide format first (next item)
4. **attendance.date typing**: migrate to day-granular Date (or strict ISO string regex).
   This is a data migration — write a script, run against staging, coordinate with cron code
   that writes `standardDateString` values.
5. **connection.ts**: add `maxPoolSize`, `serverSelectionTimeoutMS`,
   `socketTimeoutMS`; failure path → `process.exit(1)`.
6. **Cascade strategy** (design task): pick per-model onDelete behavior
   (block vs cascade) and implement as explicit controller-level transactions, NOT global
   middleware — keeps delete paths auditable.
7. NOTE carried forward: introducing `pre('save')` password hashing later will double-hash
   paths that already hash via `libs/utils/password-hash.ts` (seed does today). Audit every
   `.create(`/`.save(` of User/Account when hooks are added.

## Verification

- `pnpm typecheck && pnpm lint` after each step.
- Save MediaUpload without src → ValidationError now fires.
- `db.notification.getIndices()` shows compound index; explain() uses IXSCAN.
- Connection to bad URI → process exits 1.
