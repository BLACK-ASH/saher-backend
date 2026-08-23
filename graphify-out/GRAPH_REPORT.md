# Graph Report - saher-backend  (2026-08-23)

## Corpus Check
- 271 files · ~82,957 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1277 nodes · 3342 edges · 130 communities (77 shown, 53 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 158 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `af2eb657`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- reimbursement.routes.ts
- person.ts
- ApiError
- events.test.ts
- handle-settle.controller.ts
- dependencies
- user.model.ts
- env.ts
- normalizeDoc
- scripts
- calender.controller.ts
- leave.controller.ts
- exportReportController
- admin.routes.ts
- compilerOptions
- saher-dev OpenCode Agent
- mail.controller.ts
- search-bill.controller.ts
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
- notice.controller.ts
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
- program.schema.ts
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
- @commitlint/config-conventional
- pino-http
- express
- Testing Patterns
- express-rate-limit
- Test Plan — `auth` & `permission`
- Codebase Concerns
- puppeteer-core
- redis
- multer
- Codebase Structure
- login.controller.ts
- web-push
- zod
- pino-pretty
- prettier
- @types/dompurify
- @typescript-eslint/eslint-plugin
- @js-temporal/polyfill
- Notification
- prom-client
- mongodb-memory-server
- pino
- resend
- supertest
- notification.controllers.ts
- createKey
- @redocly/cli
- @types/jsdom
- @types/node
- @types/pino-http
- session.schema.ts
- @types/supertest
- dompurify
- vitest
- @vitest/coverage-v8
- user/user.controller.ts
- Session handoff — ALL COMPLETED
- UserRole
- Roadmap
- cors
- ua-parser-js
- typescript-eslint

## God Nodes (most connected - your core abstractions)
1. `createKey()` - 100 edges
2. `normalizeDoc()` - 83 edges
3. `ApiError` - 76 edges
4. `ApiResponse` - 68 edges
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
- `mkProgramWithSpeaker()` --calls--> `mkPerson()`  [EXTRACTED]
  tests/events/events.test.ts → tests/helpers/person.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Project Governance Docs** — readme_saher_backend_project_stub, security_md_vulnerability_reporting_policy, code_of_conduct_community_code_of_conduct [INFERRED 0.75]
- **OpenCode Agent Tooling Config** — _opencode_agent_saher_dev_saher_dev_agent, _opencode_skill_add_module_skill_add_module_recipe, _opencode_skill_backend_dev_skill_backend_dev_workflow, _opencode_skill_security_review_skill_security_audit_checklist [INFERRED 0.85]

## Communities (130 total, 53 thin omitted)

### Community 0 - "reimbursement.routes.ts"
Cohesion: 0.11
Nodes (19): createLogResponseSchema, CreateLogResponsiveType, createLogSchema, CreateLogType, userBalanceEnquiryController(), adminBillCreatSchema, adminBillUpdateSchema, AdminCreatSchemaInputType (+11 more)

### Community 1 - "person.ts"
Cohesion: 0.16
Nodes (12): app, mkCorrectionScenario(), NOW, seedRow(), createFullAccount(), cookieOf(), Ctx, login() (+4 more)

### Community 2 - "ApiError"
Cohesion: 0.07
Nodes (75): getAccountByUser(), getUser(), retrieveCustomAttendace(), retrieveTypeMonthAttendance(), retrieveTypeTodayAttendance(), retrieveTypeWeekAttendance(), retrieveTypeYearAttendance(), getAllAttendanceCorrectionController() (+67 more)

### Community 3 - "events.test.ts"
Cohesion: 0.11
Nodes (21): Participant, participantSchema, ParticipantType, Program, programSchema, ProgramType, attendanceSchema, Session (+13 more)

### Community 4 - "handle-settle.controller.ts"
Cohesion: 0.14
Nodes (14): AuditLog, auditLogSchema, AuditLogType, auditLog(), createAuditLogController(), handleSettlementRequest(), createSettleSchema, handleBillSchema (+6 more)

### Community 5 - "dependencies"
Cohesion: 0.11
Nodes (19): bcrypt, bullmq, cookie-parser, dotenv, googleapis, jsdom, mongoose, dependencies (+11 more)

### Community 6 - "user.model.ts"
Cohesion: 0.16
Nodes (19): Account, accountSchema, AccountType, EmployeeType, employeeTypeList, Bank, bankSchema, BankType (+11 more)

### Community 7 - "env.ts"
Cohesion: 0.06
Nodes (40): corsOrigins, env, envSchema, connectDb(), PushNotificationType, PushSubscription, pushSubscriptionSchema, httpLogger (+32 more)

### Community 8 - "normalizeDoc"
Cohesion: 0.19
Nodes (20): accountSchemaFinal, AccountT, getAccount(), bankSchemaFinal, BankT, shortUserSchema, userSchemaFinal, UserT (+12 more)

### Community 9 - "scripts"
Cohesion: 0.11
Nodes (18): scripts, build, clean, dev, dev:worker, docs:build, docs:dev, docs:lint (+10 more)

### Community 10 - "calender.controller.ts"
Cohesion: 0.18
Nodes (18): calendarRouter, createCalendarEventSchema, event, EventT, eventType, updateCalendarEventSchema, getCalendarEventByMonth(), syncGoogleHolidaysController() (+10 more)

### Community 11 - "leave.controller.ts"
Cohesion: 0.08
Nodes (38): LeaveBalance, leaveBalanceSchema, leaveActionTypes, LeaveLog, leaveLogSchema, Leave, leaveSchema, LeaveTypes (+30 more)

### Community 12 - "exportReportController"
Cohesion: 0.22
Nodes (6): exportReportController(), BaseOptions, CustomOptions, DateRange, DateRangeResult, LastDaysOptions

### Community 13 - "admin.routes.ts"
Cohesion: 0.07
Nodes (34): accountGetController(), adminRouter, createBankDetailController(), deleteBankDetailController(), getBankDetailController(), updateBankDetailController(), BankRegisterType, bankSchema (+26 more)

### Community 14 - "compilerOptions"
Cohesion: 0.12
Nodes (15): node, src, src/payroll/update-payroll.controller.ts, compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution (+7 more)

### Community 15 - "saher-dev OpenCode Agent"
Cohesion: 0.50
Nodes (4): saher-dev OpenCode Agent, Add Module Recipe Skill, Backend Dev Workflow Skill, Security Review Checklist Skill

### Community 16 - "mail.controller.ts"
Cohesion: 0.15
Nodes (18): Mail, mailSchema, Mailtype, getInboxMails(), sendMail(), SendMailPayload, sendMailUtilitySchema, getInboxController() (+10 more)

### Community 17 - "search-bill.controller.ts"
Cohesion: 0.16
Nodes (14): Bill, billSchema, billStatus, BillType, modes, Settlement, settlementSchema, SettlementType (+6 more)

### Community 18 - "app.ts"
Cohesion: 0.16
Nodes (12): apiLimiter, authLimiter, attendanceRouter, authRouter, httpRequestDuration, httpRequestTotal, register, metricsMiddleware() (+4 more)

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

### Community 39 - "notice.controller.ts"
Cohesion: 0.13
Nodes (17): Notice, noticeSchema, NoticeType, underDevelopment(), addNotice(), editNotice(), getNotices(), permanentDeleteNotice() (+9 more)

### Community 42 - "Coding Conventions"
Cohesion: 0.18
Nodes (10): Code Style, Coding Conventions, Comments, Error Handling, Function Design, Import Organization, Logging, Module Design (+2 more)

### Community 50 - "Tasks"
Cohesion: 0.18
Nodes (10): Final matrix, Plan: Separate Document Upload Endpoint, [T1] Document Middleware (Multer filter), [T2] Document Service (direct save, no sharp), [T3] Document Controller, [T4] Wire Route, [T5] Bulk Upload Endpoint, [T6] Tests (+2 more)

### Community 55 - "session.controller.ts"
Cohesion: 0.24
Nodes (12): userDeleteController(), participantResponseSchema, addSession(), deleteSession(), editSession(), getSessions(), getSingleSession(), invalidateCalendarCache() (+4 more)

### Community 57 - ".success"
Cohesion: 0.16
Nodes (24): eventRouter, addParticipantController(), deleteParticipantController(), editParticipantController(), getParticipantByIdController(), getParticipants(), undoDeleteParticipantController(), participantSchema (+16 more)

### Community 58 - "program.schema.ts"
Cohesion: 0.12
Nodes (15): addParticipantsToProgramSchema, baseProgramSchema, CreateProgramInputType, createProgramParticipantsResponseSchema, createProgramSchema, programResponseSchema, updatedProgramSchema, UpdateProgramInputType (+7 more)

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

### Community 85 - "Testing Patterns"
Cohesion: 0.25
Nodes (7): Common Patterns, Fixtures and Helpers, Mocking, Test File Organization, Test Framework, Test Structure, Testing Patterns

### Community 87 - "Test Plan — `auth` & `permission`"
Cohesion: 0.50
Nodes (3): Auth Scenarios (15 tests), Permission Scenarios (10 tests), Test Plan — `auth` & `permission`

### Community 88 - "Codebase Concerns"
Cohesion: 0.29
Nodes (6): Codebase Concerns, Fragile Areas (handle with care), Open Concerns, Previously Critical — Now Fixed (verify no regression), Status Summary, Verification Commands

### Community 92 - "Codebase Structure"
Cohesion: 0.29
Nodes (6): Codebase Structure, Directory Layout, Directory Purposes, Key File Locations, Naming Conventions, Where to Add New Code

### Community 93 - "login.controller.ts"
Cohesion: 0.43
Nodes (5): loginController(), COOKIE_OPTIONS, getSessionMeta(), SessionMeta, comparePassword()

### Community 103 - "Notification"
Cohesion: 0.52
Nodes (3): Notification, NotificationPayload, NotificationResponseT

### Community 109 - "notification.controllers.ts"
Cohesion: 0.12
Nodes (26): Notification, notificationActionTypes, notificationMethod, notificationSchema, notificationScope, NotificationType, notificationTypes, NotificationType (+18 more)

### Community 110 - "createKey"
Cohesion: 0.05
Nodes (75): accountRegisterController(), accountUpdateController(), userRestoreController(), userUpdateController(), attendanceReportQueue, addHolidayController(), deleteHolidayController(), updateHolidayController() (+67 more)

### Community 115 - "session.schema.ts"
Cohesion: 0.12
Nodes (19): baseSchema, CreateParticipantInputType, UpdateParticipantInputType, BulkSessionAttendanceInputType, SessionAttendanceSchema, baseSchema, CreateSessionInputType, createSessionResponseSchema (+11 more)

### Community 122 - "user/user.controller.ts"
Cohesion: 0.53
Nodes (4): updateUserController(), userGetController(), userSearchController(), userRouter

### Community 123 - "Session handoff — ALL COMPLETED"
Cohesion: 0.50
Nodes (3): Session handoff — ALL COMPLETED, Status, What happened (2026-08-23)

### Community 124 - "UserRole"
Cohesion: 0.67
Nodes (3): UserRole, Express, Request

## Knowledge Gaps
- **460 isolated node(s):** `name`, `version`, `description`, `main`, `dev` (+455 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **53 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `normalizeDoc()` connect `normalizeDoc` to `reimbursement.routes.ts`, `ApiError`, `handle-settle.controller.ts`, `Notification`, `notice.controller.ts`, `calender.controller.ts`, `leave.controller.ts`, `admin.routes.ts`, `createKey`, `notification.controllers.ts`, `mail.controller.ts`, `search-bill.controller.ts`, `session.controller.ts`, `.success`, `user/user.controller.ts`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `ApiError` connect `ApiError` to `reimbursement.routes.ts`, `events.test.ts`, `handle-settle.controller.ts`, `env.ts`, `normalizeDoc`, `notice.controller.ts`, `calender.controller.ts`, `leave.controller.ts`, `admin.routes.ts`, `createKey`, `notification.controllers.ts`, `mail.controller.ts`, `search-bill.controller.ts`, `session.controller.ts`, `.success`, `user/user.controller.ts`, `login.controller.ts`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `createKey()` connect `createKey` to `ApiError`, `Notification`, `normalizeDoc`, `calender.controller.ts`, `exportReportController`, `admin.routes.ts`, `notification.controllers.ts`, `search-bill.controller.ts`, `session.controller.ts`, `user/user.controller.ts`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _460 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `reimbursement.routes.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11067193675889328 - nodes in this community are weakly interconnected._
- **Should `ApiError` be split into smaller, more focused modules?**
  _Cohesion score 0.06601146601146601 - nodes in this community are weakly interconnected._
- **Should `events.test.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11494252873563218 - nodes in this community are weakly interconnected._