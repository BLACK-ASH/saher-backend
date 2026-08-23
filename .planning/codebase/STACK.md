# Technology Stack

**Analysis Date:** 2026-08-23

## Languages

**Primary:**
- TypeScript 5.9.3 - `package.json`

## Runtime

**Environment:**
- Node.js (NodeNext resolution) - `tsconfig.json`

**Package Manager:**
- pnpm 11.0.9 - `package.json`
- Lockfile: `pnpm-lock.yaml`

## Frameworks

**Core:**
- Express 5.2.1 - `package.json`
- Mongoose 9.1.3 - `package.json`

**Testing:**
- Vitest 4.1.11 - `package.json`

**Build/Dev:**
- tsx 4.21.0 - `package.json`

## Key Dependencies

**Critical:**
- zod 4.3.5 - Schema validation
- pino 10.3.1 - Logging
- bullmq 5.77.6 - Background workers
- redis 5.12.1 - Caching & queue storage

**Infrastructure:**
- puppeteer-core 24.43.0 - Browser automation
- resend 6.12.0 - Email service
- googleapis 173.0.0 - GCP integration

## Configuration

**Environment:**
- `dotenv` (loaded in `src/index.ts`)

**Build:**
- `tsconfig.json`

## Platform Requirements

**Development:**
- `pnpm dev`, `pnpm dev:worker`

**Production:**
- Docker-based deployment - `Dockerfile`, `Dockerfile.dev`

---

*Stack analysis: 2026-08-23*
