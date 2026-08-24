# FRONTEND-HANDBOOK — saher-backend integration guide

Everything a frontend (Next.js) agent needs to integrate with this API without reading
backend source. Canonical, always-current contract: **OpenAPI docs at `/docs`** (Redoc,
built from `openapi/openapi.yaml`). This handbook covers the conventions the schema can't show.

## 1. Base URL & proxying

- All requests go through nginx: same origin as the frontend. API lives under **`/api`**.
  Example: `fetch('/api/events/workshops', { credentials: 'include' })`.
- No CORS juggling needed in production (same origin). Local dev: run backend on :4000
  and either proxy `/api` from Next.js or set `CORS_ORIGINS=http://localhost:3000` in backend env.
- Generated report files and the Redoc page are served by the backend under `/docs`, `/temp`, root statics.

## 2. Auth — cookie session

- Login: `POST /api/auth/login` → sets httpOnly cookies:
  `saher_access_token`, `saher_refresh_token`, `saher_session_id`. Frontend never touches tokens.
- Send cookies on every request: `credentials: 'include'` (or same-origin default).
- Access token expires quickly → on 401 with message `Invalid Session.` call
  `POST /api/auth/refresh-token` (cookie-driven) once, then retry. Logout: `POST /api/auth/logout`.
- Current user: `GET /api/auth/me`.

## 3. Response envelope (every endpoint)

Success (`formatMessage` Title-Cases messages):

```json
{ "success": true, "message": "Workshops Fetched Successfully", "data": [...], "meta": { "page":1, "limit":10, "count":42, "total":5 } }
```

- `data` is `null` when there is nothing to return; list endpoints return `[]`, not null.
- `meta` only appears on paginated lists: `{ page, limit, count, total|totalPages }`
  (events use `total`; reimbursement uses `totalPages` — treat both as "page count").
- Error shape comes from the global handler:

```json
{ "success": false, "message": "Human readable reason", "stack": {} }
```

Match on HTTP status + `success:false`; surface `message` to users.

## 4. RBAC — what each role may call

`authorize(action, resource)` guards admin-ish routes. Actions: `read | write | update | delete`.

| Resource | Who (beyond owner-reads) |
|---|---|
| event (programs/workshops/sessions/participants) | manager+admin: write/update/delete; read passes any authenticated user |
| bank | manager holds write+update; admin read-only; nobody deletes |
| holiday / attendance-correction / payroll / preReimbursement | admin (write/update/delete per route) |
| postReimbursement (own bills) | the owning user |
| user management | admin |

403 body: `"You do not have permission to <action> this <resource>."` Hide UI affordances accordingly.

## 5. Soft delete & restore (all business resources)

- Nothing is ever hard-deleted (except push-subscription device cleanup).
- List GETs accept **`?isDeleted=true|false`** (default `false`) — events modules, bills search,
  my-bills. `true` = trash view.
- Restore pattern: **`PATCH <resource>/restore/{id}`** (events, calendar `/calendar/event/restore/{id}`,
  attendance `/attendance/holiday/{id}/restore`, notice `/notice/{id}/restore`,
  admin bank `/admin/bank/restore/{id}`, admin user `/admin/user/:id/restore`).
- Restoring a live record or deleting a deleted one → `404`.
- Trash UX: fetch with `isDeleted=true`, offer Restore button hitting the PATCH.

## 6. Domain map (path prefix → feature)

| Prefix | Feature |
|---|---|
| `/api/auth` | login/logout/refresh/me/sessions/password & email flows |
| `/api/admin` | bank, accounts, users (+restore) |
| `/api/user` | self profile, colleague search |
| `/api/attendance` | check-in/out, overtime, corrections, holidays(+restore), export reports |
| `/api/events` | programs/workshops/sessions/participants CRUD + restore, session attendance, reminder, export |
| `/api/reimbursement` | bills lifecycle (create→handle→settle), recycle, balance enquiry, search |
| `/api/payroll` | cron generation, approve, pay installments |
| `/api/leave` | types, applications, balances |
| `/api/calendar` | month aggregation (holidays+sessions+events), custom events(+restore), google sync |
| `/api/notification` | feed, unseen count, mark-seen, web-push subscribe/enable/disable |
| `/api/mail` | inbox/outbox |
| `/api/notice` | noticeboard CRUD (+soft delete/restore) |
| `/api/upload` | image/document uploads (multipart) → returns Media ids used in other payloads |

## 7. Dates are IST

The org operates in IST (`Asia/Kolkata`). Backend day-windows and payroll/attendance boundaries
are computed in IST. Send ISO-8601 with offset (`2026-09-01T10:00:00+05:30`); render received
Date strings with an IST-aware formatter to avoid off-by-one-day bugs.

## 8. Notifications & download actions

Notification documents carry an optional `action` object the UI should render as a button:

```json
{ "type": "download", "label": "Report", "url": "/api/attendance/download/<file>", "method": "GET" }
```

Poll `GET /api/notification/un-seen` for badges; long-running exports (PDF/Excel) enqueue a job
(`GET .../export/report` returns immediately) and the finished link arrives as a notification action.

## 9. Uploads

`POST /api/upload/image` (field `image`), plus document variants — multipart/form-data.
Responses return a Media id; embed that id in `images` arrays of bills/sessions/participants.

## 10. Quick smoke checklist for the frontend agent

1. Login → cookies set → `/api/auth/me` returns profile.
2. Any list GET without params returns page 1 of active records only.
3. A 401 triggers exactly one refresh attempt before redirecting to login.
4. Export flow: call export endpoint → toast "check notifications" → notification arrives with download URL.
