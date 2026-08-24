# saher-backend — Module & Route Specification

This document provides a comprehensive overview of all 14 backend modules in `saher-backend`, detailing what each module does and documenting every mounted API route, HTTP method, authorization level, middleware, and request/response behavior.

---

## Global API Conventions & Architecture

- **Base URL Prefix:** `/api`
- **Authentication:** Standard authentication is cookie-based via `saher_access_token` JWT verified by `protectedRoute`.
- **Authorization:** Admin endpoints enforce `authorize(action, resource)` checks against system permissions.
- **Validation:** Inputs are validated using Zod schemas passed to `validate(schema, source)`.
- **Response Format:** Standardized via `ApiResponse.success(res, { data, message, statusCode })` and thrown `ApiError(statusCode, message)`.

---

## 1. Auth Module (`/api/auth`)

### Overview
Manages user authentication lifecycle, JWT token issuance/refresh, multi-session management in Redis, email verification, password reset, and profile email changes.

### Routes

| Method | Path | Auth / Permission | Middleware / Validation | Description |
|---|---|---|---|---|
| `POST` | `/api/auth/login` | Public | `validate(LoginInputSchema)` | Authenticates user via email and password. Sets HTTP-only access and refresh cookies upon success. |
| `POST` | `/api/auth/logout` | `protectedRoute` | - | Logs out current session, clearing authentication cookies and revoking the Redis session token. |
| `POST` | `/api/auth/refresh-token` | Refresh Cookie | - | Validates refresh token (with 15s rotation grace period) and issues new access/refresh tokens. |
| `GET` | `/api/auth/me` | `protectedRoute` | - | Returns current authenticated user profile, session details, and populated Account information. |
| `GET` | `/api/auth/sessions` | `protectedRoute` | - | Lists all active Redis sessions for the logged-in user. |
| `GET` | `/api/auth/sessions/revoke/:id` | `protectedRoute` | - | Revokes a specific session by its session ID. |
| `POST` | `/api/auth/sessions/revoke-all` | `protectedRoute` | - | Revokes all active sessions for the user across all devices except current. |
| `POST` | `/api/auth/verify-email/request` | `protectedRoute` | - | Sends an email verification request link containing a one-time verification token. |
| `POST` | `/api/auth/verify-email/confirm` | Public | `validate(confirmTokenSchema)` | Verifies the user's email using the submitted token. |
| `POST` | `/api/auth/change-password/request` | `protectedRoute` | - | Initiates password change process by generating a confirmation token. |
| `POST` | `/api/auth/change-password/confirm` | Public | `validate(confirmPasswordSchema)` | Confirms password update with token and updates hashed password in database. |
| `POST` | `/api/auth/forgot-password/request` | Public | - | Initiates password reset for a forgotten password by sending a reset link. |
| `POST` | `/api/auth/forgot-password/confirm` | Public | `validate(confirmPasswordSchema)` | Sets a new hashed password using a valid forgot-password token. |
| `POST` | `/api/auth/change-email/request` | `protectedRoute` | `validate(changeEmailRequestSchema)` | Requests email address change and sends verification token to new email. |
| `POST` | `/api/auth/change-email/confirm` | Public | `validate(confirmTokenSchema)` | Confirms email change token and updates user's primary email. |

---

## 2. Admin Module (`/api/admin`)

### Overview
Handles administrative management tasks: atomic workforce onboarding (User + Account + Bank details creation), employee directory management, bank details management, and user activation/restoration.

### Routes

| Method | Path | Auth / Permission | Middleware / Validation | Description |
|---|---|---|---|---|
| `POST` | `/api/admin/account` | `authorize('write', 'account')` | `validateAsync(accountRegisterSchema)` | Atomically registers new employee with User profile, Account record, and initial Bank details. Sends onboarding email. |
| `GET` | `/api/admin/account/:id` | `protectedRoute` | - | Retrieves account details by account ID. |
| `PUT` | `/api/admin/account/:id` | `authorize('update', 'account')` | `validate(accountUpdateSchema)` | Updates employee account information and invalidates Redis cache. |
| `POST` | `/api/admin/bank` | `authorize('write', 'bank')` | `validate(bankSchema)` | Creates bank details record for an employee. |
| `GET` | `/api/admin/bank/:id` | `protectedRoute` | - | Fetches bank details for specified ID. |
| `PUT` | `/api/admin/bank/:id` | `authorize('update', 'bank')` | `validate(bankUpdateSchema)` | Updates bank information and invalidates associated account caches. |
| `DELETE` | `/api/admin/bank/:id` | `authorize('delete', 'bank')` | - | Deletes bank detail record. |
| `GET` | `/api/admin/users` | `authorize('read', 'user')` | - | Retrieves paginated/searchable list of all employees. |
| `GET` | `/api/admin/user/:id` | `protectedRoute` | - | Fetches specific user record by user ID. |
| `PUT` | `/api/admin/user/:id` | `authorize('update', 'user')` | `validateAsync(userUpdateSchema)` | Updates user record (hashes password if changed) and invalidates cache. |
| `DELETE` | `/api/admin/user/:id` | `authorize('delete', 'user')` | - | Soft-deletes user record. |
| `PATCH` | `/api/admin/user/:id/restore` | `authorize('update', 'user')` | - | Restores a soft-deleted user. |

---

## 3. User Module (`/api/user`)

### Overview
Provides self-service user profile endpoints allowing authenticated users to view/edit their own profile and search for colleagues.

### Routes

| Method | Path | Auth / Permission | Middleware / Validation | Description |
|---|---|---|---|---|
| `GET` | `/api/user` | `protectedRoute` | - | Returns current user's profile and account details. |
| `PUT` | `/api/user` | `protectedRoute` | `validate(userUpdateSchema)` | Updates current user's non-sensitive profile information. |
| `GET` | `/api/user/:keyword` | `protectedRoute` | - | Searches active users by keyword (matches name or email). |

---

## 4. Attendance Module (`/api/attendance`)

### Overview
Core workforce attendance tracking: clock in/out, overtime recording, flexible week-off claims, attendance corrections workflow, holiday management, and automated BullMQ export report generation.

### Routes

| Method | Path | Auth / Permission | Middleware / Validation | Description |
|---|---|---|---|---|
| `GET` | `/api/attendance/me` | `protectedRoute` | - | Gets attendance logs for current user for specified range/month. |
| `GET` | `/api/attendance/today` | `protectedRoute` | - | Gets today's check-in/check-out status for current user. |
| `POST` | `/api/attendance/check-in` | `protectedRoute` | - | Records user check-in with timestamp and location/notes. |
| `POST` | `/api/attendance/check-out` | `protectedRoute` | - | Records user check-out and calculates total working hours. |
| `POST` | `/api/attendance/overtime/check-in` | `protectedRoute` | - | Logs overtime check-in entry. |
| `POST` | `/api/attendance/weekoff` | `protectedRoute` | - | Claims flexible week-off day. |
| `PATCH` | `/api/attendance/` | `protectedRoute` | `validate(rejectMarkSchema)` | Rejects/overrides an invalid attendance mark entry. |
| `GET` | `/api/attendance/retrieve/:id` | `protectedRoute` | - | Retrieves attendance records for target user ID. |
| `GET` | `/api/attendance/retrieve` | `protectedRoute` | - | Admin/Manager query to retrieve user attendance listings. |
| `GET` | `/api/attendance/user/:id` | `protectedRoute` | - | Detailed attendance history query for user. |
| `GET` | `/api/attendance/record/:id` | `protectedRoute` | - | Fetches a single attendance record by ID. |
| `GET` | `/api/attendance/correction/:id` | `protectedRoute` | - | Fetches attendance correction request by ID. |
| `GET` | `/api/attendance/admin/correction` | `protectedRoute` | - | Lists all pending/processed attendance correction requests. |
| `POST` | `/api/attendance/correction` | `authorize('write', 'attendance-correction')` | `validate(attendanceCorrectionSchema)` | Submits an attendance correction request. |
| `PUT` | `/api/attendance/correction/:id` | `authorize('update', 'attendance-correction')` | `validate(attendanceCorrectionHandleSchema)` | Approves or rejects an attendance correction request. |
| `GET` | `/api/attendance/holiday` | `protectedRoute` | - | Retrieves list of official holidays. |
| `GET` | `/api/attendance/holiday/:id` | `protectedRoute` | - | Retrieves single holiday entry by ID. |
| `POST` | `/api/attendance/holiday` | `authorize('write', 'holiday')` | `validate(holidaySchema)` | Creates a new holiday record. |
| `PUT` | `/api/attendance/holiday/:id` | `authorize('update', 'holiday')` | `validate(holidayUpdateSchema)` | Updates holiday details. |
| `DELETE` | `/api/attendance/holiday/:id` | `authorize('delete', 'holiday')` | - | Deletes holiday entry. |
| `GET` | `/api/attendance/export/report` | `protectedRoute` | - | Enqueues BullMQ background job to generate PDF/Excel attendance report. |
| `GET` | `/api/attendance/download/:fileName` | `protectedRoute` | - | Downloads generated attendance report file. |

---

## 5. Events Module (`/api/events`)

### Overview
Manages NGO programs, workshops, sessions, participants, and session attendance tracking, including reminder notifications.

### Routes

| Method | Path | Auth / Permission | Middleware / Validation | Description |
|---|---|---|---|---|
| `GET` | `/api/events/programs` | `authorize('read', 'event')` | - | Lists all programs. |
| `GET` | `/api/events/programs/:id` | `authorize('read', 'event')` | - | Gets single program by ID. |
| `POST` | `/api/events/programs` | `authorize('write', 'event')` | `validate(createProgramSchema)` | Creates a new program. |
| `PUT` | `/api/events/programs/:id` | `authorize('update', 'event')` | `validate(updatedProgramSchema)` | Updates program details. |
| `DELETE` | `/api/events/programs/:id` | `authorize('delete', 'event')` | - | Soft-deletes a program. |
| `PATCH` | `/api/events/programs/restore/:id` | `authorize('update', 'event')` | `underDevelopment` | Restores soft-deleted program. |
| `GET` | `/api/events/workshops` | `authorize('read', 'event')` | - | Lists workshops. |
| `GET` | `/api/events/workshops/:workshopId` | `authorize('read', 'event')` | - | Gets workshop by ID. |
| `POST` | `/api/events/workshops/:programId` | `authorize('write', 'event')` | `validate(createWorkshopSchema)` | Adds workshop under a program. |
| `PUT` | `/api/events/workshops/:id` | `authorize('update', 'event')` | `validate(updatedWorkshopSchema)` | Updates workshop. |
| `DELETE` | `/api/events/workshops/:id` | `authorize('delete', 'event')` | - | Soft-deletes workshop. |
| `PATCH` | `/api/events/workshops/restore/:id` | `authorize('update', 'event')` | `underDevelopment` | Restores soft-deleted workshop. |
| `GET` | `/api/events/sessions` | `authorize('read', 'event')` | - | Lists sessions. |
| `GET` | `/api/events/sessions/:sessionId` | `authorize('read', 'event')` | - | Gets single session details. |
| `POST` | `/api/events/sessions/:programId` | `authorize('write', 'event')` | `validate(createSessionSchema)` | Creates session for a program. |
| `PUT` | `/api/events/sessions/:id` | `authorize('update', 'event')` | `validate(updatedSessionSchema)` | Updates session. |
| `DELETE` | `/api/events/sessions/:id` | `authorize('delete', 'event')` | - | Soft-deletes session. |
| `PATCH` | `/api/events/sessions/restore/:id` | `authorize('update', 'event')` | `underDevelopment` | Restores soft-deleted session. |
| `GET` | `/api/events/participants` | `authorize('read', 'event')` | - | Lists event participants. |
| `GET` | `/api/events/participants/:id` | `authorize('read', 'event')` | - | Gets participant details by ID. |
| `POST` | `/api/events/participants` | `authorize('write', 'event')` | `validate(participantSchema)` | Creates participant record. |
| `PUT` | `/api/events/participants/:id` | `authorize('update', 'event')` | `validate(updatedParticipantSchema)` | Updates participant record. |
| `DELETE` | `/api/events/participants/:id` | `authorize('delete', 'event')` | - | Soft-deletes participant. |
| `PATCH` | `/api/events/participants/restore/:id` | `authorize('update', 'event')` | `underDevelopment` | Restores soft-deleted participant. |
| `POST` | `/api/events/attendance/sessions/:sessionId` | `authorize('write', 'event')` | `validate(SessionAttendanceSchema)` | Marks session attendance for participants. |
| `PUT` | `/api/events/attendance/sessions/:sessionId` | `authorize('update', 'event')` | `validate(SessionAttendanceSchema)` | Updates session attendance. |
| `DELETE` | `/api/events/attendance/sessions/:sessionId` | `authorize('delete', 'event')` | `validate(SessionAttendanceSchema)` | Removes session attendance. |
| `GET` | `/api/events/programs/participants/:programId` | `authorize('read', 'event')` | - | Lists participants registered for program. |
| `POST` | `/api/events/programs/participants/:programId` | `authorize('write', 'event')` | `validate(addParticipantsToProgramSchema)` | Adds participants to program. |
| `DELETE` | `/api/events/programs/participants/:programId/:participantId` | `authorize('delete', 'event')` | - | Removes participant from program. |
| `GET` | `/api/events/programs/workshops/sessions/:sessionId` | `authorize('read', 'event')` | - | Sends reminder notification for session. |

---

## 6. Reimbursement Module (`/api/reimbursement`)

### Overview
Handles expense reimbursement claims, pre-reimbursement & post-reimbursement flows, bill approval/rejection/hold management, settlement processing, audit logging, and balance enquiries.

### Routes

| Method | Path | Auth / Permission | Middleware / Validation | Description |
|---|---|---|---|---|
| `POST` | `/api/reimbursement/bill` | `authorize('write', 'postReimbursement')` | `validate(userBillCreateSchema)` | Submits a new expense bill claim with receipt images. Invalidates user cache. |
| `PATCH` | `/api/reimbursement/:billId` | `authorize('update', 'postReimbursement')` | `validate(userBillUpdateSchema)` | Updates a pending bill claim. Invalidates user cache. |
| `DELETE` | `/api/reimbursement/:billId` | `authorize('delete', 'postReimbursement')` | - | Soft-deletes a pending bill claim. Invalidates user cache. |
| `POST` | `/api/reimbursement/admin/:user` | `authorize('write', 'preReimbursement')` | `validate(adminBillCreatSchema)` | Admin endpoint to create advance bill for a user. |
| `PATCH` | `/api/reimbursement/admin/:billId` | `authorize('update', 'preReimbursement')` | `validate(adminBillUpdateSchema)` | Admin endpoint to update advance bill details. |
| `DELETE` | `/api/reimbursement/admin/:billId` | `authorize('delete', 'preReimbursement')` | - | Admin endpoint to soft-delete bill. |
| `POST` | `/api/reimbursement/handle/:billId` | `authorize('write', 'preReimbursement')` | `validate(handleBillSchema)` | Approves, rejects, or puts bill on hold. Creates settlement record on approval. |
| `POST` | `/api/reimbursement/settlement/:settleId` | `authorize('write', 'preReimbursement')` | `validate(handleSettleSchema)` | Processes settlement payment request (e.g., via UPI/bank transfer). |
| `GET` | `/api/reimbursement/mybills` | `protectedRoute` | - | Gets Redis-cached list of current user's bills. |
| `GET` | `/api/reimbursement/recyclebills` | `authorize('read', 'preReimbursement')` | - | Admin listing of soft-deleted bills. |
| `GET` | `/api/reimbursement/audit-log` | `authorize('read', 'preReimbursement')` | - | Retrieves reimbursement audit logs. |
| `POST` | `/api/reimbursement/create-log` | `authorize('write', 'preReimbursement')` | `validate(createLogSchema)` | Adds an audit log entry. |
| `GET` | `/api/reimbursement/balance-enquiry` | `protectedRoute` | - | Summarizes total advance, pocket expenses, and net balance for current user. |
| `GET` | `/api/reimbursement/bills` | `authorize('write', 'preReimbursement')` | - | Admin route retrieving all bills in system. |
| `GET` | `/api/reimbursement/` | `authorize('read', 'preReimbursement')` | - | Searches bills by description, amount, date, or user filters. |
| `GET` | `/api/reimbursement/:billId` | `authorize('read', 'preReimbursement')` | - | Retrieves single bill details by bill ID. |
| `GET` | `/api/reimbursement/:id` | `authorize('read', 'preReimbursement')` | - | Searches settlement bill by settlement ID. |

---

## 7. Payroll Module (`/api/payroll`)

### Overview
Admin-only payroll management module for automated monthly payroll cron generation, salary calculations, installment payment tracking, and user payroll queries.

### Routes

| Method | Path | Auth / Permission | Middleware / Validation | Description |
|---|---|---|---|---|
| `POST` | `/api/payroll/cron` | `authorize('write', 'payroll')` | - | Triggers payroll leave and salary calculation cron job manually. |
| `PUT` | `/api/payroll/:id` | `authorize('update', 'payroll')` | `validate(createPayrollSchema)` | Records salary payment installment or status update. Accumulates paid amounts. |
| `GET` | `/api/payroll` | `authorize('read', 'payroll')` | - | Gets paginated list of all payroll records across employees. |
| `GET` | `/api/payroll/user/:id` | `authorize('read', 'payroll')` | - | Gets payroll history for specified user ID. |
| `GET` | `/api/payroll/:id` | `authorize('read', 'payroll')` | - | Retrieves single payroll record by payroll ID. |

---

## 8. Notification Module (`/api/notification`)

### Overview
Broadcasting system for user notifications, unread counters, in-app notifications, and Web Push (VAPID) subscription management.

### Routes

| Method | Path | Auth / Permission | Middleware / Validation | Description |
|---|---|---|---|---|
| `GET` | `/api/notification` | `protectedRoute` | `validate(notificationListQuerySchema, 'query')` | Gets paginated notification feed for current user. |
| `GET` | `/api/notification/un-seen` | `protectedRoute` | - | Gets count and list of unseen notifications for user. |
| `POST` | `/api/notification` | `authorize('write', 'notification')` | `validate(sendNotificationSchema)` | Broadcasts or targets notifications to users/roles (Managers only). |
| `PATCH` | `/api/notification/:id` | `protectedRoute` | - | Marks a notification as seen for current user (IDOR protected). |
| `POST` | `/api/notification/subscribe` | `protectedRoute` | - | Registers Web Push VAPID subscription object. |
| `POST` | `/api/notification/enable` | `protectedRoute` | - | Enables web push notifications for user session. |
| `POST` | `/api/notification/disable` | `protectedRoute` | - | Disables web push notifications. |

---

## 9. Mail Module (`/api/mail`)

### Overview
Internal mailing system for sending messages between platform users, viewing inbox/outbox, automatic XSS sanitization, and sending instant notification alerts.

### Routes

| Method | Path | Auth / Permission | Middleware / Validation | Description |
|---|---|---|---|---|
| `GET` | `/api/mail` | `protectedRoute` | `validate(mailListQuerySchema, 'query')` | Retrieves current user's received inbox messages with pagination. |
| `POST` | `/api/mail` | `authorize('write', 'mail')` | `validate(sendMailSchema)` | Sends an internal mail message to target recipients. |
| `GET` | `/api/mail/outbox` | `protectedRoute` | `validate(mailListQuerySchema, 'query')` | Retrieves current user's sent outbox messages. |

---

## 10. Notice Module (`/api/notice`)

### Overview
Organization noticeboard module for publishing company-wide announcements with automatic or explicit expiry dates.

### Routes

| Method | Path | Auth / Permission | Middleware / Validation | Description |
|---|---|---|---|---|
| `GET` | `/api/notice/notice` | `protectedRoute` | `underDevelopment` | Fetches active (non-expired) notices. |
| `POST` | `/api/notice/notice` | `protectedRoute` | `underDevelopment`, `validate(createNoticeSchema)` | Creates a new announcement notice (defaults to 7-day expiry). |
| `PUT` | `/api/notice/notice/:id` | `protectedRoute` | `underDevelopment`, `validate(updateNoticeSchema)` | Updates title/content of an existing notice. |
| `DELETE` | `/api/notice/notice/:id/permanent` | `protectedRoute` | `underDevelopment` | Permanently deletes a notice. |

---

## 11. Calendar Module (`/api/calendar`)

### Overview
Aggregates company events, holidays, and workshops into a single unified monthly calendar view with CRUD operations for calendar events.

### Routes

| Method | Path | Auth / Permission | Middleware / Validation | Description |
|---|---|---|---|---|
| `GET` | `/api/calendar/:year/:month` | `protectedRoute` | - | Aggregates and returns holidays, sessions, and custom calendar events for month. |
| `POST` | `/api/calendar/sync-holidays` | `protectedRoute` | - | Syncs public holidays from Google Calendar API. |
| `POST` | `/api/calendar/event` | `protectedRoute` | `validate(createCalendarEventSchema)` | Creates a custom calendar event and invalidates calendar cache. |
| `PUT` | `/api/calendar/event/:id` | `protectedRoute` | `validate(updateCalendarEventSchema)` | Updates a calendar event. |
| `DELETE` | `/api/calendar/event/:id` | `protectedRoute` | - | Deletes a calendar event. |

---

## 12. Leave Module (`/api/leave`)

### Overview
Employee leave management: defining leave types (paid, casual, sick, paternity, etc.), submitting leave applications with proof, overlap validation, approval workflow, and balance calculation.

### Routes

| Method | Path | Auth / Permission | Middleware / Validation | Description |
|---|---|---|---|---|
| `POST` | `/api/leave/type` | `authorize('write', 'leaveType')` | `validate(createLeaveTypeSchema)` | Creates a new leave type definition. |
| `PUT` | `/api/leave/type/:id` | `authorize('update', 'leaveType')` | `validate(updateLeaveTypeSchema)` | Updates leave type properties. |
| `GET` | `/api/leave/type` | `protectedRoute` | - | Gets list of active leave types. |
| `POST` | `/api/leave/application/apply` | `authorize('write', 'leave')` | `validate(createLeaveApplicationSchema)` | Submits a leave application (validates date overlaps and proof). |
| `PUT` | `/api/leave/application/review/:id` | `authorize('update', 'leave')` | `validate(reviewLeaveApplicationSchema)` | Approves or rejects a pending leave application. |
| `PUT` | `/api/leave/application/update/:id` | `authorize('update', 'leave')` | `validate(updateLeaveApplicationSchema)` | Updates a pending leave application (excludes current application from overlap check). |
| `GET` | `/api/leave/application` | `protectedRoute` | - | Lists leave applications for current user. |
| `GET` | `/api/leave/application/all` | `protectedRoute` | - | Lists leave applications for all employees (Manager/Admin). |
| `GET` | `/api/leave/balance` | `protectedRoute` | - | Calculates remaining leave balances for current user. |

---

## 13. Upload Module (`/api/upload`)

### Overview
Authenticated file uploads via Multer memory storage. Images are normalized to WebP (max width 1024) with Sharp; documents are stored as-is. Every upload creates a `Media` record and returns its id for embedding in other payloads (bills, sessions, participants).

| Method | Path | Auth / Permission | Middleware / Validation | Description |
|---|---|---|---|---|
| `GET` | `/api/upload` | `protectedRoute` | - | Health check for the upload service (plain string body). |
| `POST` | `/api/upload/image` | `protectedRoute` | `uploadImage.single('image')` | Upload one image. Fields: `image` (file; png/jpg/jpeg/webp/avif, ≤5 MB) + `name` (alt text). Converts to WebP, returns `{ id, fileName, url, size, width, height, mimetype }`. |
| `POST` | `/api/upload/images` | `protectedRoute` | `uploadImage.array('images', 10)` | Upload up to 10 images at once (same formats/limits). Alt falls back to each file's original name. Returns array without width/height. Any failure removes already-written files. |
| `POST` | `/api/upload/document` | `protectedRoute` | `uploadDocument.single('document')` | Upload one document. Fields: `document` (file; pdf/doc/docx/ppt/pptx/xls/xlsx, ≤10 MB) + `name`. Returns `{ id, fileName, url, size, mimetype }`. |
| `POST` | `/api/upload/documents` | `protectedRoute` | `uploadDocument.array('documents', 10)` | Upload up to 10 documents (same formats/limits). Returns array; atomic cleanup on failure. |

Oversize files return `413 { message: "File Too Large." }`; wrong type returns `400 File Validation Failed.`

---

## 14. Public & Cron Module (`/api`)

### Overview
Unauthenticated infrastructure endpoints: service health checks and secret-protected cron job triggers for automated attendance row creation and auto-checkout.

### Routes

| Method | Path | Auth / Permission | Middleware / Validation | Description |
|---|---|---|---|---|
| `GET` | `/api/health` | Public | - | Health check verifying MongoDB connection status (returns 200 Healthy / 503 Unhealthy). |
| `POST` | `/api/cron/create-attendance` | Cron Secret | `requireCronSecret` | Triggers daily attendance document creation for active employees. Requires `Authorization: Bearer <CRON_SECRET>` header. |
| `POST` | `/api/cron/auto-checkout` | Cron Secret | `requireCronSecret` | Triggers auto-checkout processing for un-checked-out attendance records. |

---

## Verification & Health Check

All 14 modules and their routes have been verified against the codebase:
- `pnpm typecheck`: Clean (0 TypeScript errors)
- `pnpm lint`: Clean (0 ESLint errors)
- `pnpm docs:lint`: OpenAPI 3.1 schema valid
- `pnpm run docs:build`: `docs/index.html` built successfully
- `pnpm vitest run`: **15 test files passed, 233 tests passed**
