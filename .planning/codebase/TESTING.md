# Testing Patterns

**Analysis Date:** 2026-08-23 (updated post fix-plans 00–17)

## Test Framework

**Runner:**
- Vitest 4 (`vitest.config.ts`)

**Current state:** real suite exists — **15 test files / 233 tests, all passing** (2026-08-22). Note: AGENTS.md line "there is no test suite" is outdated.

**Run Commands:**
```bash
pnpm test              # vitest run — all tests
pnpm vitest run        # equivalent explicit form
npx vitest run tests/auth   # single module
```

**Coverage by module (tests/):** auth, admin, user, attendance, events, reimbursement, payroll, leave, mail, notice, calendar, notification, permission/authorize, libs/cron-secret, seeds/create-first-user. No worker/export-report tests (Puppeteer path untested).

## Test File Organization

**Location:**
- Separate `tests/` directory (e.g., `tests/auth/auth.test.ts`, `tests/attendance/attendance.test.ts`)

**Naming:**
- `*.test.ts`

## Test Structure

**Suite Organization:**
```typescript
describe('module name', () => {
  it('does something', async () => {
    // ...
  });
});
```

**Setup/Teardown:**
- Global setup in `tests/setup.ts`:
  - `MongoMemoryReplSet` for MongoDB.
  - Wipes database and Redis (`fake-redis.ts`) before each test.
  - Mocks external services (Resend, Redis client).

## Mocking

**Framework:** `vitest` (`vi.mock`)

**Patterns:**
- Mocking Redis: `vi.mock('../src/libs/redis/redis-client.js', ...)` in `tests/setup.ts` uses `tests/helpers/fake-redis.ts`.
- Mocking Mail: `vi.mock('../src/libs/mail/resend-send-mail.js', ...)` in `tests/setup.ts`.

## Fixtures and Helpers

**Test Helpers:**
- `tests/helpers/person.ts`: Creates users, manages login, and provides auth cookie (`Ctx` interface).
- `tests/helpers/account.ts`: Creates full account profiles (User + Media + Bank + Account).

**Test Data:**
- `seedRow` patterns inside test files.

## Common Patterns

**Async Testing:**
- Standard `async/await` with `supertest`.

**Authentication:**
- Use `mkPerson(role)` to get an authenticated `Ctx` object.
- Pass cookie: `.set('Cookie', ctx.cookie)` in `supertest` requests.

**Security regression tests (post fix-plans):**
- `tests/permission/authorize.test.ts` — role-permission matrix incl. removed read-bypass
- `tests/libs/cron-secret.test.ts` — timing-safe cron secret guard
- Auth tests cover session revocation, token hashing, generic login errors

---

*Testing analysis: 2026-08-23*
