---
phase: 01
plan: 01
status: complete
commits:
  - 853a0ff feat(upload): add separate document upload endpoint
  - ada3d20 feat(upload): add bulk document upload endpoint
  - af2eb65 feat(upload): add bulk image upload endpoint
  - 4ad0a45 docs(openapi): document single and bulk image and document upload endpoints
---

# Phase 01 Summary: Expand File Upload Support

## What was built

Separate image/document upload endpoints, single + bulk each:

| Endpoint | Field | Limit | Processing |
|---|---|---|---|
| `POST /api/upload/image` | `image` + `name` | 5 MB | sharp → WebP (pre-existing) |
| `POST /api/upload/images` | `images[]` (max 10) | 5 MB/file | sharp → WebP per file |
| `POST /api/upload/document` | `document` + `name` | 10 MB | raw save |
| `POST /api/upload/documents` | `documents[]` (max 10) | 10 MB/file | raw save per file |

## Key decisions

- **Separate routes per type** (user-mandated, confirmed good practice): independent filters, limits, pipelines; no type-branching inside one endpoint.
- **Image module untouched** until bulk addition; existing single-image controller/middleware/service behavior preserved byte-for-byte (verified via git diff each increment).
- **Bulk uploads use each file's originalname as Media `alt`** — no shared name field in bulk flows.
- **Orphan cleanup:** DB-write failure unlinks written files (single: one file; bulk: all files so far).
- **Compression of documents skipped by design:** PDF/DOC/XLS are already-compressed binaries; transcoding would need LibreOffice/ghostscript-class deps. 10 MB limit is the size control.

## Files

- Created: `src/upload/document/{middleware,service,controller}.ts`
- Modified: `src/upload/image/image.controller.ts` (additive bulk controller), `src/upload/upload.routes.ts` (+3 routes), AGENTS.md (end-of-phase rule)
- Docs: `openapi/paths/upload/{document-upload,document-bulk-upload,image-bulk-upload}.yaml` new; `image-upload.yaml` corrected (200→201, `file`→`data`)
- Tests: `tests/upload/{document,image}.test.ts`

## Verification

- `pnpm typecheck` ✅ · `pnpm lint` ✅ · `pnpm vitest run`: **17 files / 243 tests pass** (was 233 pre-phase)
- `pnpm docs:lint` valid (7 pre-existing attendance warnings)
- `graphify update .` run after docs

## Known follow-ups

- MODULE_ANALYSIS.md deletion still unstaged in worktree (user restored MODULE_ROUTES.md only).
- Branch `fix/module-fixes` has 4+ unpushed commits — push requires explicit user permission.
