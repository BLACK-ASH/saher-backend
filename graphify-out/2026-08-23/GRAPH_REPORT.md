# Graph Report - saher-backend  (2026-08-23)

## Corpus Check
- 237 files · ~75,782 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1201 nodes · 3081 edges · 111 communities (62 shown, 49 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 159 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7c1cf63f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- error-handler.ts
- agent.md project overview
- normalizeDoc
- program-participant.controller.ts
- redis-client.ts
- dependencies
- session-attendance.controller.ts
- src/index.ts
- image.controller.ts
- scripts
- calender.controller.ts
- leave.controller.ts
- exportReportController
- authorize.ts
- compilerOptions
- Security Review Checklist Skill
- mail.controller.ts
- reimbursement.routes.ts
- escapeHtml
- Saher Community Code of Conduct
- Fix Report — running summary
- program.controller.ts
- eslint
- eslint-config-prettier
- eslint-plugin-import
- eslint-plugin-unicorn
- globals
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
- attendance-report.ts
- user/user.controller.ts
- @types/web-push
- typescript
- typescript-eslint
- @typescript-eslint/parser
- no-res-json.ts
- Dev Deploy CI Pipeline
- Worker Puppeteer Resource Leaks
- pnpm allowBuilds Native Build Allowlist
- Redocly Docs Config
- Vulnerability Reporting Policy
- session.controller.ts
- cspell
- events.routes.ts
- program.schema.ts
- session.schema.ts
- account.ts
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
- cors
- http-logger.ts
- express
- dotenv
- express-rate-limit
- mongoose
- webpush.controller.ts
- puppeteer-core
- redis
- multer
- sharp
- ua-parser-js
- web-push
- zod
- pino-pretty
- prettier
- @types/dompurify
- @typescript-eslint/eslint-plugin
- pino-http
- env.ts
- prom-client
- notification.controllers.ts
- .success
- @redocly/cli
- @commitlint/config-conventional
- participant.schema.ts
- dompurify

## God Nodes (most connected - your core abstractions)
1. `agent.md project overview` - 102 edges
2. `createKey()` - 92 edges
3. `normalizeDoc()` - 83 edges
4. `ApiError` - 74 edges
5. `ApiResponse` - 67 edges
6. `deleteCache()` - 52 edges
7. `setCache()` - 37 edges
8. `getCache()` - 35 edges
9. `standardDateString()` - 31 edges
10. `Fix Report — running summary` - 26 edges

## Surprising Connections (you probably didn't know these)
- `Add Module Recipe Skill` --references--> `Admin Module Authorization Gaps`  [INFERRED]
  .opencode/skill/add-module/SKILL.md → MODULE_ANALYSIS.md
- `Security Review Checklist Skill` --references--> `Admin Module Authorization Gaps`  [EXTRACTED]
  .opencode/skill/security-review/SKILL.md → MODULE_ANALYSIS.md
- `Backend Dev Workflow Skill` --references--> `Attendance Cron & Timezone Races`  [INFERRED]
  .opencode/skill/backend-dev/SKILL.md → MODULE_ANALYSIS.md
- `saher-dev OpenCode Agent` --conceptually_related_to--> `Auth Session Lifecycle Flaws`  [INFERRED]
  .opencode/agent/saher-dev.md → MODULE_ANALYSIS.md
- `Security Review Checklist Skill` --references--> `Cache Invalidation Gaps`  [EXTRACTED]
  .opencode/skill/security-review/SKILL.md → MODULE_ANALYSIS.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Project Governance Docs** — readme_saher_backend_project_stub, security_md_vulnerability_reporting_policy, code_of_conduct_community_code_of_conduct [INFERRED 0.75]
- **OpenCode Agent Tooling Config** — _opencode_agent_saher_dev_saher_dev_agent, _opencode_skill_add_module_skill_add_module_recipe, _opencode_skill_backend_dev_skill_backend_dev_workflow, _opencode_skill_security_review_skill_security_audit_checklist [INFERRED 0.85]

## Communities (111 total, 49 thin omitted)

### Community 1 - "agent.md project overview"
Cohesion: 0.02
Nodes (102): agent.md project overview, Assistant (Saher-Dev · OmniRoute Auto · 101.5s), Assistant (Saher-Dev · OmniRoute Auto · 107.1s), Assistant (Saher-Dev · OmniRoute Auto · 107.5s), Assistant (Saher-Dev · OmniRoute Auto · 10.0s), Assistant (Saher-Dev · OmniRoute Auto · 10.1s), Assistant (Saher-Dev · OmniRoute Auto · 10.4s), Assistant (Saher-Dev · OmniRoute Auto · 11.4s) (+94 more)

### Community 2 - "normalizeDoc"
Cohesion: 0.06
Nodes (84): getAccountByUser(), getUser(), retrieveCustomAttendace(), retrieveTypeMonthAttendance(), retrieveTypeTodayAttendance(), retrieveTypeWeekAttendance(), retrieveTypeYearAttendance(), getAllAttendanceCorrectionController() (+76 more)

### Community 3 - "program-participant.controller.ts"
Cohesion: 0.29
Nodes (6): Program, programSchema, ProgramType, addParticipantsToProgram(), getParticipantsFromProgram(), removeParticipantFromProgram()

### Community 4 - "redis-client.ts"
Cohesion: 0.33
Nodes (6): connectDb(), logger, getResend(), bullmqConnection, connectRedis(), redisUrl

### Community 5 - "dependencies"
Cohesion: 0.11
Nodes (19): bcrypt, bullmq, cookie-parser, googleapis, @js-temporal/polyfill, jsdom, jsonwebtoken, dependencies (+11 more)

### Community 6 - "session-attendance.controller.ts"
Cohesion: 0.15
Nodes (15): Participant, participantSchema, ParticipantType, attendanceSchema, Session, sessionAttendance, SessionAttendanceType, sessionSchema (+7 more)

### Community 7 - "src/index.ts"
Cohesion: 0.14
Nodes (14): adminRouter, attendanceRouter, authRouter, apiLimiter, app, authLimiter, httpRequestDuration, httpRequestTotal (+6 more)

### Community 8 - "image.controller.ts"
Cohesion: 0.23
Nodes (7): uploadImageController(), storage, supportedFileMimeType, uploadImage, processAndSaveImage(), uploadPath, uploadRouter

### Community 9 - "scripts"
Cohesion: 0.11
Nodes (18): scripts, build, clean, dev, dev:worker, docs:build, docs:dev, docs:lint (+10 more)

### Community 10 - "calender.controller.ts"
Cohesion: 0.15
Nodes (20): calendarRouter, createCalendarEventSchema, event, EventT, eventType, updateCalendarEventSchema, getCalendarEventByMonth(), syncGoogleHolidaysController() (+12 more)

### Community 11 - "leave.controller.ts"
Cohesion: 0.08
Nodes (38): LeaveBalance, leaveBalanceSchema, leaveActionTypes, LeaveLog, leaveLogSchema, Leave, leaveSchema, LeaveTypes (+30 more)

### Community 12 - "exportReportController"
Cohesion: 0.22
Nodes (6): exportReportController(), BaseOptions, CustomOptions, DateRange, DateRangeResult, LastDaysOptions

### Community 13 - "authorize.ts"
Cohesion: 0.11
Nodes (20): payrollSchema, PayrollType, salaryMode, salaryStatus, getAllPayrollController(), getPayrollByPayrollIdController(), getPayrollByUserIdController(), payrollRouter (+12 more)

### Community 14 - "compilerOptions"
Cohesion: 0.12
Nodes (15): node, src, src/payroll/update-payroll.controller.ts, compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution (+7 more)

### Community 15 - "Security Review Checklist Skill"
Cohesion: 0.27
Nodes (10): saher-dev OpenCode Agent, Add Module Recipe Skill, Backend Dev Workflow Skill, Security Review Checklist Skill, Admin Module Authorization Gaps, Attendance Cron & Timezone Races, Auth Session Lifecycle Flaws, Cache Invalidation Gaps (+2 more)

### Community 16 - "mail.controller.ts"
Cohesion: 0.15
Nodes (18): Mail, mailSchema, Mailtype, getInboxMails(), sendMail(), SendMailPayload, sendMailUtilitySchema, getInboxController() (+10 more)

### Community 17 - "reimbursement.routes.ts"
Cohesion: 0.05
Nodes (56): AuditLog, auditLogSchema, AuditLogType, Bill, billSchema, billStatus, BillType, modes (+48 more)

### Community 18 - "escapeHtml"
Cohesion: 0.16
Nodes (14): changeEmailTemplate(), Props, changePasswordTemplate(), Props, forgotPasswordTemplate(), Props, onboardEmailTemplate(), Props (+6 more)

### Community 20 - "Fix Report — running summary"
Cohesion: 0.07
Nodes (26): 00-cross-cutting ✅ — commit `72c33ac` (branch `fix/module-fixes`, 2026-08-22), 01-admin ✅ — branch `fix/module-fixes`, 2026-08-22, 02-attendance ✅ (Chunks A–D) — branch `fix/module-fixes`, 2026-08-22, 03-auth ✅ — branch `fix/module-fixes`, 2026-08-22, 04-calendar ✅ — branch `fix/module-fixes`, 2026-08-22, 05-database ✅ (+ 01-admin CRIT completion) — branch `fix/module-fixes`, 2026-08-22, 06-events ✅ — branch `fix/module-fixes`, 2026-08-22, 07-libs ✅ — branch `fix/module-fixes`, 2026-08-22 (+18 more)

### Community 21 - "program.controller.ts"
Cohesion: 0.25
Nodes (7): participantResponseSchema, addProgram(), deleteProgram(), editProgram(), getPrograms(), getSingleProgram(), undoDeleteProgram()

### Community 29 - "devDependencies"
Cohesion: 0.22
Nodes (9): @commitlint/cli, devDependencies, @commitlint/cli, @types/jsdom, @types/node, @types/pino-http, @types/jsdom, @types/node (+1 more)

### Community 38 - "attendance-report.ts"
Cohesion: 0.43
Nodes (5): getBrowser(), attendanceReportWorker, generateAttendanceReportPdf(), renderJob(), tempPath

### Community 39 - "user/user.controller.ts"
Cohesion: 0.09
Nodes (24): Notice, noticeSchema, NoticeType, underDevelopment(), validate(), validateAsync(), addNotice(), editNotice() (+16 more)

### Community 55 - "session.controller.ts"
Cohesion: 0.53
Nodes (5): deleteSession(), editSession(), getSingleSession(), invalidateCalendarCache(), undoDeleteSession()

### Community 57 - "events.routes.ts"
Cohesion: 0.20
Nodes (15): eventRouter, addParticipantController(), deleteParticipantController(), editParticipantController(), getParticipantByIdController(), getParticipants(), undoDeleteParticipantController(), participantSchema (+7 more)

### Community 58 - "program.schema.ts"
Cohesion: 0.12
Nodes (15): addParticipantsToProgramSchema, baseProgramSchema, CreateProgramInputType, createProgramParticipantsResponseSchema, createProgramSchema, programResponseSchema, updatedProgramSchema, UpdateProgramInputType (+7 more)

### Community 59 - "session.schema.ts"
Cohesion: 0.20
Nodes (9): baseSchema, CreateSessionInputType, createSessionResponseSchema, createSessionSchema, sessionResponse, SessionResponseT, UpdatedSessionInputType, updatedSessionSchema (+1 more)

### Community 60 - "account.ts"
Cohesion: 0.07
Nodes (41): accountGetController(), accountBaseSchema, AccountRegisterInput, accountSchema, AccountUpdateInput, accountUpdateSchema, userSchema, BankRegisterType (+33 more)

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

### Community 83 - "http-logger.ts"
Cohesion: 0.50
Nodes (3): httpLogger, Req, Res

### Community 88 - "webpush.controller.ts"
Cohesion: 0.33
Nodes (7): PushNotificationType, PushSubscription, pushSubscriptionSchema, ensureVapid(), sendPushToUser(), subscribePushController(), subscribeSchema

### Community 103 - "env.ts"
Cohesion: 0.36
Nodes (5): corsOrigins, env, envSchema, requireCronSecret(), safeEqual()

### Community 109 - "notification.controllers.ts"
Cohesion: 0.11
Nodes (28): Notification, notificationActionTypes, notificationMethod, notificationSchema, notificationScope, NotificationType, notificationTypes, Notification (+20 more)

### Community 110 - ".success"
Cohesion: 0.08
Nodes (72): accountRegisterController(), accountUpdateController(), accountRegisterSchema, createBankDetailController(), deleteBankDetailController(), getBankDetailController(), updateBankDetailController(), getBank() (+64 more)

### Community 115 - "participant.schema.ts"
Cohesion: 0.23
Nodes (10): baseSchema, CreateParticipantInputType, UpdateParticipantInputType, BulkSessionAttendanceInputType, SessionAttendanceSchema, imageType, objectId(), optionalAlphaText() (+2 more)

## Knowledge Gaps
- **469 isolated node(s):** `name`, `version`, `description`, `main`, `dev` (+464 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **49 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `normalizeDoc()` connect `normalizeDoc` to `user/user.controller.ts`, `calender.controller.ts`, `leave.controller.ts`, `notification.controllers.ts`, `.success`, `authorize.ts`, `mail.controller.ts`, `reimbursement.routes.ts`, `program.controller.ts`, `session.controller.ts`, `events.routes.ts`, `account.ts`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `ApiError` connect `normalizeDoc` to `error-handler.ts`, `program-participant.controller.ts`, `session-attendance.controller.ts`, `env.ts`, `user/user.controller.ts`, `image.controller.ts`, `calender.controller.ts`, `leave.controller.ts`, `notification.controllers.ts`, `.success`, `authorize.ts`, `mail.controller.ts`, `reimbursement.routes.ts`, `program.controller.ts`, `session.controller.ts`, `webpush.controller.ts`, `events.routes.ts`, `account.ts`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `ApiResponse` connect `normalizeDoc` to `program-participant.controller.ts`, `session-attendance.controller.ts`, `user/user.controller.ts`, `image.controller.ts`, `calender.controller.ts`, `leave.controller.ts`, `notification.controllers.ts`, `.success`, `authorize.ts`, `mail.controller.ts`, `reimbursement.routes.ts`, `program.controller.ts`, `session.controller.ts`, `webpush.controller.ts`, `events.routes.ts`, `account.ts`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _469 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `agent.md project overview` be split into smaller, more focused modules?**
  _Cohesion score 0.019417475728155338 - nodes in this community are weakly interconnected._
- **Should `normalizeDoc` be split into smaller, more focused modules?**
  _Cohesion score 0.06058221872541306 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._