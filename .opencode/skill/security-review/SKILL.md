---
name: security-review
description: Use when reviewing auth, admin, attendance, permissions, uploads, or any route change in saher-backend - audit checklist derived from MODULE_ANALYSIS.md covering the known bug classes (missing authorize, filter-drop IDOR, mass assignment, plaintext passwords, cache leaks).
---

# Security Review Checklist (saher-backend)

Derived from the full audit in `MODULE_ANALYSIS.md` (13 CRITICAL / 30 HIGH findings). Any change touching these areas MUST be checked against the bug classes below — they already bit this codebase once.

## 1. Authorization

- [ ] Route has `protectedRoute` AND, for privileged operations, `authorize(action, resource)`.
- [ ] Remember: `authorize()` currently passes ALL `read` actions unconditionally (`src/permission/authorize.ts:22-24`) — do not rely on it alone for reads; scope queries instead.
- [ ] No naked GETs of user/bank/account data without ownership scoping or real role checks (admin.routes gap).

## 2. Input handling & mass assignment

- [ ] Every body/params/query validated with zod via `validate()`; no raw `req.body` into Mongo filters or updates.
- [ ] Update schemas must NOT admit `role` or `password` (privilege escalation + plaintext-storage history).
- [ ] ObjectId params coerced; dates coerced/refined (no NaN into queries or cache keys).

## 3. Query scoping

- [ ] User-scoped reads filter `{ user: req.user.id }` — an undefined id must reject, never drop the filter (`all-attendance.controller.ts` class bug).
- [ ] Cross-user actions verify ownership server-side (corrections self-approval class bug).

## 4. Sessions & tokens

- [ ] Logout/password-change paths revoke Redis sessions (`session:<id>`, `user_session` set) — cookie clearing alone is insufficient.
- [ ] Session lookup binds `session.user.id === JWT subject`.
- [ ] No tokens in JSON response bodies; cookies httpOnly + sane sameSite; CORS origins allowlisted (never `origin:true` + credentials).

## 5. Cache & data lifecycle

- [ ] Every cached read has invalidation in every writer (account/user delete+restore, calendar multi-month, session delete).
- [ ] Deletes cascade or block on references (no orphaned attendance/subscriptions/media files).

## 6. Background work & secrets

- [ ] Puppeteer pages closed in `finally`; empty-result guards before `[0]` indexing.
- [ ] Cron/secret comparisons constant-time, secret in header not URL path, no default secrets (`super`, `ADMIN000`) anywhere.
- [ ] New env vars documented in `.env.example`; never commit real keys (a live Resend key was once committed here).

Run `pnpm typecheck && pnpm lint` after fixes; cite the relevant MODULE_ANALYSIS.md finding when declining a pattern.
