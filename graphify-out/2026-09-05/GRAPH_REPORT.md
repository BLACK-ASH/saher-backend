# Graph Report - saher-backend  (2026-08-24)

## Corpus Check
- 325 files · ~109,031 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1773 nodes · 3983 edges · 192 communities (134 shown, 58 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 166 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5f5287c6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- settlement/schema.ts
- person.ts
- normalizeDoc
- events.test.ts
- saher-backend — Module & Route Specification
- dependencies
- account.model.ts
- upload.routes.ts
- search-bill.controller.ts
- scripts
- calender.controller.ts
- leave.controller.ts
- exportReportController
- standardDateString
- compilerOptions
- saher-dev OpenCode Agent
- authorize.ts
- auth.routes.ts
- admin.routes.ts
- Saher Community Code of Conduct
- Fix Report — running summary
- ApiError
- notice.controller.ts
- eslint-config-prettier
- eslint-plugin-import
- Test Plan & Coverage Tracker — saher-backend
- Architecture
- husky
- lint-staged
- devDependencies
- tsx
- @types/bcrypt
- @types/cookie-parser
- @types/cors
- @types/estree
- _services/account.ts
- @types/jsonwebtoken
- @types/multer
- Test Plan — attendance module
- program.schema.ts
- @types/web-push
- typescript
- Coding Conventions
- @typescript-eslint/parser
- no-res-json.ts
- Dev Deploy CI Pipeline
- Tasks
- pnpm allowBuilds Native Build Allowlist
- Redocly Docs Config
- Vulnerability Reporting Policy
- Phase 04: Session Export, Reporting & Attendance Refinement - Research
- .success
- events.routes.ts
- reimbursement.routes.ts
- External Integrations
- Technology Stack
- Fix plan — Cross-cutting concerns
- package.json
- Fix plan — `src/attendance`
- Fix plan — `src/libs`
- saher-backend — agent notes
- README.md
- saher-backend — Module-wise Fix Plans
- Fix plan — `src/admin`
- Fix plan — `src/auth`
- Fix plan — `src/calendar`
- Fix plan — `src/database`
- Fix plan — `src/events`
- Fix plan — `src/mail`
- Fix plan — `src/notification`
- Fix plan — `src/public` + cron trigger security
- Fix plan — `src/seeds`
- Fix plan — `src/types`
- Fix plan — `src/upload`
- Fix plan — `src/user`
- Fix plan — `src/worker`
- Fix plan — Entrypoints (`src/index.ts`, `src/worker/index.ts`)
- Phase 2: Attendance Export — Excel Format & One-Day Temporary Storage - Research
- user.model.ts
- Phase 03: Attendance-Leave-Verification-Payroll - Research
- Testing Patterns
- express-rate-limit
- Test Plan — `auth` & `permission`
- Codebase Concerns
- puppeteer-core
- redis
- Phase 2: Attendance Excel Export & Temp Storage - Context
- Codebase Structure
- redis-client.ts
- web-push
- Phase 2: Attendance Export — Excel Format - Pattern Map
- pino-pretty
- prettier
- @types/dompurify
- @typescript-eslint/eslint-plugin
- @js-temporal/polyfill
- Phase 03 Plan 01: Payroll Approval Workflow Summary
- prom-client
- mongodb-memory-server
- pino
- Phase 2 — Validation Strategy
- supertest
- notification.controllers.ts
- attendance-report.ts
- @redocly/cli
- @types/jsdom
- @types/node
- @types/pino-http
- participant.schema.ts
- @types/supertest
- Phase 01 Summary: Expand File Upload Support
- vitest
- @vitest/coverage-v8
- Phase 01: Expand File Upload Support — Verification Report
- Phase 07: Plan — Soft-Delete-Aware GETs, Search Consistency & OpenAPI
- Tasks
- Roadmap
- attendance.test.ts
- ua-parser-js
- typescript-eslint
- Architecture Patterns
- Common Pitfalls
- Validation Architecture
- Standard Stack
- Current State Map (verified, file:line refs)
- Sources
- Security Domain
- Code Examples
- workshop.controller.ts
- worker/session-report.ts
- cookie-parser
- Phase 06: Plan — Soft Delete + Restore Everywhere
- jsdom
- mongoose
- jsonwebtoken
- sharp
- eslint
- deferred-items.md
- Phase 08: Plan — Production Compose Support & Frontend Handbook
- FRONTEND-HANDBOOK — saher-backend integration guide
- Plan 04-02: Session Attendance Report Export (PDF/Excel via BullMQ)
- Phase 06: Hard-Delete Audit — Context
- Phase 07: Soft-Delete GETs, Search Consistency & OpenAPI — Context
- 03-01-PLAN.md
- 03-02-PLAN.md
- Phase 03 Plan 02: Attendance-Leave-Verification-Payroll Summary
- exceljs
- Phase 04: Session Export, Reporting & Attendance Refinement
- Task 1: Remove `underDevelopment` from restore routes
- create-audit-log.controller.ts
- auth.test.ts
- Phase 05: Reimbursement Module Audit & Bill Export
- Phase 05: Reimbursement Module Audit & Bill Export Research
- Phase 08: Production Compose Support & Frontend Handbook — Context
- Phase 06: Research — Hard-Delete Audit
- Phase 07: Research
- app.ts
- Phase 05: Plan - Reimbursement Audit, Balance Integrity & Bill Export
- Phase 05: Research - Reimbursement Audit, Balance Integrity & Bill Export
- Phase 05: Validation Strategy
- Phase 06 SUMMARY — Hard-Delete Audit
- Phase 07 SUMMARY — Soft-Delete GETs, Search Consistency & OpenAPI
- Phase 08 SUMMARY — Production Compose Support & Frontend Handbook
- Phase 08: Research
- escapeHtml
- bcrypt
- @commitlint/config-conventional
- 04-events-module-enhancements/04-CONTEXT.md
- worker/bill-report.ts
- session.controller.ts
- utils/notification.ts
- user.ts
- session.schema.ts
- export/bill-report.ts
- cleanup.ts
- date-time.ts
- Phase 05 SUMMARY — Reimbursement Audit, Balance Integrity & Bill Export
- cron-secret.ts
- cors
- cspell

## God Nodes (most connected - your core abstractions)
1. `createKey()` - 106 edges
2. `normalizeDoc()` - 85 edges
3. `ApiError` - 79 edges
4. `ApiResponse` - 71 edges
5. `deleteCache()` - 66 edges
6. `setCache()` - 41 edges
7. `getCache()` - 37 edges
8. `standardDateString()` - 31 edges
9. `Fix Report — running summary` - 26 edges
10. `User` - 24 edges

## Surprising Connections (you probably didn't know these)
- `createUser()` --calls--> `hashPassword()`  [EXTRACTED]
  tests/auth/auth.test.ts → src/libs/utils/password-hash.ts
- `createFullAccount()` --calls--> `hashPassword()`  [EXTRACTED]
  tests/helpers/account.ts → src/libs/utils/password-hash.ts
- `mkUserOnly()` --calls--> `hashPassword()`  [EXTRACTED]
  tests/helpers/person.ts → src/libs/utils/password-hash.ts
- `Saher Community Code of Conduct` --conceptually_related_to--> `Saher Backend Project README`  [INFERRED]
  CODE_OF_CONDUCT.md → README.md
- `mkProgramWithSpeaker()` --calls--> `mkPerson()`  [EXTRACTED]
  tests/events/events.test.ts → tests/helpers/person.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Project Governance Docs** — readme_saher_backend_project_stub, security_md_vulnerability_reporting_policy, code_of_conduct_community_code_of_conduct [INFERRED 0.75]
- **OpenCode Agent Tooling Config** — _opencode_agent_saher_dev_saher_dev_agent, _opencode_skill_add_module_skill_add_module_recipe, _opencode_skill_backend_dev_skill_backend_dev_workflow, _opencode_skill_security_review_skill_security_audit_checklist [INFERRED 0.85]

## Communities (192 total, 58 thin omitted)

### Community 0 - "settlement/schema.ts"
Cohesion: 0.22
Nodes (8): createSettleSchema, handleBillSchema, HandleBillSchemaInputType, HandleCreateSchemaInputType, handleSettleSchema, HandleSetttleSchemaInputType, SettlementSchemaInputType, settleSchema

### Community 1 - "person.ts"
Cohesion: 0.17
Nodes (13): app, meadiaSchema, Media, MediaType, mediaIds(), registrationBody(), createFullAccount(), cookieOf() (+5 more)

### Community 2 - "normalizeDoc"
Cohesion: 0.09
Nodes (35): getUser(), getAllAttendanceCorrectionController(), getAttendanceCorrectionController(), attendanceChangesSchema, AttendanceCorrectionHandleInputType, attendanceCorrectionHandleSchema, AttendanceCorrectionInputType, AttendanceCorrectionResponse (+27 more)

### Community 3 - "events.test.ts"
Cohesion: 0.12
Nodes (19): Participant, participantSchema, ParticipantType, Program, programSchema, ProgramType, attendanceSchema, Session (+11 more)

### Community 4 - "saher-backend — Module & Route Specification"
Cohesion: 0.04
Nodes (45): 10. Notice Module (`/api/notice`), 11. Calendar Module (`/api/calendar`), 12. Leave Module (`/api/leave`), 13. Upload Module (`/api/upload`), 14. Public & Cron Module (`/api`), 1. Auth Module (`/api/auth`), 2. Admin Module (`/api/admin`), 3. User Module (`/api/user`) (+37 more)

### Community 5 - "dependencies"
Cohesion: 0.11
Nodes (19): bullmq, dompurify, dotenv, express, googleapis, multer, dependencies, bullmq (+11 more)

### Community 6 - "account.model.ts"
Cohesion: 0.21
Nodes (11): Account, accountSchema, AccountType, EmployeeType, employeeTypeList, Bank, bankSchema, BankType (+3 more)

### Community 7 - "upload.routes.ts"
Cohesion: 0.13
Nodes (15): uploadBulkDocumentsController(), uploadDocumentController(), storage, supportedFileMimeType, uploadDocument, saveDocument(), uploadPath, uploadBulkImagesController() (+7 more)

### Community 8 - "search-bill.controller.ts"
Cohesion: 0.19
Nodes (12): buildKeywordOrConditions(), escapeRegex(), dateField, getBillResponseSchema, GetBillResponsiveSchemaInputType, getSettleBillResponseSchema, GetSettleBillResponsiveSchemaInputType, searchBillQuerySchema (+4 more)

### Community 9 - "scripts"
Cohesion: 0.11
Nodes (18): scripts, build, clean, dev, dev:worker, docs:build, docs:dev, docs:lint (+10 more)

### Community 10 - "calender.controller.ts"
Cohesion: 0.12
Nodes (27): holidayUpdateSchema, calendarRouter, createCalendarEventSchema, event, EventT, eventType, updateCalendarEventSchema, createCalendarEventController() (+19 more)

### Community 11 - "leave.controller.ts"
Cohesion: 0.08
Nodes (38): LeaveBalance, leaveBalanceSchema, leaveActionTypes, LeaveLog, leaveLogSchema, Leave, leaveSchema, LeaveTypes (+30 more)

### Community 12 - "exportReportController"
Cohesion: 0.22
Nodes (6): exportReportController(), BaseOptions, CustomOptions, DateRange, DateRangeResult, LastDaysOptions

### Community 13 - "standardDateString"
Cohesion: 0.19
Nodes (17): retrieveCustomAttendace(), retrieveTypeMonthAttendance(), retrieveTypeTodayAttendance(), retrieveTypeWeekAttendance(), retrieveTypeYearAttendance(), createAttendanceCron(), claimFlexibleWeekOffController(), retrieveAttendanceController() (+9 more)

### Community 14 - "compilerOptions"
Cohesion: 0.12
Nodes (15): node, src, src/payroll/update-payroll.controller.ts, compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution (+7 more)

### Community 15 - "saher-dev OpenCode Agent"
Cohesion: 0.50
Nodes (4): saher-dev OpenCode Agent, Add Module Recipe Skill, Backend Dev Workflow Skill, Security Review Checklist Skill

### Community 16 - "authorize.ts"
Cohesion: 0.07
Nodes (37): Mail, mailSchema, Mailtype, Payroll, payrollSchema, PayrollType, salaryMode, salaryStatus (+29 more)

### Community 17 - "auth.routes.ts"
Cohesion: 0.10
Nodes (26): authRouter, loginController(), LoginInputSchema, LoginInputType, logoutController(), COOKIE_OPTIONS, refreshController(), changeEmailRequestSchema (+18 more)

### Community 18 - "admin.routes.ts"
Cohesion: 0.12
Nodes (22): accountGetController(), accountRegisterController(), accountUpdateController(), accountBaseSchema, AccountRegisterInput, accountRegisterSchema, accountSchema, AccountUpdateInput (+14 more)

### Community 20 - "Fix Report — running summary"
Cohesion: 0.07
Nodes (26): 00-cross-cutting ✅ — commit `72c33ac` (branch `fix/module-fixes`, 2026-08-22), 01-admin ✅ — branch `fix/module-fixes`, 2026-08-22, 02-attendance ✅ (Chunks A–D) — branch `fix/module-fixes`, 2026-08-22, 03-auth ✅ — branch `fix/module-fixes`, 2026-08-22, 04-calendar ✅ — branch `fix/module-fixes`, 2026-08-22, 05-database ✅ (+ 01-admin CRIT completion) — branch `fix/module-fixes`, 2026-08-22, 06-events ✅ — branch `fix/module-fixes`, 2026-08-22, 07-libs ✅ — branch `fix/module-fixes`, 2026-08-22 (+18 more)

### Community 21 - "ApiError"
Cohesion: 0.14
Nodes (21): getAccount(), bankSchemaFinal, BankT, attendanceReportQueue, attendanceListSchema, fetchSessionForJob(), sessionReportQueue, sessionReportWorkerHandler() (+13 more)

### Community 22 - "notice.controller.ts"
Cohesion: 0.13
Nodes (19): Notice, noticeSchema, NoticeType, underDevelopment(), addNotice(), deleteNotice(), editNotice(), getNotices() (+11 more)

### Community 25 - "Test Plan & Coverage Tracker — saher-backend"
Cohesion: 0.11
Nodes (17): Approach, Bugs found by tests (fixed), Bugs found & fixed in src/, Checkpoint 2 — attendance module (2026-08-23), Checkpoint 3 — modules events → reimbursement (2026-08-23), Checkpoint 4 — reimbursement + OpenAPI complete (2026-08-23), Current Status (Checkpoint 1), Facts learned (apply to later modules) (+9 more)

### Community 26 - "Architecture"
Cohesion: 0.18
Nodes (10): Architectural Constraints, Architecture, Component Responsibilities, Cross-Cutting Concerns, Data Flow, Error Handling, Pattern Overview, Primary Request Path (+2 more)

### Community 29 - "devDependencies"
Cohesion: 0.22
Nodes (9): @commitlint/cli, eslint-plugin-unicorn, globals, devDependencies, @commitlint/cli, eslint-plugin-unicorn, globals, @types/express (+1 more)

### Community 35 - "_services/account.ts"
Cohesion: 0.22
Nodes (20): accountSchemaFinal, AccountT, getAccountByUser(), handleAttendanceCorrectionController(), autoCheckoutCron(), checkInController(), checkOutController(), attendancetodayKey() (+12 more)

### Community 38 - "Test Plan — attendance module"
Cohesion: 0.29
Nodes (6): Cases (~40), Determinism notes, Known-risk endpoints (may expose latent bugs), Seeding helpers, Surface (src/attendance), Test Plan — attendance module

### Community 39 - "program.schema.ts"
Cohesion: 0.14
Nodes (13): addParticipantsToProgramSchema, baseProgramSchema, CreateProgramInputType, createProgramParticipantsResponseSchema, createProgramSchema, programResponseSchema, updatedProgramSchema, UpdateProgramInputType (+5 more)

### Community 42 - "Coding Conventions"
Cohesion: 0.18
Nodes (10): Code Style, Coding Conventions, Comments, Error Handling, Function Design, Import Organization, Logging, Module Design (+2 more)

### Community 50 - "Tasks"
Cohesion: 0.18
Nodes (10): Final matrix, Plan: Separate Document Upload Endpoint, [T1] Document Middleware (Multer filter), [T2] Document Service (direct save, no sharp), [T3] Document Controller, [T4] Wire Route, [T5] Bulk Upload Endpoint, [T6] Tests (+2 more)

### Community 55 - "Phase 04: Session Export, Reporting & Attendance Refinement - Research"
Cohesion: 0.09
Nodes (21): Anti-Patterns to Avoid, Applicable ASVS Categories, Architectural Responsibility Map, Architecture Patterns, Common Pitfalls, Core, Don't Hand-Roll, Known Threat Patterns (+13 more)

### Community 56 - ".success"
Cohesion: 0.13
Nodes (40): createBankDetailController(), deleteBankDetailController(), getBankDetailController(), restoreBankDetailController(), updateBankDetailController(), getBank(), getAllUsersController(), userDeleteController() (+32 more)

### Community 57 - "events.routes.ts"
Cohesion: 0.19
Nodes (16): eventRouter, addParticipantController(), deleteParticipantController(), editParticipantController(), getParticipantByIdController(), getParticipants(), undoDeleteParticipantController(), participantResponseSchema (+8 more)

### Community 58 - "reimbursement.routes.ts"
Cohesion: 0.15
Nodes (14): createLogResponseSchema, CreateLogResponsiveType, createLogSchema, CreateLogType, adminBillCreatSchema, adminBillUpdateSchema, AdminCreatSchemaInputType, AdminUpdateSchemaInputType (+6 more)

### Community 59 - "External Integrations"
Cohesion: 0.22
Nodes (8): APIs & External Services, Authentication & Identity, CI/CD & Deployment, Data Storage, Environment Configuration, External Integrations, Monitoring & Observability, Webhooks & Callbacks

### Community 60 - "Technology Stack"
Cohesion: 0.25
Nodes (7): Configuration, Frameworks, Key Dependencies, Languages, Platform Requirements, Runtime, Technology Stack

### Community 61 - "Fix plan — Cross-cutting concerns"
Cohesion: 0.17
Nodes (12): 0. Secrets & env discipline (Wave 0 — do first), 1. CORS + cookies → implemented in `17-entrypoints.md` + `03-auth.md`, 2. Authorization consistency → `10-permission.md` FIRST, then `01-admin.md`, `06-events.md`, 3. Password handling → `05-database.md` NOTE + `01-admin.md`, 4. Cache invalidation registry → `01-admin.md` (helper), applied by, 5. Race conditions → conditional updates/upserts + unique indexes over find-then-write, 6. Timezone standardization → `02-attendance.md` Chunk C, 7. Data lifecycle → cascade decisions (`05-database.md`), temp-PDF TTL cleanup + (+4 more)

### Community 62 - "package.json"
Cohesion: 0.20
Nodes (9): author, description, keywords, license, main, name, packageManager, type (+1 more)

### Community 63 - "Fix plan — `src/attendance`"
Cohesion: 0.25
Nodes (7): Chunk A — Exposure & scoping (do first), Chunk B — Correction integrity, Chunk C — Retrieval correctness, Chunk D — Marking, holidays, export, cron, Findings status at HEAD (2026-08-22), Fix plan — `src/attendance`, Verification

### Community 64 - "Fix plan — `src/libs`"
Cohesion: 0.25
Nodes (7): class/ · mail/ · logger/ · eslint-rules/, Findings status at HEAD (2026-08-22), Fix plan — `src/libs`, middleware/, redis/, utils/, Verification

### Community 65 - "saher-backend — agent notes"
Cohesion: 0.29
Nodes (6): Commands, Conventions that matter, Gotchas, Layout, saher-backend — agent notes, Toolchain quirks

### Community 66 - "README.md"
Cohesion: 0.29
Nodes (4): Findings status at HEAD (2026-08-22), Fix plan — `src/permission`, Fixes in order, Verification

### Community 67 - "saher-backend — Module-wise Fix Plans"
Cohesion: 0.33
Nodes (6): Files, Fix order (dependency-aware waves), Gap: unaudited modules, Per-task workflow (every fix), saher-backend — Module-wise Fix Plans, Status legend used in every plan

### Community 68 - "Fix plan — `src/admin`"
Cohesion: 0.40
Nodes (4): Findings status at HEAD (2026-08-22), Fix plan — `src/admin`, Fixes in order, Verification

### Community 69 - "Fix plan — `src/auth`"
Cohesion: 0.40
Nodes (4): Findings status at HEAD (2026-08-22), Fix plan — `src/auth`, Fixes in order, Verification

### Community 70 - "Fix plan — `src/calendar`"
Cohesion: 0.40
Nodes (4): Findings status at HEAD (2026-08-22), Fix plan — `src/calendar`, Fixes, Verification

### Community 71 - "Fix plan — `src/database`"
Cohesion: 0.40
Nodes (4): Findings status at HEAD (2026-08-22), Fix plan — `src/database`, Fixes in order, Verification

### Community 72 - "Fix plan — `src/events`"
Cohesion: 0.40
Nodes (4): Findings status at HEAD (2026-08-22), Fix plan — `src/events`, Fixes in order, Verification

### Community 73 - "Fix plan — `src/mail`"
Cohesion: 0.40
Nodes (4): Findings status at HEAD (2026-08-22), Fix plan — `src/mail`, Fixes, Verification

### Community 74 - "Fix plan — `src/notification`"
Cohesion: 0.40
Nodes (4): Findings status at HEAD (2026-08-22), Fix plan — `src/notification`, Fixes in order, Verification

### Community 75 - "Fix plan — `src/public` + cron trigger security"
Cohesion: 0.40
Nodes (4): Findings status at HEAD (2026-08-22), Fix plan — `src/public` + cron trigger security, Fixes in order, Verification

### Community 76 - "Fix plan — `src/seeds`"
Cohesion: 0.40
Nodes (4): Findings status at HEAD (2026-08-22), Fix plan — `src/seeds`, Fixes, Verification

### Community 77 - "Fix plan — `src/types`"
Cohesion: 0.40
Nodes (4): Findings status at HEAD (2026-08-22), Fix plan — `src/types`, Fixes, Verification

### Community 78 - "Fix plan — `src/upload`"
Cohesion: 0.40
Nodes (4): Findings status at HEAD (2026-08-22), Fix plan — `src/upload`, Fixes, Verification

### Community 79 - "Fix plan — `src/user`"
Cohesion: 0.40
Nodes (4): Findings status at HEAD (2026-08-22), Fix plan — `src/user`, Fixes, Verification

### Community 80 - "Fix plan — `src/worker`"
Cohesion: 0.40
Nodes (4): Findings status at HEAD (2026-08-22), Fix plan — `src/worker`, Fixes in order, Verification

### Community 81 - "Fix plan — Entrypoints (`src/index.ts`, `src/worker/index.ts`)"
Cohesion: 0.40
Nodes (4): Findings status at HEAD (2026-08-22), Fix plan — Entrypoints (`src/index.ts`, `src/worker/index.ts`), Fixes in order, Verification

### Community 82 - "Phase 2: Attendance Export — Excel Format & One-Day Temporary Storage - Research"
Cohesion: 0.12
Nodes (16): Architectural Responsibility Map, Assumptions Log, Don't Hand-Roll, Environment Availability, Metadata, Open Questions, Package Legitimacy Audit, Phase 2: Attendance Export — Excel Format & One-Day Temporary Storage - Research (+8 more)

### Community 83 - "user.model.ts"
Cohesion: 0.27
Nodes (10): changePasswordController(), changePasswordRequestController(), forgotPasswordController(), forgotPasswordRequestController(), hashToken, revokeUserSessions(), User, userSchema (+2 more)

### Community 84 - "Phase 03: Attendance-Leave-Verification-Payroll - Research"
Cohesion: 0.11
Nodes (17): Anti-Patterns to Avoid, Applicable ASVS Categories, Architectural Responsibility Map, Architecture Patterns, Assumptions Log, Common Pitfalls, Don't Hand-Roll, Known Threat Patterns (+9 more)

### Community 85 - "Testing Patterns"
Cohesion: 0.25
Nodes (7): Common Patterns, Fixtures and Helpers, Mocking, Test File Organization, Test Framework, Test Structure, Testing Patterns

### Community 87 - "Test Plan — `auth` & `permission`"
Cohesion: 0.50
Nodes (3): Auth Scenarios (15 tests), Permission Scenarios (10 tests), Test Plan — `auth` & `permission`

### Community 88 - "Codebase Concerns"
Cohesion: 0.29
Nodes (6): Codebase Concerns, Fragile Areas (handle with care), Open Concerns, Previously Critical — Now Fixed (verify no regression), Status Summary, Verification Commands

### Community 91 - "Phase 2: Attendance Excel Export & Temp Storage - Context"
Cohesion: 0.18
Nodes (10): Architecture (LOCKED), Canonical References, Current Export Flow, Deferred Ideas, Implementation Decisions, Phase 2: Attendance Excel Export & Temp Storage - Context, Phase Boundary, Specific Ideas (+2 more)

### Community 92 - "Codebase Structure"
Cohesion: 0.29
Nodes (6): Codebase Structure, Directory Layout, Directory Purposes, Key File Locations, Naming Conventions, Where to Add New Code

### Community 93 - "redis-client.ts"
Cohesion: 0.19
Nodes (13): env, envSchema, connectDb(), PushNotificationType, PushSubscription, pushSubscriptionSchema, httpLogger, Req (+5 more)

### Community 95 - "Phase 2: Attendance Export — Excel Format - Pattern Map"
Cohesion: 0.18
Nodes (10): Cleanup, Error Handling, File Classification, Metadata, Pattern Assignments, Phase 2: Attendance Export — Excel Format - Pattern Map, Shared Patterns, `src/attendance/export/report.ts` (controller, request-response) (+2 more)

### Community 103 - "Phase 03 Plan 01: Payroll Approval Workflow Summary"
Cohesion: 0.25
Nodes (7): Auto-fixed Issues, Deviations from Plan, Known Stubs, Phase 03 Plan 01: Payroll Approval Workflow Summary, Self-Check: PASSED, TDD Gate Compliance, Threat Flags

### Community 107 - "Phase 2 — Validation Strategy"
Cohesion: 0.25
Nodes (7): Manual-Only Verifications, Per-Task Verification Map, Phase 2 — Validation Strategy, Sampling Rate, Test Infrastructure, Validation Sign-Off, Wave 0 Requirements

### Community 109 - "notification.controllers.ts"
Cohesion: 0.11
Nodes (28): Notification, notificationActionTypes, notificationMethod, notificationSchema, notificationScope, NotificationType, notificationTypes, Notification (+20 more)

### Community 110 - "attendance-report.ts"
Cohesion: 0.21
Nodes (15): createAttendanceExcel(), formatDate(), AttendanceResponseT, formatTime(), attendanceReportWorker, ensureTempDir(), fetchParsed(), generateAttendanceReportPdf() (+7 more)

### Community 115 - "participant.schema.ts"
Cohesion: 0.23
Nodes (10): baseSchema, CreateParticipantInputType, UpdateParticipantInputType, BulkSessionAttendanceInputType, SessionAttendanceSchema, imageType, objectId(), optionalAlphaText() (+2 more)

### Community 117 - "Phase 01 Summary: Expand File Upload Support"
Cohesion: 0.29
Nodes (6): Files, Key decisions, Known follow-ups, Phase 01 Summary: Expand File Upload Support, Verification, What was built

### Community 122 - "Phase 01: Expand File Upload Support — Verification Report"
Cohesion: 0.29
Nodes (6): Behavioral Spot-Checks, Goal Achievement, Human Verification Required, Notes (non-blocking), Phase 01: Expand File Upload Support — Verification Report, Wiring

### Community 123 - "Phase 07: Plan — Soft-Delete-Aware GETs, Search Consistency & OpenAPI"
Cohesion: 0.11
Nodes (18): acceptance_criteria, acceptance_criteria, acceptance_criteria, acceptance_criteria, action, action, action, action (+10 more)

### Community 124 - "Tasks"
Cohesion: 0.29
Nodes (6): Plan: Attendance Export - Excel & Cleanup, [T1] Implement Excel Service, [T2] Update Export Controller/Worker, [T3] Implement Cleanup Job, [T4] Tests, Tasks

### Community 125 - "Roadmap"
Cohesion: 0.20
Nodes (9): Phase 1: Expand File Upload Support, Phase 2: Attendance Export — Excel Format and One-Day Temporary Storage, Phase 3: Attendance and Leave Verification for Payroll, Phase 4: Events Module Audit, Soft Delete Enforcement & Session Exports, Phase 5: Reimbursement Audit, Balance Update Validation & Bill Export, Phase 6: Hard-Delete Audit — Soft Delete + Restore Everywhere, Phase 7: Soft-Delete-Aware GETs, Search Consistency & OpenAPI, Phase 8: Production Compose Support & Frontend Handbook (+1 more)

### Community 126 - "attendance.test.ts"
Cohesion: 0.20
Nodes (7): attendanceCorrectionSchema, AttendanceCorrectionType, attendanceRecord, mkCorrectionScenario(), NOW, seedRow(), mkUserOnly()

### Community 130 - "Architecture Patterns"
Cohesion: 0.29
Nodes (7): Anti-Patterns to Avoid, Architecture Patterns, Pattern 1: Dual-format branch off one data-collection step, Pattern 2: mtime-based retention sweep (no DB, no TZ math), Pattern 3: Repeatable cleanup job registered idempotently at worker boot, Recommended Project Structure, System Architecture Diagram

### Community 131 - "Common Pitfalls"
Cohesion: 0.29
Nodes (7): Common Pitfalls, Pitfall 1: Dedup cache-key collision between formats, Pitfall 2: Cached-completion branch drops/mangles the URL, Pitfall 3: Constructing a real BullMQ Queue in tests, Pitfall 4: Partial files left by failed jobs, Pitfall 5: Forgetting the end-of-phase OpenAPI/graphify rule, Pitfall 6: Assuming local PDF-path testing

### Community 132 - "Validation Architecture"
Cohesion: 0.40
Nodes (5): Phase Requirements → Test Map, Sampling Rate, Test Framework, Validation Architecture, Wave 0 Gaps

### Community 133 - "Standard Stack"
Cohesion: 0.50
Nodes (4): Alternatives Considered, Core, Standard Stack, Supporting (already installed, reused)

### Community 134 - "Current State Map (verified, file:line refs)"
Cohesion: 0.50
Nodes (4): Current State Map (verified, file:line refs), Flow: request → notification → download, What does NOT exist, What exists for cron/scheduling today

### Community 135 - "Sources"
Cohesion: 0.50
Nodes (4): Primary (HIGH confidence), Secondary (MEDIUM confidence), Sources, Tertiary (LOW confidence)

### Community 136 - "Security Domain"
Cohesion: 0.67
Nodes (3): Applicable ASVS Categories, Known Threat Patterns for this stack, Security Domain

### Community 137 - "Code Examples"
Cohesion: 0.67
Nodes (3): Code Examples, Excel writer consuming the shared row type, Read-back validation pattern (for the test task)

### Community 138 - "workshop.controller.ts"
Cohesion: 0.17
Nodes (11): addWorkshop(), deleteWorkshop(), editWorkshop(), getSingleWorkshop(), undoDeleteWorkshop(), baseWorkshopSchema, CreateWorkshopInputType, createWorkshopSchema (+3 more)

### Community 139 - "worker/session-report.ts"
Cohesion: 0.17
Nodes (17): SessionType, createSessionExcel(), formatDate(), PopulatedParticipant, populatedParticipants(), SessionDoc, getBrowser(), createSessionPdfBody() (+9 more)

### Community 141 - "Phase 06: Plan — Soft Delete + Restore Everywhere"
Cohesion: 0.13
Nodes (14): acceptance_criteria, acceptance_criteria, acceptance_criteria, action, action, action, must_haves, Phase 06: Plan — Soft Delete + Restore Everywhere (+6 more)

### Community 148 - "Phase 08: Plan — Production Compose Support & Frontend Handbook"
Cohesion: 0.13
Nodes (14): acceptance_criteria, acceptance_criteria, acceptance_criteria, action, action, action, must_haves, Phase 08: Plan — Production Compose Support & Frontend Handbook (+6 more)

### Community 149 - "FRONTEND-HANDBOOK — saher-backend integration guide"
Cohesion: 0.17
Nodes (11): 10. Quick smoke checklist for the frontend agent, 1. Base URL & proxying, 2. Auth — cookie session, 3. Response envelope (every endpoint), 4. RBAC — what each role may call, 5. Soft delete & restore (all business resources), 6. Domain map (path prefix → feature), 7. Dates are IST (+3 more)

### Community 150 - "Plan 04-02: Session Attendance Report Export (PDF/Excel via BullMQ)"
Cohesion: 0.17
Nodes (11): acceptance_criteria, acceptance_criteria, action, action, must_haves, Objective, Plan 04-02: Session Attendance Report Export (PDF/Excel via BullMQ), read_first (+3 more)

### Community 151 - "Phase 06: Hard-Delete Audit — Context"
Cohesion: 0.18
Nodes (10): Canonical References, Converted to soft delete + restore (locked), Deferred Ideas, Files to convert, Implementation Decisions, Kept as hard delete (locked), Phase 06: Hard-Delete Audit — Context, Phase Boundary (+2 more)

### Community 152 - "Phase 07: Soft-Delete GETs, Search Consistency & OpenAPI — Context"
Cohesion: 0.18
Nodes (10): Canonical References, Conventions, Deferred Ideas, Files to modify, Implementation Decisions, Locked, Phase 07: Soft-Delete GETs, Search Consistency & OpenAPI — Context, Phase Boundary (+2 more)

### Community 155 - "Phase 03 Plan 02: Attendance-Leave-Verification-Payroll Summary"
Cohesion: 0.20
Nodes (9): Decisions Made, Deviations from Plan, Key Changes, Known Stubs, One-liner, Phase 03 Plan 02: Attendance-Leave-Verification-Payroll Summary, Self-Check: PASSED, TDD Gate Compliance (+1 more)

### Community 158 - "Phase 04: Session Export, Reporting & Attendance Refinement"
Cohesion: 0.20
Nodes (9): Canonical References, Core Attendance Export, Deferred Ideas, Events, Events Module, Implementation Decisions, Phase 04: Session Export, Reporting & Attendance Refinement, Phase Boundary (+1 more)

### Community 159 - "Task 1: Remove `underDevelopment` from restore routes"
Cohesion: 0.22
Nodes (8): acceptance_criteria, action, must_haves, Objective, Plan 04-01: Enable Soft-Delete Restore in Events Module, read_first, read_first (for verification), Task 1: Remove `underDevelopment` from restore routes

### Community 160 - "create-audit-log.controller.ts"
Cohesion: 0.31
Nodes (6): AuditLog, auditLogSchema, AuditLogType, auditLog(), createAuditLogController(), handleSettlementRequest()

### Community 161 - "auth.test.ts"
Cohesion: 0.15
Nodes (13): authedUser(), cookieHeaderOf(), createUser(), login(), setCookiesOf(), TOKEN, fakeRedis, kv (+5 more)

### Community 162 - "Phase 05: Reimbursement Module Audit & Bill Export"
Cohesion: 0.25
Nodes (7): Canonical References, Export Patterns, Implementation Decisions, Phase 05: Reimbursement Module Audit & Bill Export, Phase Boundary, Reimbursement, Reimbursement

### Community 163 - "Phase 05: Reimbursement Module Audit & Bill Export Research"
Cohesion: 0.25
Nodes (7): Canonical References, Export Patterns, Implementation Decisions, Phase 05: Reimbursement Module Audit & Bill Export Research, Phase Boundary, Reimbursement, Reimbursement

### Community 164 - "Phase 08: Production Compose Support & Frontend Handbook — Context"
Cohesion: 0.25
Nodes (7): Canonical References, Deferred Ideas, Implementation Decisions, Locked, Phase 08: Production Compose Support & Frontend Handbook — Context, Phase Boundary, the agent's Discretion

### Community 165 - "Phase 06: Research — Hard-Delete Audit"
Cohesion: 0.29
Nodes (6): 1. Inventory (grep `deleteOne|deleteMany|findByIdAndDelete|findOneAndDelete` over src/), 2. Models lacking `isDeleted`, 3. Read paths needing `isDeleted: false` after conversion, 4. Restore endpoints to add, 5. Risks, Phase 06: Research — Hard-Delete Audit

### Community 166 - "Phase 07: Research"
Cohesion: 0.29
Nodes (6): 1. GET soft-delete audit (current state), 2. Search audit, 3. Efficiency, 4. OpenAPI state, 5. Risks, Phase 07: Research

### Community 167 - "app.ts"
Cohesion: 0.16
Nodes (12): adminRouter, apiLimiter, authLimiter, attendanceRouter, httpRequestDuration, httpRequestTotal, register, metricsMiddleware() (+4 more)

### Community 168 - "Phase 05: Plan - Reimbursement Audit, Balance Integrity & Bill Export"
Cohesion: 0.40
Nodes (4): Phase 05: Plan - Reimbursement Audit, Balance Integrity & Bill Export, Wave 1: Balance & Lifecycle Audit, Wave 2: Bill Export Implementation, Wave 3: Verification & Cleanup

### Community 169 - "Phase 05: Research - Reimbursement Audit, Balance Integrity & Bill Export"
Cohesion: 0.40
Nodes (4): 1. Audit Scope, 2. Technical Findings, 3. Validation Strategy, Phase 05: Research - Reimbursement Audit, Balance Integrity & Bill Export

### Community 170 - "Phase 05: Validation Strategy"
Cohesion: 0.40
Nodes (4): 1. Functional Verification, 2. Integrity Constraints, Goal, Phase 05: Validation Strategy

### Community 171 - "Phase 06 SUMMARY — Hard-Delete Audit"
Cohesion: 0.40
Nodes (4): Phase 06 SUMMARY — Hard-Delete Audit, Tests, Verification, What shipped

### Community 172 - "Phase 07 SUMMARY — Soft-Delete GETs, Search Consistency & OpenAPI"
Cohesion: 0.40
Nodes (4): Bugs found & fixed during verification, Phase 07 SUMMARY — Soft-Delete GETs, Search Consistency & OpenAPI, Verification, What shipped

### Community 173 - "Phase 08 SUMMARY — Production Compose Support & Frontend Handbook"
Cohesion: 0.40
Nodes (4): Architecture audit verdict, Phase 08 SUMMARY — Production Compose Support & Frontend Handbook, Verification, What shipped

### Community 174 - "Phase 08: Research"
Cohesion: 0.50
Nodes (3): Architecture compatibility audit (target: nginx + Next.js frontend + backend + worker, single compose), Frontend handbook inputs, Phase 08: Research

### Community 175 - "escapeHtml"
Cohesion: 0.19
Nodes (11): changeEmailTemplate(), Props, changePasswordTemplate(), Props, forgotPasswordTemplate(), Props, onboardEmailTemplate(), Props (+3 more)

### Community 180 - "worker/bill-report.ts"
Cohesion: 0.25
Nodes (12): BillType, createBillExcel(), formatDate(), BillDocumentT, BillUserSubset, billReportWorker, createBillPdfBody(), ensureTempDir() (+4 more)

### Community 181 - "session.controller.ts"
Cohesion: 0.21
Nodes (11): Workshop, workshopSchema, WorkshopType, deleteSession(), editSession(), getSingleSession(), invalidateCalendarCache(), undoDeleteSession() (+3 more)

### Community 182 - "utils/notification.ts"
Cohesion: 0.23
Nodes (8): modes, Settlement, settlementSchema, SettlementType, settleStatus, reminderNotificationController(), notification, handleBillController()

### Community 183 - "user.ts"
Cohesion: 0.22
Nodes (8): shortUserSchema, userSchemaFinal, UserT, rejectMarkSchema, RejectMarkT, AttendanceListT, attendanceResponseSchema, NOTE: Make only one not multiple

### Community 184 - "session.schema.ts"
Cohesion: 0.20
Nodes (9): baseSchema, CreateSessionInputType, createSessionResponseSchema, createSessionSchema, sessionResponse, SessionResponseT, UpdatedSessionInputType, updatedSessionSchema (+1 more)

### Community 185 - "export/bill-report.ts"
Cohesion: 0.31
Nodes (6): Bill, billSchema, billStatus, userBalanceEnquiryController(), billReportQuerySchema, billReportQueue

### Community 186 - "cleanup.ts"
Cohesion: 0.33
Nodes (5): bullmqConnection, cleanupQueue, cleanupTempFiles(), cleanupWorker, tempPath

### Community 187 - "date-time.ts"
Cohesion: 0.38
Nodes (3): endOfDayIST(), istDayRange(), startOfDayIST()

### Community 188 - "Phase 05 SUMMARY — Reimbursement Audit, Balance Integrity & Bill Export"
Cohesion: 0.40
Nodes (4): Audit findings (Wave 1), Bill export (Wave 2) — mirrors session/attendance export pattern, Phase 05 SUMMARY — Reimbursement Audit, Balance Integrity & Bill Export, Verification

## Knowledge Gaps
- **760 isolated node(s):** `name`, `version`, `description`, `main`, `dev` (+755 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **58 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ApiError` connect `ApiError` to `normalizeDoc`, `events.test.ts`, `upload.routes.ts`, `search-bill.controller.ts`, `calender.controller.ts`, `workshop.controller.ts`, `leave.controller.ts`, `standardDateString`, `authorize.ts`, `auth.routes.ts`, `admin.routes.ts`, `notice.controller.ts`, `_services/account.ts`, `session.controller.ts`, `utils/notification.ts`, `user.ts`, `.success`, `events.routes.ts`, `export/bill-report.ts`, `cron-secret.ts`, `user.model.ts`, `redis-client.ts`, `notification.controllers.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `ApiResponse` connect `ApiError` to `normalizeDoc`, `events.test.ts`, `upload.routes.ts`, `search-bill.controller.ts`, `calender.controller.ts`, `workshop.controller.ts`, `leave.controller.ts`, `standardDateString`, `authorize.ts`, `auth.routes.ts`, `admin.routes.ts`, `notice.controller.ts`, `create-audit-log.controller.ts`, `_services/account.ts`, `session.controller.ts`, `utils/notification.ts`, `user.ts`, `.success`, `events.routes.ts`, `export/bill-report.ts`, `user.model.ts`, `notification.controllers.ts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `normalizeDoc()` connect `normalizeDoc` to `create-audit-log.controller.ts`, `_services/account.ts`, `search-bill.controller.ts`, `workshop.controller.ts`, `leave.controller.ts`, `calender.controller.ts`, `standardDateString`, `notification.controllers.ts`, `authorize.ts`, `ApiError`, `session.controller.ts`, `user.ts`, `.success`, `events.routes.ts`, `notice.controller.ts`, `utils/notification.ts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _760 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `normalizeDoc` be split into smaller, more focused modules?**
  _Cohesion score 0.08859357696567 - nodes in this community are weakly interconnected._
- **Should `events.test.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11965811965811966 - nodes in this community are weakly interconnected._
- **Should `saher-backend — Module & Route Specification` be split into smaller, more focused modules?**
  _Cohesion score 0.043478260869565216 - nodes in this community are weakly interconnected._