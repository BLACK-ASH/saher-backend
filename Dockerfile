# =========================
# Base image (tooling only)
# =========================
FROM node:24-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN apk add --no-cache \
  curl \
  chromium \
  nss \
  freetype \
  harfbuzz \
  ca-certificates \
  ttf-freefont

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# =========================
# Install production deps
# =========================
FROM base AS prod-deps

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm install --prod --frozen-lockfile

# =========================
# Build stage
# =========================
FROM base AS build

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

# =========================
# Final runtime image
# =========================
FROM node:24-alpine AS runner

WORKDIR /app

RUN apk add --no-cache \
  chromium \
  nss \
  freetype \
  harfbuzz \
  ca-certificates \
  ttf-freefont \
  curl

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# production dependencies only
COPY --from=prod-deps /app/node_modules ./node_modules

# compiled output
COPY --from=build /app/dist ./dist

# optional
COPY package.json ./

EXPOSE 4000

CMD ["node", "dist/index.js"]
