FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl tzdata
# Intl.DateTimeFormat на сервере использует TZ контейнера — фиксируем, иначе SSR/hydration расходятся
ENV TZ=Europe/Moscow
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
WORKDIR /app

FROM base AS build
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm prisma generate
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=build /app ./
EXPOSE 3000

# миграции применяем при старте; сид опционально — через RUN_SEED=true
CMD ["sh", "-c", "pnpm prisma migrate deploy && if [ \"$RUN_SEED\" = \"true\" ]; then pnpm tsx prisma/seed.ts; fi && pnpm start -H 0.0.0.0"]
