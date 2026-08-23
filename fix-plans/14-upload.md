# Fix plan — `src/upload`

Source: `MODULE_ANALYSIS.md` §14.

## Findings status at HEAD (2026-08-22)

| Sev  | Location                                                                 | Status                                                                            |
| ---- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| HIGH | mounted without `protectedRoute`                                         | ❌ **verified open** — `index.ts:68` mounts `/api/upload` with no auth middleware |
| LOW  | orphaned file when `Media.create` fails; console.error instead of logger | ⚠️                                                                                |

Also observed at HEAD (new, not in audit): upload router is mounted **before**
`cookieParser()` (`index.ts:67-69`) — even after adding `protectedRoute`, cookies won't be
parsed on this route. Reorder is required together with the auth fix.

## Fixes

1. Mount behind auth + reorder parsers:
   ```ts
   app.use(express.json());
   app.use(cookieParser());
   app.use('/api/upload', protectedRoute, uploadRouter);
   ```
2. On `Media.create` failure: unlink the written file (wrap sharp-write + create in
   try/catch, cleanup in catch).
3. Replace `console.error` in `image.service.ts` with pino child logger.
4. Existing config confirmed OK by audit: memory storage, 5 MB cap, MIME whitelist,
   UUID filenames — don't touch.

## Verification

- Anonymous POST `/api/upload/image` → 401.
- Authenticated upload → 201, file exists, Media doc exists.
- Simulate Media.create failure → no orphan file on disk.
