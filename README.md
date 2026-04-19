# cft.audit

Внутренний сервис управления результатами аудитов безопасности финансовых систем ЦФТ.

## Стек

- Next.js 14 (App Router) + TypeScript (strict)
- Prisma + PostgreSQL 16
- NextAuth.js v5 (credentials, JWT)
- Mantine v7 + SCSS modules
- @mantine/charts (Recharts)
- pnpm

## Требования

- Docker + Docker Compose
- Опционально для локальной разработки: Node.js 20+, pnpm 9+

## Быстрый старт (только Docker)

```bash
docker compose up -d --build
```

Это соберёт образ, поднимет PostgreSQL, применит миграции и посеет тестовые данные.

Сервис: <http://localhost:3001>
PostgreSQL: `localhost:5433` (внутри compose — `postgres:5432`)

Порты смещены с дефолтных 3000/5432 — на случай коллизий с другими локальными сервисами. Если хочешь вернуть оригинальные — поправь в `docker-compose.yml`.

Сид выполняется при каждом рестарте контейнера (переменная `RUN_SEED=true`). Чтобы отключить — установи `RUN_SEED=false`. Сид удаляет всё и наполняет заново, так что данные, введённые через UI, не сохранятся между рестартами, пока сид включён.

## Локальная разработка (без Docker для app)

```bash
docker compose up -d postgres
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Dev-сервер: <http://localhost:3000>

## Тестовые учётки

Пароль у всех: `password123`.

| Email              | Роль   | Имя                  |
| ------------------ | ------ | -------------------- |
| admin@cft.local    | ADMIN  | Анна Администратор   |
| l3@cft.local       | L3     | Сергей Эксперт       |
| l2@cft.local       | L2     | Мария Аналитик       |
| l1@cft.local       | L1     | Иван Новиков         |

## Роли и права

| Право                         | L1 | L2 | L3 | ADMIN |
| ----------------------------- | -- | -- | -- | ----- |
| audit:read / filter           | V  | V  | V  | V     |
| calc:access, dashboard:view   | V  | V  | V  | V     |
| audit:status:update           |    | V  | V  | V     |
| audit:comment:add             |    | V  | V  | V     |
| audit:edit:analytical         |    | V  | V  | V     |
| audit:severity:update         |    |    | V  | V     |
| audit:confirm:final           |    |    | V  | V     |
| analytics:extended            |    |    | V  | V     |
| user:manage                   |    |    |    | V     |

## Структура проекта

```
prisma/
  schema.prisma
  seed.ts
src/
  app/
    (auth)/login/       — страница входа
    (app)/              — защищённая зона (layout + sidebar/header)
    api/auth/[...nextauth]/route.ts
    layout.tsx          — корневой layout (Mantine, шрифты)
  components/
    layout/             — Sidebar, Header
    ui/                 — Card, StatTile, SeverityBadge, StatusBadge, RoleBadge
  lib/
    prisma.ts           — singleton Prisma
    rbac.ts             — can / requirePermission
    calculators.ts      — calculateRisk / Sla / Compliance
    validators.ts       — zod-схемы
  server/
    auth.ts             — NextAuth v5 (auth, signIn, signOut, handlers)
  styles/
    globals.scss, theme.ts
  middleware.ts         — защита /audits /dashboard /calculators /users
  types/next-auth.d.ts
docker-compose.yml
```

## Команды

| Скрипт            | Что делает                           |
| ----------------- | ------------------------------------ |
| `pnpm dev`        | Dev-сервер                           |
| `pnpm build`      | Прод-сборка                          |
| `pnpm start`      | Запуск прод-сборки                   |
| `pnpm lint`       | ESLint (next/core-web-vitals)        |
| `pnpm db:migrate` | `prisma migrate dev`                 |
| `pnpm db:seed`    | Посев тестовых данных                |
| `pnpm db:reset`   | Сброс БД + миграции                  |
| `pnpm db:studio`  | Prisma Studio                        |

## Реализованная функциональность

- **/login** — вход по email/паролю (NextAuth v5, JWT)
- **/audits** — список с URL-state фильтрами (поиск, критичность, статус, система, ответственный, диапазон дат), сортировкой, пагинацией 20/стр.
- **/audits/[id]** — карточка: header с SLA-чипом, info-grid, описание, timeline активности, комментарии, role-gated actions (смена статуса/критичности, подтверждение решения)
- **/dashboard** — 4 stat-тайла + динамика обнаружения/устранения + pie критичности + bar статусов + bar топ-10 систем; расширенная аналитика для L3+
- **/calculators/risk** — severity×probability×impact×mitigation → score + уровень
- **/calculators/sla** — дата + критичность + (опционально) норматив → дедлайн, просрочка, статус
- **/calculators/compliance** — fulfilled/unfulfilled → процент + уровень
- **/users** (только ADMIN) — список, inline-смена роли, создание пользователя (self-demote заблокирован)
