# Fix plan — `src/seeds`

Source: `MODULE_ANALYSIS.md` §12.

## Findings status at HEAD (2026-08-22)

| Sev  | Location                                               | Status                                                                                                                                                                        |
| ---- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CRIT | hardcoded admin password `ADMIN000`                    | ⚠️ **partially improved** — password is now hashed via `libs/utils/password-hash.ts` (`create-first-user.ts:55`), but the value is still a known constant committed to source |
| HIGH | seed failure swallowed; runner exits 0                 | ⚠️ verify then fix                                                                                                                                                            |
| MED  | emptiness check outside transaction (duplicate admins) | ⚠️                                                                                                                                                                            |

## Fixes

1. **Random credential**: generate `crypto.randomBytes(12)` base64 (or use a required
   `SEED_ADMIN_PASSWORD` env var documented in `.env.example`), print once to stdout,
   mark pre-verified + force-reset flag so first login demands change.
2. **Fail loudly**: rethrow inside `runner.ts`; explicit `process.exit(1)` on seed failure;
   check `MONGO_URI` explicitly with clear message instead of `!`.
3. **TOCTOU**: move the "no users exist" check inside the transaction, or rely on a unique
   index on email + catch duplicate-key as idempotent success.
4. Keep AGENTS.md note accurate: update the `pnpm seed` description there if behavior
   changes (it currently documents the hardcoded dev convenience).

## Verification

- Run seed twice concurrently → exactly one admin, no crash.
- Force transaction failure (bad index) → non-zero exit code, visible error.
