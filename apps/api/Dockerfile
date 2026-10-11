# syntax=docker/dockerfile:1

# Образ API (NestJS 12 + Prisma 7). Контекст сборки: apps/api.
# Три стадии: build (всё для сборки), migrate (применение миграций), runtime
# (только то, что нужно для работы). Секретов в образе нет: .env в контекст не
# попадает (.dockerignore), всё приходит переменными окружения при запуске.

FROM node:24-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Prisma 7 читает DATABASE_URL уже при загрузке prisma.config.ts, даже для
# generate, хотя к базе при этом не подключается. Подставляем заглушку только
# на время этой команды, в образ она не попадает.
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build npx prisma generate

COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build

# Одноразовая стадия: `prisma migrate deploy` (нужен CLI Prisma из devDependencies).
# В compose это отдельный сервис, который запускается до API и завершается.
# openssl нужен нативному движку миграций Prisma (в slim-образе его нет).
FROM build AS migrate
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
CMD ["npx", "prisma", "migrate", "deploy"]

FROM node:24-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist

USER node
EXPOSE 3100

HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3100)+'/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/main"]
