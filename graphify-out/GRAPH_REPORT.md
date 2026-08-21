# Graph Report - saher-backend  (2026-08-21)

## Corpus Check
- Corpus is ~36,487 words - fits in a single context window. You may not need a graph.

## Summary
- 693 nodes · 1912 edges · 55 communities (23 shown, 32 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 100 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Auth & Account Core
- Attendance Cron & Marking
- Admin Controllers
- Account Schemas
- Bank & User Admin
- Runtime Dependencies
- User Schema Types
- Router Wiring & DB
- Notification Model
- Package Manifest
- Calendar Module
- Attendance Retrieval
- Report Export
- Media Upload Model
- Module Cluster 14
- Module Cluster 15
- Module Cluster 16
- Module Cluster 17
- Module Cluster 18
- Module Cluster 19
- Module Cluster 20
- Module Cluster 21
- Module Cluster 22
- Module Cluster 23
- Module Cluster 24
- Module Cluster 25
- Module Cluster 26
- Module Cluster 27
- Module Cluster 28
- Module Cluster 29
- Module Cluster 30
- Module Cluster 31
- Module Cluster 32
- Module Cluster 33
- Module Cluster 34
- Module Cluster 35
- Module Cluster 36
- Module Cluster 37
- Module Cluster 38
- Module Cluster 39
- Module Cluster 40
- Module Cluster 41
- Module Cluster 42
- Module Cluster 43
- Module Cluster 44
- Module Cluster 47
- Module Cluster 50
- Module Cluster 51
- Module Cluster 52
- Module Cluster 53

## God Nodes (most connected - your core abstractions)
1. `createKey()` - 77 edges
2. `ApiError` - 48 edges
3. `ApiResponse` - 47 edges
4. `deleteCache()` - 44 edges
5. `normalizeDoc()` - 43 edges
6. `setCache()` - 29 edges
7. `getCache()` - 27 edges
8. `standardDateString()` - 25 edges
9. `getAccountByUser()` - 20 edges
10. `deleteCacheGroup()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `saher-dev OpenCode Agent` --conceptually_related_to--> `Auth Session Lifecycle Flaws`  [INFERRED]
  .opencode/agent/saher-dev.md → MODULE_ANALYSIS.md
- `Add Module Recipe Skill` --references--> `Admin Module Authorization Gaps`  [INFERRED]
  .opencode/skill/add-module/SKILL.md → MODULE_ANALYSIS.md
- `Backend Dev Workflow Skill` --references--> `Attendance Cron & Timezone Races`  [INFERRED]
  .opencode/skill/backend-dev/SKILL.md → MODULE_ANALYSIS.md
- `Backend Dev Workflow Skill` --references--> `RBAC Read Action Bypass`  [INFERRED]
  .opencode/skill/backend-dev/SKILL.md → MODULE_ANALYSIS.md
- `Security Review Checklist Skill` --references--> `Admin Module Authorization Gaps`  [EXTRACTED]
  .opencode/skill/security-review/SKILL.md → MODULE_ANALYSIS.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **OpenCode Agent Tooling Config** — _opencode_agent_saher_dev_saher_dev_agent, _opencode_skill_add_module_skill_add_module_recipe, _opencode_skill_backend_dev_skill_backend_dev_workflow, _opencode_skill_security_review_skill_security_audit_checklist [INFERRED 0.85]
- **Project Governance Docs** — readme_saher_backend_project_stub, security_md_vulnerability_reporting_policy, code_of_conduct_community_code_of_conduct [INFERRED 0.75]

## Communities (55 total, 32 thin omitted)

### Community 0 - "Auth & Account Core"
Cohesion: 0.05
Nodes (56): accountRegisterSchema, attendanceReportQueue, authRouter, changeEmailRequestController(), changePasswordRequestController(), forgotPasswordRequestController(), loginController(), LoginInputSchema (+48 more)

### Community 1 - "Attendance Cron & Marking"
Cohesion: 0.06
Nodes (53): createAttendanceCron(), rejectMarkSchema, RejectMarkT, attendanceListSchema, AttendanceListT, attendanceResponseSchema, NOTE: Make only one not multiple, Attendance (+45 more)

### Community 2 - "Admin Controllers"
Cohesion: 0.09
Nodes (40): accountGetController(), accountRegisterController(), getBankDetailController(), accountSchemaFinal, AccountT, getAccount(), getAccountByUser(), bankSchemaFinal (+32 more)

### Community 3 - "Account Schemas"
Cohesion: 0.07
Nodes (34): accountBaseSchema, AccountRegisterInput, accountSchema, AccountUpdateInput, accountUpdateSchema, userSchema, adminRouter, createBankDetailController() (+26 more)

### Community 4 - "Bank & User Admin"
Cohesion: 0.12
Nodes (41): accountUpdateController(), deleteBankDetailController(), updateBankDetailController(), getAllUsersController(), userDeleteController(), userGetController(), userRestoreController(), userUpdateController() (+33 more)

### Community 5 - "Runtime Dependencies"
Cohesion: 0.05
Nodes (43): bcrypt, bullmq, cookie-parser, cors, dotenv, express, googleapis, @js-temporal/polyfill (+35 more)

### Community 6 - "User Schema Types"
Cohesion: 0.07
Nodes (29): shortUserSchema, userSchemaFinal, UserT, attendanceChangesSchema, AttendanceCorrectionHandleInputType, attendanceCorrectionHandleSchema, AttendanceCorrectionInputType, AttendanceCorrectionResponse (+21 more)

### Community 7 - "Router Wiring & DB"
Cohesion: 0.09
Nodes (24): attendanceRouter, calendarRouter, connectDb(), PushNotificationType, PushSubscription, pushSubscriptionSchema, eventRouter, app (+16 more)

### Community 8 - "Notification Model"
Cohesion: 0.11
Nodes (29): Notification, notificationActionTypes, notificationMethod, notificationSchema, notificationScope, NotificationType, notificationTypes, Notification (+21 more)

### Community 9 - "Package Manifest"
Cohesion: 0.07
Nodes (26): author, description, keywords, license, main, name, packageManager, scripts (+18 more)

### Community 10 - "Calendar Module"
Cohesion: 0.15
Nodes (21): CalendarObjectT, createMeetingSchema, event, EventT, eventType, deleteCalendarEventController(), getCalendarEventByMonth(), syncGoogleHolidaysController() (+13 more)

### Community 11 - "Attendance Retrieval"
Cohesion: 0.22
Nodes (15): retrieveCustomAttendace(), retrieveTypeMonthAttendance(), retrieveTypeTodayAttendance(), retrieveTypeWeekAttendance(), retrieveTypeYearAttendance(), AttendanceResponseT, retrieveAttendanceController(), getBrowser() (+7 more)

### Community 12 - "Report Export"
Cohesion: 0.22
Nodes (6): exportReportController(), BaseOptions, CustomOptions, DateRange, DateRangeResult, LastDaysOptions

### Community 13 - "Media Upload Model"
Cohesion: 0.17
Nodes (10): meadiaSchema, Media, MediaType, uploadImageController(), storage, supportedFileMimeType, uploadImage, processAndSaveImage() (+2 more)

### Community 14 - "Module Cluster 14"
Cohesion: 0.13
Nodes (14): node, src, compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, outDir (+6 more)

### Community 15 - "Module Cluster 15"
Cohesion: 0.27
Nodes (10): saher-dev OpenCode Agent, Add Module Recipe Skill, Backend Dev Workflow Skill, Security Review Checklist Skill, Admin Module Authorization Gaps, Attendance Cron & Timezone Races, Auth Session Lifecycle Flaws, Cache Invalidation Gaps (+2 more)

### Community 16 - "Module Cluster 16"
Cohesion: 0.22
Nodes (9): @commitlint/cli, devDependencies, @commitlint/cli, pino-pretty, prettier, @typescript-eslint/eslint-plugin, pino-pretty, prettier (+1 more)

### Community 17 - "Module Cluster 17"
Cohesion: 0.29
Nodes (6): InputType, RegisterInputType, registerSchema, updateSchema, validateRegisterInput(), validateUpdateInput()

## Knowledge Gaps
- **207 isolated node(s):** `name`, `version`, `description`, `main`, `dev` (+202 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **32 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createKey()` connect `Bank & User Admin` to `Auth & Account Core`, `Attendance Cron & Marking`, `Admin Controllers`, `User Schema Types`, `Router Wiring & DB`, `Notification Model`, `Calendar Module`, `Report Export`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `ApiResponse` connect `Attendance Cron & Marking` to `Auth & Account Core`, `Admin Controllers`, `Account Schemas`, `Bank & User Admin`, `User Schema Types`, `Router Wiring & DB`, `Notification Model`, `Calendar Module`, `Attendance Retrieval`, `Module Cluster 17`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `ApiError` connect `Attendance Cron & Marking` to `Auth & Account Core`, `Admin Controllers`, `Account Schemas`, `Bank & User Admin`, `User Schema Types`, `Router Wiring & DB`, `Notification Model`, `Calendar Module`, `Attendance Retrieval`, `Media Upload Model`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _207 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Auth & Account Core` be split into smaller, more focused modules?**
  _Cohesion score 0.05289450484866295 - nodes in this community are weakly interconnected._
- **Should `Attendance Cron & Marking` be split into smaller, more focused modules?**
  _Cohesion score 0.06022282445046673 - nodes in this community are weakly interconnected._
- **Should `Admin Controllers` be split into smaller, more focused modules?**
  _Cohesion score 0.09220779220779221 - nodes in this community are weakly interconnected._