<div align="center">

# cft.audit

Внутренний сервис для работы с результатами аудитов безопасности финансовых систем.

![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=000000)
![Mantine](https://img.shields.io/badge/Mantine-7-339AF0?style=for-the-badge&logo=mantine&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Auth.js](https://img.shields.io/badge/Auth.js-v5-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3-3E67B1?style=for-the-badge&logo=zod&logoColor=white)
![Sentry](https://img.shields.io/badge/Sentry-362D59?style=for-the-badge&logo=sentry&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-4-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-1.59-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white)

</div>

## Демо

Задеплоено на собственный VPS, доступно без VPN:

**→ <http://85.198.108.217/login>**

Тестовые учётки указаны под формой входа — нажатие на карточку подставляет email+пароль.

![Страница входа](docs/login.png)

## Про задачу

Тестовое задание от **[ЦФТ](https://www.cft.ru/)** (Центр Финансовых Технологий) — крупная российская ИТ-компания, разработчик ПО для банков и финансовых рынков.

Суть — собрать внутренний веб-сервис, в котором аналитики компании работают с результатами аудитов безопасности финансовых систем: смотрят записи, фильтруют, меняют статус, комментируют, строят аналитику и считают риск-скор / SLA / соответствие через встроенные калькуляторы. Доступ — только для сотрудников, роли четыре (ADMIN, L1, L2, L3) с разным объёмом прав.

## Что реализовано

- **Авторизация + RBAC** — 4 роли с матрицей прав. Проверка на server actions (источник правды) + UI-гейтинг кнопок.
- **Список аудитов** — URL-state поиск, фильтры-popover по критичности / статусу / системе / ответственному / диапазону дат, сортировка, пагинация, prefetch карточки по ховеру.
- **Карточка аудита** — детали, комментарии, timeline истории действий, role-gated операции (смена статуса — L2+, смена критичности + подтверждение решения — L3+).
- **Дашборд** — 4 stat-тайла + динамика обнаружения/устранения + донут по критичности + бары по статусам и топ-10 систем, расширенная аналитика для L3+.
- **Калькуляторы** — Риск / SLA / Соответствие. Все чистые функции, покрыты юнит-тестами.
- **Управление пользователями** — просмотр, inline-смена роли, модалка с описанием прав каждой роли, создание юзера (ADMIN-only).
- **Светлая / тёмная тема** — переключатель в шапке, весь UI на CSS-переменных.

## Быстрый старт

```bash
docker compose up -d --build
```

Это соберёт образ, поднимет PostgreSQL, применит миграции и посеет тестовые данные. Сервис откроется на <http://localhost:3001>.

Если хочется разрабатывать — ниже.

### Локально

```bash
docker compose up -d postgres   # только БД
pnpm install
pnpm prisma migrate deploy
pnpm prisma db seed
pnpm dev
```

Dev-сервер: <http://localhost:3000>.

## Тестовые учётки

Пароль у всех один: `password123`.

| Email | Роль | Имя |
|---|---|---|
| `admin@cft.local` | ADMIN | Анна Администратор |
| `l3@cft.local` | L3 | Сергей Эксперт |
| `l2@cft.local` | L2 | Мария Аналитик |
| `l1@cft.local` | L1 | Иван Новиков |

## Роли и права

| Право | L1 | L2 | L3 | ADMIN |
|---|:-:|:-:|:-:|:-:|
| Просмотр списка и карточек, фильтры, дашборд, калькуляторы | ✓ | ✓ | ✓ | ✓ |
| Смена статуса, комментарии, редактирование аналитических полей |   | ✓ | ✓ | ✓ |
| Смена критичности, подтверждение финального решения, расширенная аналитика |   |   | ✓ | ✓ |
| Управление пользователями |   |   |   | ✓ |

## Стек и зачем

- **Next.js 14 (App Router) + TypeScript** — server components, server actions, встроенный SSR, типы сквозные.
- **Prisma + PostgreSQL** — схема в одном файле, миграции под контролем, типобезопасные запросы.
- **Auth.js (NextAuth v5)** — credentials-провайдер с bcrypt, JWT-сессия, middleware гардит `/audits`, `/dashboard`, `/calculators`, `/users`.
- **Mantine v7 + SCSS-модули** — UI-кит с поддержкой тем, кастомные стили поверх через CSS-переменные.
- **@mantine/charts** — донат, ареа-чарт, бары на дашборде (под капотом recharts).
- **Zod** — валидация форм и входов server actions.
- **Sentry** — no-op без DSN; при `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_DSN` начинает ловить ошибки клиента и сервера.
- **Vitest** — юнит-тесты на чистые функции (калькуляторы, rbac, валидаторы) — 89 кейсов.
- **Playwright** — e2e-сценарии (логин, фильтрация, смена статуса по ролям, калькуляторы).
- **Docker + Compose** — один `up --build` поднимает всё.
- **GitHub Actions** — CI на каждый PR (lint + tsc + vitest + playwright с сервисным Postgres), Deploy на push в `main` (build → push в GHCR → SSH на прод → `docker compose pull && up`).

## Структура

```
prisma/
  schema.prisma               # модель: User, System, AuditResult, Comment, ActivityLog
  seed.ts                     # идемпотентный upsert по email/name — id стабильны между рестартами
src/
  app/
    (auth)/login/             # страница входа (сплит + canvas-волна + preset-логины)
    (app)/                    # защищённая зона: sidebar + header + контент
      audits/                 # список + фильтры-popover + таблица
      audits/[id]/            # карточка: header, info, комменты, timeline, action bar
      dashboard/              # stat-тайлы + 4 графика
      calculators/{risk,sla,compliance}/
      users/                  # ADMIN-only, таблица + матрица прав
    api/auth/[...nextauth]/   # NextAuth handlers
    layout.tsx
  lib/                        # rbac, calculators, validators, prisma singleton
  server/auth.ts              # NextAuth config
  middleware.ts               # гард роутов
  components/
    layout/                   # Sidebar, Header, ThemeToggle
    ui/                       # Card, StatTile, SeverityBadge, StatusBadge, RoleBadge
  styles/                     # CSS-переменные + тема Mantine
tests/
  unit/                       # calculators, rbac, validators (vitest)
  e2e/                        # auth, список, карточка по ролям, калькуляторы, админка (playwright)
.github/workflows/            # ci.yml (тесты) + deploy.yml (GHCR + SSH)
```

## Команды

| Команда | Что делает |
|---|---|
| `pnpm dev` | Dev-сервер на 3000 |
| `pnpm build` | Прод-сборка |
| `pnpm start` | Запуск прод-сборки |
| `pnpm lint` | ESLint |
| `pnpm test:unit` | Юнит-тесты (vitest) |
| `pnpm test:e2e` | E2E (playwright, нужен запущенный сервер на `PLAYWRIGHT_BASE_URL`) |
| `pnpm db:migrate` | `prisma migrate dev` |
| `pnpm db:seed` | Посев тестовых данных |
| `pnpm db:reset` | Сброс БД |
| `pnpm db:studio` | Prisma Studio |

## CI / Deploy

Два workflow в `.github/workflows/`:

- **`ci.yml`** — триггерится на PR и push. Параллельно: lint + tsc → unit-тесты → e2e (Postgres services-контейнер, собирается билд, стартует `next start`, гоняется playwright, отчёт идёт в артефакты).
- **`deploy.yml`** — на push в `main`. Собирает Docker-образ, пушит в GHCR с тегами `latest` и `sha-<short>`, по SSH заходит на VPS, логинится в GHCR ephemeral-токеном, `docker compose pull && up -d`, чистит старые слои.

Секреты в Repository Settings → Secrets: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`. `GITHUB_TOKEN` используется автоматически.

## Про хостинг

Продакшен крутится на Ubuntu 24.04 VPS по адресу `85.198.108.217`. Контейнеров два: `cft-app` (Next.js + миграции + сид при старте) и `cft-postgres` (volume `postgres-data`). Порт хоста 80 проксируется на 3000 контейнера. HTTPS пока не настроен — это первое, что стоит поднять при привязке домена (Caddy + Let's Encrypt).

## Что не сделано, но стоит

- Откалибровать оставшиеся селекторы в e2e-тестах (сейчас `continue-on-error` в CI)
- TLS через Caddy/nginx
- Rate limiting на login и server actions
- 2FA для ADMIN и L3
- Уведомления (email + SSE) на приближение SLA, смену статуса, новый комментарий
- Экспорт CSV / PDF по отчёту
