# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

日本語で回答してください。
コミットメッセージとPRも日本語で作成してください。

## Architecture Overview

Full-stack Todo application with:

- **Frontend**: Next.js 16 with TypeScript, React 19.2, Tailwind CSS v4
- **Package Manager**: pnpm (frontend), bun (backend)
- **Backend**: Hono (TypeScript) with Drizzle ORM, JWT authentication
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Storage**: RustFS (S3互換)
- **Infrastructure**: Docker Compose

Services:

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- RustFS: localhost:9000

## Common Development Commands

### Docker Operations

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Rebuild after dependency updates
docker compose build frontend    # After package.json changes
docker compose build backend     # After package.json changes
docker compose build --no-cache backend  # Force rebuild
```

### Frontend Development

```bash
docker compose exec frontend pnpm run dev        # Development server
docker compose exec frontend pnpm run build      # Production build
docker compose exec frontend pnpm run lint       # ESLint
docker compose exec frontend pnpm run lint:fix   # ESLint with auto-fix
docker compose exec frontend pnpm run typecheck  # TypeScript check
```

### Backend Development (Hono/Bun)

```bash
# Run development server with hot reload
docker compose exec backend bun run dev

# Run tests
docker compose exec backend bun run test
docker compose exec backend bun run test:watch

# TypeScript check
docker compose exec backend bun run typecheck

# Database operations
docker compose exec backend bun run db:generate  # Generate migrations
docker compose exec backend bun run db:push      # Push schema to database
docker compose exec backend bun run db:studio    # Open Drizzle Studio
```

### Database

```bash
# Start test database
docker compose up -d db_test

# Apply schema changes (development)
DATABASE_URL=postgres://postgres:password@localhost:5432/todo_next_hono bunx drizzle-kit push --force
```

## Backend Architecture (Hono/TypeScript)

```
backend/
├── src/
│   ├── index.ts              # Entry point
│   ├── features/             # Feature-based modules
│   │   └── auth/             # 認証機能
│   │       ├── routes.ts     # HTTP route handlers
│   │       ├── service.ts    # Business logic
│   │       ├── validators.ts # Zod validation schemas
│   │       ├── token-schema.ts # JWT payload schema
│   │       ├── user-repository.ts
│   │       └── jwt-denylist-repository.ts
│   ├── shared/               # Cross-feature shared code
│   │   ├── middleware/       # Auth middleware
│   │   └── validators/       # Response schemas
│   ├── models/
│   │   └── schema.ts         # Drizzle ORM schema (11 tables)
│   └── lib/
│       ├── app.ts            # Hono app factory
│       ├── config.ts         # Environment config (Zod)
│       ├── constants.ts      # Application constants
│       ├── container.ts      # Service factory (DI)
│       ├── db.ts             # Drizzle database connection
│       ├── errors.ts         # ApiError class, error helpers
│       ├── response.ts       # Response helpers
│       ├── type-guards.ts    # Type guard utilities
│       └── validator.ts      # Zod validator helpers
├── drizzle/                  # Migration files
├── tests/                    # Vitest tests
├── drizzle.config.ts         # Drizzle configuration
└── package.json
```

**Directory Structure Guidelines**:

| ディレクトリ | 役割 | 例 |
|-------------|------|-----|
| `features/` | ドメイン固有のビジネスロジック | routes, service, repository, validators |
| `shared/` | 複数featureで使う**ドメイン関連**コード | middleware, 共通バリデーションスキーマ |
| `lib/` | ドメイン非依存の**インフラ・ユーティリティ** | db, config, errors, type-guards |
| `models/` | DBスキーマ定義 | Drizzle ORM schema |

**配置判断フロー**:
```
そのコードはビジネスロジック/ドメイン知識を含む？
├─ No  → lib/（純粋なユーティリティ）
└─ Yes → 複数featureで使用する？
         ├─ No  → features/[domain]/
         └─ Yes → shared/
```

**具体例**:
- `type-guards.ts` → `lib/`（汎用ユーティリティ、ドメイン非依存）
- `auth middleware` → `shared/`（認証ドメイン知識を含む、複数featureで使用）
- `user-repository.ts` → `features/auth/`（authでのみ使用、将来共有時にsharedへ移動）

**Key Dependencies**:
- Hono (web framework)
- Drizzle ORM (database)
- Zod + @hono/zod-validator (validation)
- jose (JWT authentication)
- bcrypt (password hashing)
- @aws-sdk/client-s3 (S3 storage)
- sharp (image processing)
- vitest (testing)

**Database Tables** (11):
- users, todos, categories, tags
- todo_tags (junction)
- comments (polymorphic, soft delete)
- todo_histories (audit log)
- notes, note_revisions (Markdown with versioning)
- jwt_denylists (token invalidation)
- files (S3 storage metadata)

## Frontend Architecture

```
frontend/src/
├── app/                  # Next.js App Router pages
├── components/           # Shared UI components (shadcn/ui)
├── contexts/             # React contexts (auth-context)
├── features/             # Feature-based modules
│   ├── todo/            # Todo feature (components, hooks, types, api)
│   ├── category/        # Category management
│   ├── tag/             # Tag management
│   ├── comment/         # Comments
│   ├── history/         # Audit history
│   ├── file/            # File attachments
│   └── notes/           # Notes feature (Markdown)
├── hooks/                # Shared hooks
├── lib/                  # API clients, utilities
│   ├── api-client.ts    # HttpClient + ApiClient（/api/v1プレフィックス付き）
│   ├── auth-client.ts   # Auth API client
│   └── constants.ts     # API base URL
└── types/                # Shared type definitions
```

**Key Patterns**:
- Feature-based organization: `features/[domain]/` contains domain-specific code
- API Client pattern: `ApiClient`（/api/v1プレフィックス付き）を各featureで継承
- Auth API: `httpClient`を使用（/api/v1プレフィックスなし）
- TypeScript path aliases: `@/*` maps to `src/`
- Optimistic updates with rollback on failure

## API Endpoints

**Authentication** (public):
- `POST /auth/sign_up` - Register
- `POST /auth/sign_in` - Login
- `DELETE /auth/sign_out` - Logout (requires auth)

**API v1** (requires Bearer token):
- `/api/v1/todos` - Todo CRUD
- `/api/v1/todos/search` - Todo search with filters/sort/pagination
- `/api/v1/categories` - Category CRUD
- `/api/v1/tags` - Tag CRUD
- `/api/v1/todos/:todo_id/comments` - Comments (CRUD、15分編集制限)
- `/api/v1/todos/:todo_id/histories` - Audit trail (読み取り専用、ページネーション)
- `/api/v1/todos/:todo_id/files` - File attachments (upload, download, thumb)
- `/api/v1/notes` - Notes CRUD (Markdownメモ)
- `/api/v1/notes/:id/revisions` - Note revisions (履歴管理・復元)
- `/health` - Health check

**APIレスポンス形式**:
- 一覧エンドポイント: `{data: [...], meta: {total, current_page, ...}}`
- 単一オブジェクト: オブジェクトを直接返却（Create, Show, Update）

## Environment Variables

**Backend** (compose.yml):
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing key (min 32 chars)
- `PORT` - Server port (default: 3000, mapped to 3001)
- `ENV` - Environment (development/production/test)
- `REDIS_URL` - Redis connection string
- `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` - S3 config

**Database**:
- `POSTGRES_DB=todo_next_hono`, `POSTGRES_USER`, `POSTGRES_PASSWORD`

## Development Guidelines

1. **Package Manager**: pnpm for frontend, bun for backend
2. **API Calls**: Use provided API clients, not direct fetch
3. **Docker**: Rebuild images after dependency changes
4. **Before PR**: Run `pnpm run lint`, `pnpm run typecheck`, `bun run test`

## TypeScript Guidelines

- **型アサーション（as）は極力使用しない**: 型安全性を維持するため、型アサーションの使用は避ける。代わりに型ガード、ジェネリクス、適切な型定義を使用する。型アサーションが必要な場合は、その理由をコメントで明記する。
- **TSDocを極力書く**: 関数、クラス、インターフェース、型には`@param`、`@returns`、`@throws`、`@example`などを含むTSDocコメントを記述する。
- **Zodの検証にはsafeParseを使用する**: `parse()` は例外をスローするため、`safeParse()` を使用して結果をチェックする。これにより予期しない例外を防ぎ、エラーハンドリングを明示的に行える。

## Git Conventions

**コミットメッセージ** (Semantic Commits、日本語):
```
feat(backend): ユーザー認証機能を追加
fix(frontend): ログインフォームのバリデーションエラーを修正
docs: APIドキュメントを更新
refactor(backend): 認証ミドルウェアをリファクタリング
test(backend): Todoハンドラのテストを追加
chore: 依存関係を更新
```

**PRタイトル・本文**: 日本語で記述

## Documentation

See `docs/` for detailed documentation:
- `docs/migration/hono-migration-checklist.md` - Migration checklist
- `docs/migration/hono-implementation-guide.md` - Hono patterns
- `docs/migration/database-schema.md` - Database schema
- `docs/api/` - API reference

## Troubleshooting

### Module not found errors in Docker
```bash
docker compose down
docker compose build --no-cache backend
docker compose up -d
```

### Database connection issues
```bash
# Check database is running
docker compose logs db

# Recreate database
docker compose down -v db
docker compose up -d db
```
