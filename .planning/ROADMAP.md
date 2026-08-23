# Roadmap

## Phase 1: Expand File Upload Support

**Goal:** Extend the existing `/api/upload/image` endpoint to support PDF, DOC, PPT, and Excel files, following the current Multer/Sharp implementation patterns.

**Deliverables:**
- Update Zod validation schemas to accept new MIME types.
- Modify Multer storage/filter logic to allow document extensions.
- Ensure Media model and downstream processing (if any) handle non-image types.
- Update tests to cover new file types.

---
