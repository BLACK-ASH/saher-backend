# External Integrations

**Analysis Date: 2026-08-23**

## APIs & External Services

**Messaging & Notifications:**
- Resend - Email delivery service.
  - SDK/Client: `resend` package.
- Web Push - Browser push notifications.
  - SDK/Client: `web-push` package.

**Cloud/Automation:**
- Google APIs - General integration.
  - SDK/Client: `googleapis` package.
- Headless Chrome - Web scraping/automation.
  - SDK/Client: `puppeteer-core` package.

## Data Storage

**Databases:**
- MongoDB (via Mongoose)
  - Connection: Configured in `src/database/connection.ts`.
  - Client: Mongoose `9.1.3`.
- Redis
  - Used for: BullMQ jobs, caching.
  - Connection: Hardcoded `redis` host in `src/worker/` (assumes docker-compose setup).

## Authentication & Identity

**Auth Provider:**
- Custom Implementation
  - Implementation: JWT for sessions, `bcrypt` for password hashing.
  - Middleware: `src/libs/middleware/` (includes `protectedRoute`).

## Monitoring & Observability

**Error Tracking:**
- Pino logs (stdout/stderr).

**Metrics:**
- `prom-client` - Prometheus metrics instrumentation.

## CI/CD & Deployment

**Hosting:**
- Self-hosted Docker-based infrastructure.

**CI Pipeline:**
- GitHub Actions (defined in `.github/workflows/dev-deploy.yml`).

## Environment Configuration

**Required env vars:**
- Mongo URI, Redis host/port, Resend API key, JWT secrets, Seeder credentials.

**Secrets location:**
- Not stored in repo (uses `.env` files locally).

## Webhooks & Callbacks

**Incoming:**
- Health checks (via `src/public/` routes).

**Outgoing:**
- Email delivery (Resend).
- Push notification delivery (Web Push).

---

*Integration audit: 2026-08-23*
