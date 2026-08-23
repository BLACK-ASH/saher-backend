---
phase: 2
slug: attendance-excel-export
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-23
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.x |
| **Config file** | existing vitest config (repo-wide `pnpm test`) |
| **Quick run command** | `pnpm vitest run tests/attendance/ tests/export/` |
| **Full suite command** | `pnpm vitest run` |
| **Estimated runtime** | ~110 seconds full / ~20 s scoped |

---

## Sampling Rate

- **After every task commit:** Run quick command (scoped to touched area)
- **After every plan wave:** Run `pnpm vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-T1 | 01 | 1 | Excel export format | — | N/A | unit/integration | `pnpm vitest run tests/attendance/ -t excel` (per final plan) | ❌ W0 | ⬜ pending |
| 02-01-T2 | 01 | 1 | Temp storage + retention | — | N/A | unit/integration | `pnpm vitest run tests/attendance/ -t cleanup` (per final plan) | ❌ W0 | ⬜ pending |
| 02-01-T3 | 01 | 1 | Cache-key format bug fix | T-02-01 | PDF and XLSX cache entries never collide | integration | `pnpm vitest run tests/attendance/ -t cache` (per final plan) | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Exact task IDs/commands to be finalized by planner from PLAN.md; this map fixes the sampling contract: every task needs a runnable scoped command.*

---

## Wave 0 Requirements

- [ ] Test file(s) for Excel export validity (openable workbook, expected sheet/cell shape)
- [ ] Test for cleanup sweep (old mtime removed, fresh kept)
- [ ] No framework install needed (vitest present)

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Repeatable cleanup job registers on worker boot in prod compose | Retention | Worker boot + docker-compose service naming not reproducible in CI | Deploy to dev, inspect BullMQ repeatable job via redis or logs after 24h+ |
| Downloaded .xlsx opens correctly in real Excel/LibreOffice | Excel export | Renderer fidelity is human-judged | Export a report, open the file in a spreadsheet app |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
