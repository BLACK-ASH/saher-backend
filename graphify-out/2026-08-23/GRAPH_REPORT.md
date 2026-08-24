# Graph Report - saher-backend  (2026-08-23)

## Corpus Check
- 289 files · ~96,057 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1475 nodes · 3566 edges · 158 communities (103 shown, 55 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 160 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cb430e16`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- reimbursement.routes.ts
- person.ts
- ApiError
- events.test.ts
- saher-backend — Module & Route Specification
- dependencies
- User
- upload.routes.ts
- setCache
- scripts
- calender.controller.ts
- leave.controller.ts
- exportReportController
- authorize.ts
- compilerOptions
- saher-dev OpenCode Agent
- validate-zod-schema.ts
- token.ts
- app.ts
- Saher Community Code of Conduct
- Fix Report — running summary
- account/schema.ts
- auth.test.ts
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
- @types/express
- @types/jsonwebtoken
- @types/multer
- Test Plan — attendance module
- session.schema.ts
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
- session.controller.ts
- cspell
- .success
- events.routes.ts
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
- createKey
- Phase 03: Attendance-Leave-Verification-Payroll - Research
- Testing Patterns
- express-rate-limit
- Test Plan — `auth` & `permission`
- Codebase Concerns
- puppeteer-core
- redis
- Phase 2: Attendance Excel Export & Temp Storage - Context
- Codebase Structure
- verfiy-email/controller.ts
- web-push
- Phase 2: Attendance Export — Excel Format - Pattern Map
- pino-pretty
- prettier
- @types/dompurify
- @typescript-eslint/eslint-plugin
- @js-temporal/polyfill
- auth.routes.ts
- prom-client
- mongodb-memory-server
- pino
- Phase 2 — Validation Strategy
- supertest
- notification.controllers.ts
- change-password/controller.ts
- @redocly/cli
- @types/jsdom
- @types/node
- @types/pino-http
- participant.controller.ts
- @types/supertest
- Phase 01 Summary: Expand File Upload Support
- vitest
- @vitest/coverage-v8
- Phase 01: Expand File Upload Support — Verification Report
- Session handoff — ALL COMPLETED
- Tasks
- Roadmap
- cors
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
- env.ts
- bullmq
- cookie-parser
- redis-client.ts
- jsdom
- mongoose
- jsonwebtoken
- sharp
- attendance-pdf.ts
- attendance-report.ts
- user.model.ts
- cleanup.ts
- user/user.controller.ts
- attendance.test.ts
- http-logger.ts
- 03-01-PLAN.md
- 03-02-PLAN.md
- @commitlint/config-conventional
- exceljs

## God Nodes (most connected - your core abstractions)
1. `createKey()` - 100 edges
2. `normalizeDoc()` - 85 edges
3. `ApiError` - 77 edges
4. `ApiResponse` - 69 edges
5. `deleteCache()` - 60 edges
6. `setCache()` - 37 edges
7. `getCache()` - 35 edges
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
- `getAccount()` --calls--> `createKey()`  [EXTRACTED]
  src/admin/_services/account.ts → src/libs/redis/redis-utils.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Project Governance Docs** — readme_saher_backend_project_stub, security_md_vulnerability_reporting_policy, code_of_conduct_community_code_of_conduct [INFERRED 0.75]
- **OpenCode Agent Tooling Config** — _opencode_agent_saher_dev_saher_dev_agent, _opencode_skill_add_module_skill_add_module_recipe, _opencode_skill_backend_dev_skill_backend_dev_workflow, _opencode_skill_security_review_skill_security_audit_checklist [INFERRED 0.85]

## Communities (158 total, 55 thin omitted)

### Community 0 - "reimbursement.routes.ts"
Cohesion: 0.07
Nodes (31): AuditLog, auditLogSchema, AuditLogType, billStatus, settleStatus, auditLog(), createLogResponseSchema, CreateLogResponsiveType (+23 more)

### Community 1 - "person.ts"
Cohesion: 0.18
Nodes (10): app, mkProgramWithSpeaker(), mkScenario(), createFullAccount(), cookieOf(), Ctx, login(), mkPerson() (+2 more)

### Community 2 - "ApiError"
Cohesion: 0.05
Nodes (89): accountSchemaFinal, AccountT, attendanceRouter, retrieveCustomAttendace(), retrieveTypeMonthAttendance(), retrieveTypeTodayAttendance(), retrieveTypeWeekAttendance(), retrieveTypeYearAttendance() (+81 more)

### Community 3 - "events.test.ts"
Cohesion: 0.13
Nodes (19): Participant, participantSchema, ParticipantType, Program, programSchema, ProgramType, attendanceSchema, Session (+11 more)

### Community 4 - "saher-backend — Module & Route Specification"
Cohesion: 0.04
Nodes (45): 10. Notice Module (`/api/notice`), 11. Calendar Module (`/api/calendar`), 12. Leave Module (`/api/leave`), 13. Upload Module (`/api/upload`), 14. Public & Cron Module (`/api`), 1. Auth Module (`/api/auth`), 2. Admin Module (`/api/admin`), 3. User Module (`/api/user`) (+37 more)

### Community 5 - "dependencies"
Cohesion: 0.11
Nodes (19): bcrypt, dompurify, dotenv, express, googleapis, multer, dependencies, bcrypt (+11 more)

### Community 6 - "User"
Cohesion: 0.17
Nodes (17): Account, accountSchema, AccountType, EmployeeType, employeeTypeList, Bank, bankSchema, BankType (+9 more)

### Community 7 - "upload.routes.ts"
Cohesion: 0.15
Nodes (13): uploadBulkDocumentsController(), uploadDocumentController(), storage, supportedFileMimeType, uploadDocument, saveDocument(), uploadBulkImagesController(), uploadImageController() (+5 more)

### Community 8 - "setCache"
Cohesion: 0.17
Nodes (21): accountGetController(), createBankDetailController(), getBankDetailController(), BankRegisterType, bankSchema, bankUpdateSchema, BankUpdateType, getAccount() (+13 more)

### Community 9 - "scripts"
Cohesion: 0.11
Nodes (18): scripts, build, clean, dev, dev:worker, docs:build, docs:dev, docs:lint (+10 more)

### Community 10 - "calender.controller.ts"
Cohesion: 0.12
Nodes (25): holidayUpdateSchema, calendarRouter, createCalendarEventSchema, event, EventT, eventType, updateCalendarEventSchema, createCalendarEventController() (+17 more)

### Community 11 - "leave.controller.ts"
Cohesion: 0.07
Nodes (38): shortUserSchema, userSchemaFinal, UserT, LeaveBalance, leaveBalanceSchema, leaveActionTypes, LeaveLog, leaveLogSchema (+30 more)

### Community 12 - "exportReportController"
Cohesion: 0.22
Nodes (6): exportReportController(), BaseOptions, CustomOptions, DateRange, DateRangeResult, LastDaysOptions

### Community 13 - "authorize.ts"
Cohesion: 0.11
Nodes (20): payrollSchema, PayrollType, salaryMode, salaryStatus, getAllPayrollController(), getPayrollByPayrollIdController(), getPayrollByUserIdController(), payrollLeaveMangement() (+12 more)

### Community 14 - "compilerOptions"
Cohesion: 0.12
Nodes (15): node, src, src/payroll/update-payroll.controller.ts, compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution (+7 more)

### Community 15 - "saher-dev OpenCode Agent"
Cohesion: 0.50
Nodes (4): saher-dev OpenCode Agent, Add Module Recipe Skill, Backend Dev Workflow Skill, Security Review Checklist Skill

### Community 16 - "validate-zod-schema.ts"
Cohesion: 0.07
Nodes (37): Mail, mailSchema, Mailtype, Notice, noticeSchema, NoticeType, underDevelopment(), validate() (+29 more)

### Community 17 - "token.ts"
Cohesion: 0.20
Nodes (13): loginController(), COOKIE_OPTIONS, refreshController(), getSessionMeta(), SessionMeta, generateRefreshToken(), generateToken(), renewToken() (+5 more)

### Community 18 - "app.ts"
Cohesion: 0.15
Nodes (13): adminRouter, apiLimiter, authLimiter, authRouter, eventRouter, httpRequestDuration, httpRequestTotal, register (+5 more)

### Community 20 - "Fix Report — running summary"
Cohesion: 0.07
Nodes (26): 00-cross-cutting ✅ — commit `72c33ac` (branch `fix/module-fixes`, 2026-08-22), 01-admin ✅ — branch `fix/module-fixes`, 2026-08-22, 02-attendance ✅ (Chunks A–D) — branch `fix/module-fixes`, 2026-08-22, 03-auth ✅ — branch `fix/module-fixes`, 2026-08-22, 04-calendar ✅ — branch `fix/module-fixes`, 2026-08-22, 05-database ✅ (+ 01-admin CRIT completion) — branch `fix/module-fixes`, 2026-08-22, 06-events ✅ — branch `fix/module-fixes`, 2026-08-22, 07-libs ✅ — branch `fix/module-fixes`, 2026-08-22 (+18 more)

### Community 21 - "account/schema.ts"
Cohesion: 0.18
Nodes (12): accountBaseSchema, AccountRegisterInput, accountRegisterSchema, accountSchema, AccountUpdateInput, accountUpdateSchema, userSchema, UserUpdate (+4 more)

### Community 22 - "auth.test.ts"
Cohesion: 0.17
Nodes (11): authedUser(), cookieHeaderOf(), createUser(), login(), setCookiesOf(), TOKEN, fakeRedis, kv (+3 more)

### Community 25 - "Test Plan & Coverage Tracker — saher-backend"
Cohesion: 0.11
Nodes (17): Approach, Bugs found by tests (fixed), Bugs found & fixed in src/, Checkpoint 2 — attendance module (2026-08-23), Checkpoint 3 — modules events → reimbursement (2026-08-23), Checkpoint 4 — reimbursement + OpenAPI complete (2026-08-23), Current Status (Checkpoint 1), Facts learned (apply to later modules) (+9 more)

### Community 26 - "Architecture"
Cohesion: 0.18
Nodes (10): Architectural Constraints, Architecture, Component Responsibilities, Cross-Cutting Concerns, Data Flow, Error Handling, Pattern Overview, Primary Request Path (+2 more)

### Community 29 - "devDependencies"
Cohesion: 0.22
Nodes (9): @commitlint/cli, eslint, eslint-plugin-unicorn, globals, devDependencies, @commitlint/cli, eslint, eslint-plugin-unicorn (+1 more)

### Community 38 - "Test Plan — attendance module"
Cohesion: 0.29
Nodes (6): Cases (~40), Determinism notes, Known-risk endpoints (may expose latent bugs), Seeding helpers, Surface (src/attendance), Test Plan — attendance module

### Community 39 - "session.schema.ts"
Cohesion: 0.12
Nodes (16): baseSchema, CreateSessionInputType, createSessionResponseSchema, createSessionSchema, sessionResponse, SessionResponseT, UpdatedSessionInputType, updatedSessionSchema (+8 more)

### Community 42 - "Coding Conventions"
Cohesion: 0.18
Nodes (10): Code Style, Coding Conventions, Comments, Error Handling, Function Design, Import Organization, Logging, Module Design (+2 more)

### Community 50 - "Tasks"
Cohesion: 0.18
Nodes (10): Final matrix, Plan: Separate Document Upload Endpoint, [T1] Document Middleware (Multer filter), [T2] Document Service (direct save, no sharp), [T3] Document Controller, [T4] Wire Route, [T5] Bulk Upload Endpoint, [T6] Tests (+2 more)

### Community 55 - "session.controller.ts"
Cohesion: 0.52
Nodes (6): addSession(), deleteSession(), editSession(), invalidateCalendarCache(), undoDeleteSession(), sendPushToUser()

### Community 57 - ".success"
Cohesion: 0.13
Nodes (28): getAllAttendanceCorrectionController(), getAttendanceCorrectionController(), createAttendanceCorrectionController(), rejectMarkController(), allAttendanceController(), getAllUserController(), getAttendanceById(), getParticipantByIdController() (+20 more)

### Community 58 - "events.routes.ts"
Cohesion: 0.15
Nodes (18): addProgram(), deleteProgram(), editProgram(), getPrograms(), getSingleProgram(), undoDeleteProgram(), addParticipantsToProgramSchema, baseProgramSchema (+10 more)

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

### Community 83 - "createKey"
Cohesion: 0.18
Nodes (21): accountUpdateController(), deleteBankDetailController(), updateBankDetailController(), userDeleteController(), userRestoreController(), userUpdateController(), overtimeCheckInController(), logoutController() (+13 more)

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

### Community 93 - "verfiy-email/controller.ts"
Cohesion: 0.24
Nodes (8): accountRegisterController(), verifyEmailController(), verifyEmailRequestController(), Props, verifyEmailTemplate(), errorHandler(), isApiError(), formatMessage()

### Community 95 - "Phase 2: Attendance Export — Excel Format - Pattern Map"
Cohesion: 0.18
Nodes (10): Cleanup, Error Handling, File Classification, Metadata, Pattern Assignments, Phase 2: Attendance Export — Excel Format - Pattern Map, Shared Patterns, `src/attendance/export/report.ts` (controller, request-response) (+2 more)

### Community 103 - "auth.routes.ts"
Cohesion: 0.19
Nodes (11): getUser(), LoginInputSchema, LoginInputType, meController(), changeEmailRequestSchema, confirmPasswordSchema, confirmTokenSchema, tokenSchema (+3 more)

### Community 107 - "Phase 2 — Validation Strategy"
Cohesion: 0.25
Nodes (7): Manual-Only Verifications, Per-Task Verification Map, Phase 2 — Validation Strategy, Sampling Rate, Test Infrastructure, Validation Sign-Off, Wave 0 Requirements

### Community 109 - "notification.controllers.ts"
Cohesion: 0.11
Nodes (28): Notification, notificationActionTypes, notificationMethod, notificationSchema, notificationScope, NotificationType, notificationTypes, Notification (+20 more)

### Community 110 - "change-password/controller.ts"
Cohesion: 0.16
Nodes (19): changeEmailController(), changeEmailRequestController(), changePasswordController(), changePasswordRequestController(), forgotPasswordController(), forgotPasswordRequestController(), hashToken, revokeUserSessions() (+11 more)

### Community 115 - "participant.controller.ts"
Cohesion: 0.14
Nodes (17): addParticipantController(), deleteParticipantController(), editParticipantController(), undoDeleteParticipantController(), baseSchema, CreateParticipantInputType, participantResponseSchema, participantSchema (+9 more)

### Community 117 - "Phase 01 Summary: Expand File Upload Support"
Cohesion: 0.29
Nodes (6): Files, Key decisions, Known follow-ups, Phase 01 Summary: Expand File Upload Support, Verification, What was built

### Community 122 - "Phase 01: Expand File Upload Support — Verification Report"
Cohesion: 0.29
Nodes (6): Behavioral Spot-Checks, Goal Achievement, Human Verification Required, Notes (non-blocking), Phase 01: Expand File Upload Support — Verification Report, Wiring

### Community 123 - "Session handoff — ALL COMPLETED"
Cohesion: 0.50
Nodes (3): Session handoff — ALL COMPLETED, Status, What happened (2026-08-23)

### Community 124 - "Tasks"
Cohesion: 0.29
Nodes (6): Plan: Attendance Export - Excel & Cleanup, [T1] Implement Excel Service, [T2] Update Export Controller/Worker, [T3] Implement Cleanup Job, [T4] Tests, Tasks

### Community 125 - "Roadmap"
Cohesion: 0.40
Nodes (4): Phase 1: Expand File Upload Support, Phase 2: Attendance Export — Excel Format and One-Day Temporary Storage, Phase 3: Attendance and Leave Verification for Payroll, Roadmap

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

### Community 138 - "env.ts"
Cohesion: 0.20
Nodes (9): corsOrigins, env, envSchema, PushNotificationType, PushSubscription, pushSubscriptionSchema, requireCronSecret(), safeEqual() (+1 more)

### Community 141 - "redis-client.ts"
Cohesion: 0.33
Nodes (6): connectDb(), logger, connectRedis(), redisUrl, uploadPath, uploadPath

### Community 146 - "attendance-pdf.ts"
Cohesion: 0.31
Nodes (7): createAttendanceExcel(), formatDate(), formatTime(), createAttendancePdfBody(), formatDate(), absentRow, row

### Community 147 - "attendance-report.ts"
Cohesion: 0.40
Nodes (8): getBrowser(), attendanceReportWorker, ensureTempDir(), fetchParsed(), generateAttendanceReportPdf(), notifyDownload(), renderJob(), tempPath

### Community 148 - "user.model.ts"
Cohesion: 0.38
Nodes (5): UserRole, userSchema, UserType, Express, Request

### Community 149 - "cleanup.ts"
Cohesion: 0.33
Nodes (5): bullmqConnection, cleanupQueue, cleanupTempFiles(), cleanupWorker, tempPath

### Community 150 - "user/user.controller.ts"
Cohesion: 0.53
Nodes (4): updateUserController(), userGetController(), userSearchController(), userRouter

### Community 151 - "attendance.test.ts"
Cohesion: 0.40
Nodes (4): mkCorrectionScenario(), NOW, seedRow(), mkUserOnly()

### Community 152 - "http-logger.ts"
Cohesion: 0.50
Nodes (3): httpLogger, Req, Res

## Knowledge Gaps
- **593 isolated node(s):** `name`, `version`, `description`, `main`, `dev` (+588 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **55 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `normalizeDoc()` connect `.success` to `ApiError`, `auth.routes.ts`, `setCache`, `calender.controller.ts`, `leave.controller.ts`, `notification.controllers.ts`, `authorize.ts`, `validate-zod-schema.ts`, `participant.controller.ts`, `user/user.controller.ts`, `session.controller.ts`, `events.routes.ts`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `ApiError` connect `ApiError` to `events.test.ts`, `upload.routes.ts`, `setCache`, `calender.controller.ts`, `leave.controller.ts`, `env.ts`, `authorize.ts`, `validate-zod-schema.ts`, `token.ts`, `user/user.controller.ts`, `session.controller.ts`, `.success`, `events.routes.ts`, `createKey`, `verfiy-email/controller.ts`, `auth.routes.ts`, `notification.controllers.ts`, `change-password/controller.ts`, `participant.controller.ts`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `ApiResponse` connect `ApiError` to `reimbursement.routes.ts`, `events.test.ts`, `upload.routes.ts`, `setCache`, `calender.controller.ts`, `leave.controller.ts`, `authorize.ts`, `validate-zod-schema.ts`, `token.ts`, `user/user.controller.ts`, `session.controller.ts`, `.success`, `events.routes.ts`, `createKey`, `verfiy-email/controller.ts`, `auth.routes.ts`, `notification.controllers.ts`, `change-password/controller.ts`, `participant.controller.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _593 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `reimbursement.routes.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06970128022759602 - nodes in this community are weakly interconnected._
- **Should `ApiError` be split into smaller, more focused modules?**
  _Cohesion score 0.05129619415333701 - nodes in this community are weakly interconnected._
- **Should `events.test.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12807881773399016 - nodes in this community are weakly interconnected._