---
wave: 1
depends_on: []
files_modified:
  - src/upload/document/document.middleware.ts
  - src/upload/document/document.service.ts
  - src/upload/document/document.controller.ts
  - src/upload/upload.routes.ts
  - tests/upload/document.test.ts
autonomous: true
---

# Plan: Separate Document Upload Endpoint

Add `POST /api/upload/document` for PDF, DOCX, PPTX, XLSX. The existing image upload (`src/upload/image/*`) is **NOT modified** — zero regression risk to flows that depend on WebP image output everywhere in the codebase.

## Tasks

### [T1] Document Middleware (Multer filter)
- **Read First:** `src/upload/image/image.middleware.ts` (pattern to copy), then create `src/upload/document/document.middleware.ts`
- **Action:**
  - Memory storage, same as image middleware.
  - Allow-list exactly: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (doc/docx), `application/vnd.ms-powerpoint`, `application/vnd.openxmlformats-officedocument.presentationml.presentation` (ppt/pptx), `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (xls/xlsx).
  - Reject everything else with `req.fileValidationError = 'Only PDF, DOC, PPT, XLS Files Are Allowed'`.
  - Limit: 10 MB (documents run larger than images).
  - Export as `uploadDocument`.
- **Acceptance Criteria:**
  - `uploadDocument` exported from `document.middleware.ts`.
  - Filter accepts each listed MIME type, rejects `image/png` and `text/plain`.

### [T2] Document Service (direct save, no sharp)
- **Read First:** `src/upload/image/image.service.ts` (pattern), create `src/upload/document/document.service.ts`
- **Action:**
  - `saveDocument(file)`: write `file.buffer` via `fs/promises` to `public/uploads/documents/<uuid><original-ext>` (`path.extname(file.originalname)`, lowercased; fallback empty string).
  - Return `{ fileName, documentUrl: /uploads/documents/<fileName>, size: file.buffer.length, mimetype: file.mimetype }`.
  - No sharp, no resize — raw bytes preserved.
- **Acceptance Criteria:**
  - Saved file bytes equal uploaded bytes.
  - Extension preserved (.pdf stays .pdf).

### [T3] Document Controller
- **Read First:** `src/upload/image/image.controller.ts` (pattern incl. DB-failure unlink cleanup), create `src/upload/document/document.controller.ts`
- **Action:**
  - Mirror image controller guards: `fileValidationError` → ApiError 400; missing file → 400; missing `name` (used as `alt`) → 400.
  - Call `saveDocument`, then `Media.create({ src: documentUrl, alt: name })`.
  - On DB failure: `fs.unlink` the written file (catch-and-ignore), rethrow.
  - Return `ApiResponse.success(res, { statusCode: 201, data: { id, fileName, url, size, mimetype } })`.
- **Acceptance Criteria:**
  - Response envelope identical in shape to image upload response.
  - Failed DB write removes orphaned file.

### [T4] Wire Route
- **Read First:** `src/upload/upload.routes.ts`
- **Action:**
  - Add single line: `uploadRouter.post('/document', uploadDocument.single('document'), uploadDocumentController);`
  - Do not touch the `/image` route or its imports.
- **Acceptance Criteria:**
  - Existing `/image` route line unchanged.
  - `pnpm typecheck && pnpm lint` green.

### [T5] Bulk Upload Endpoint
- **Read First:** `src/upload/document/document.middleware.ts`, `document.controller.ts` (as implemented)
- **Action:**
  - New route `POST /api/upload/documents` using `uploadDocument.array('documents', 10)` (same multer instance).
  - Bulk controller: guard missing/empty `req.files` → 400; loop each file through `saveDocument` + `Media.create`; on any DB failure unlink files written so far (catch-and-ignore), rethrow.
  - Respond 201 with array of `{ id, fileName, url, size, mimetype }`.
- **Acceptance Criteria:**
  - Single `/document` route unchanged.
  - One Media row per uploaded file; orphaned files cleaned on DB failure.
- **Skipped by design:** document compression — PDF/DOC/XLS are already-compressed binaries; transcoding requires LibreOffice/ghostscript-class deps. 10 MB per-file limit stands as the size control.

### [T6] Tests
- **Read First:** `tests/helpers/person.ts`, an existing API test (e.g. `tests/notice/notice.test.ts`) for supertest+auth-cookie pattern; extend `tests/upload/document.test.ts`
- **Action:**
  - Cover: valid pdf upload → 201 + url contains `/uploads/documents/`; valid xlsx upload → 201; rejected type (e.g. `.txt`) → 400; missing name field → 400; bulk upload of two valid files → 201 with two entries + two Media rows; invalid type in bulk batch → 400.
- **Acceptance Criteria:**
  - `pnpm vitest run` passes with new tests and no regressions.

### [T7] Bulk Image Endpoint
- **Read First:** `src/upload/image/image.controller.ts`, `src/upload/document/document.controller.ts` (`uploadBulkDocumentsController` as pattern), `src/upload/upload.routes.ts`
- **Action:**
  - New route `POST /api/upload/images` using `uploadImage.array('images', 10)` (same multer instance, no middleware change).
  - Bulk controller mirroring `uploadBulkDocumentsController`: guard missing/empty `req.files` → 400; loop each file through `processAndSaveImage` + `Media.create`; on any DB failure unlink files written so far (catch-and-ignore), rethrow.
  - Respond 201 with array of `{ id, fileName, imageUrl, size, mimetype }`.
  - Do NOT modify the existing single `/image` route or controller.
- **Acceptance Criteria:**
  - Each uploaded image processed to WebP exactly like single upload.
  - One Media row per file; orphaned files cleaned on DB failure.
- Tests (extend `tests/upload/image.test.ts` or create alongside document tests): bulk of two valid images → 201, two entries + two Media rows, urls end `.webp`; invalid type in batch → 400.

### Final matrix
| | single | bulk |
|---|---|---|
| image | POST /upload/image | POST /upload/images |
| document | POST /upload/document | POST /upload/documents |
