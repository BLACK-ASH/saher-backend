FROM node:24-alpine

RUN apk add --no-cache curl chromium nss freetype harfbuzz ca-certificates ttf-freefont

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

RUN corepack enable

COPY package.json ./

RUN pnpm install

COPY . .

RUN pnpm build

EXPOSE 4000

CMD ["pnpm","start"]



