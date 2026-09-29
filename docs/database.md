# База данных: ER-схема

PostgreSQL 17 (контейнер из `docker-compose.yml`), схема ведётся через
Prisma 7: источник правды `apps/api/prisma/schema.prisma`, изменения только
миграциями (`apps/api/prisma/migrations/`). Этот файл обновляется вместе с
каждой миграцией.

Имена: в базе `snake_case`, в TypeScript `camelCase` (`@map`).

## Реализовано

```mermaid
erDiagram
    lead {
        uuid id PK "gen_random_uuid()"
        text contact "NOT NULL"
        text name "nullable"
        service_type service_type "NOT NULL"
        text budget_hint "nullable"
        text deadline_hint "nullable"
        lead_status status "NOT NULL, default new"
        timestamptz created_at "NOT NULL, default now (3)"
        timestamptz updated_at "NOT NULL, задаёт Prisma (3)"
    }
```

### `lead`: потенциальный клиент

| Колонка | Тип | Null | По умолчанию | Примечание |
|---|---|---|---|---|
| `id` | `uuid` | нет | `gen_random_uuid()` | PK |
| `contact` | `text` | нет | | как связаться |
| `name` | `text` | да | | |
| `service_type` | `service_type` | нет | | enum, см. ниже |
| `budget_hint` | `text` | да | | пожелание клиента, свободный текст |
| `deadline_hint` | `text` | да | | пожелание клиента, свободный текст |
| `status` | `lead_status` | нет | `'new'` | enum, см. ниже |
| `created_at` | `timestamptz(3)` | нет | `CURRENT_TIMESTAMP` | |
| `updated_at` | `timestamptz(3)` | нет | нет | заполняет Prisma при записи; сырой SQL должен задавать сам |

Индексы: `lead_pkey` (PK по `id`); `lead_status_created_at_idx` по
`(status, created_at DESC)`: список и фильтрация лидов.

### Enum-типы

| Тип | Значения |
|---|---|
| `service_type` | `telegram_automation`, `website_landing`, `content_automation`, `ai_consultation`, `manual_review` |
| `lead_status` | `new`, `contacted`, `qualified`, `proposal`, `won`, `lost`, `manual_review` |

Жизненный цикл статуса: `new → contacted → qualified → proposal → won`,
ответвление `lost`; `manual_review` для непонятных или нестандартных
запросов.

## План (ещё не в базе)

Связи между сущностями из плана (`session-plan.md` §10.1, поля и типы
уточним при создании каждой таблицы). Показаны только ключи.

```mermaid
erDiagram
    lead |o--o{ conversation : "lead_id (nullable)"
    conversation ||--o{ message : "conversation_id"
    lead |o--o{ proposal : "lead_id (nullable)"
    conversation ||--o{ proposal : "conversation_id"

    conversation {
        uuid id PK
        uuid lead_id FK "nullable"
    }
    message {
        uuid id PK
        uuid conversation_id FK
    }
    proposal {
        uuid id PK
        uuid lead_id FK "nullable"
        uuid conversation_id FK
    }
    admin_user {
        uuid id PK
    }
    audit_log {
        uuid id PK
    }
```

`admin_user` и `audit_log` без внешних ключей на другие таблицы (в
`audit_log` ссылка на сущность полиморфная: `entity_type` + `entity_id`).
Тип идентификаторов в этих таблицах (`uuid`) пока предположение по аналогии с
`lead`.
