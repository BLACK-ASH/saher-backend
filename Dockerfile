FROM node:24-alpine

RUN apk add --no-cache curl

WORKDIR /app

RUN npm i -g pnpm

COPY package.json ./

RUN pnpm install

COPY . .

RUN pnpm build

EXPOSE 4000

CMD ["pnpm","start"]



