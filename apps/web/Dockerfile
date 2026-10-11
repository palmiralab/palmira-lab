# syntax=docker/dockerfile:1

# Образ web (Next.js 16, standalone). Контекст сборки: КОРЕНЬ репозитория
# (нужен certs/ с российским CA-бандлом), Dockerfile лежит в apps/web.
#   docker build -f apps/web/Dockerfile -t palmira-web .
# Секретов в образе нет: GIGACHAT_*, DEEPSEEK_API_KEY, API_URL приходят
# переменными окружения при запуске (env_file в compose).

FROM node:24-slim AS build
WORKDIR /app

COPY apps/web/package.json apps/web/package-lock.json ./
RUN npm ci

COPY apps/web/tsconfig.json apps/web/next.config.ts apps/web/postcss.config.mjs ./
COPY apps/web/public ./public
COPY apps/web/src ./src
# Нужна память: Next собирает приложение в одном процессе.
RUN npm run build

FROM node:24-slim AS runtime
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# Российский корневой сертификат: без него TLS к GigaChat (ngw.devices.sberbank.ru)
# падает с «self signed certificate in certificate chain».
COPY certs/russian_trusted_ca_bundle.pem /app/certs/russian_trusted_ca_bundle.pem
ENV NODE_EXTRA_CA_CERTS=/app/certs/russian_trusted_ca_bundle.pem

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

USER node
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
