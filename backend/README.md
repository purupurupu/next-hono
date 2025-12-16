# Backend (Hono + Drizzle)

TypeScript backend using Hono framework with Drizzle ORM.

## Tech Stack

- **Runtime**: Bun
- **Framework**: Hono
- **ORM**: Drizzle
- **Database**: PostgreSQL 15
- **Validation**: Zod + @hono/zod-validator
- **Authentication**: jose (JWT)
- **Testing**: Vitest
- **Linter/Formatter**: Biome

## Development

### Install Dependencies

```bash
bun install
```

### Run Development Server

```bash
bun run dev
```

### Docker Development

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f backend

# Rebuild after package.json changes
docker compose build backend
```

## Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Start development server with hot reload |
| `bun run start` | Start production server |
| `bun run build` | Build for production |
| `bun run test` | Run tests |
| `bun run test:watch` | Run tests in watch mode |
| `bun run typecheck` | TypeScript type check |
| `bun run lint` | Run Biome linter |
| `bun run lint:fix` | Run Biome linter with auto-fix |
| `bun run format` | Format code with Biome |
| `bun run check` | Run Biome check with auto-fix |

## Database

### Drizzle Commands

| Script | Description |
|--------|-------------|
| `bun run db:generate` | Generate migration files |
| `bun run db:migrate` | Run migrations |
| `bun run db:push` | Push schema to database (dev) |
| `bun run db:studio` | Open Drizzle Studio |

### Direct Commands

```bash
# Push schema to database (development)
DATABASE_URL=postgres://postgres:password@localhost:5432/todo_next_hono bunx drizzle-kit push --force

# Open Drizzle Studio
DATABASE_URL=postgres://postgres:password@localhost:5432/todo_next_hono bunx drizzle-kit studio
```

## Project Structure

```
backend/
├── src/
│   ├── index.ts              # Entry point, Hono app, middleware
│   ├── routes/               # HTTP route handlers
│   ├── services/             # Business logic
│   ├── repositories/         # Data access layer
│   ├── models/
│   │   └── schema.ts         # Drizzle ORM schema (11 tables)
│   ├── validators/           # Zod validation schemas
│   ├── middleware/           # Auth middleware
│   └── lib/
│       ├── config.ts         # Environment config (Zod)
│       ├── db.ts             # Drizzle database connection
│       ├── errors.ts         # ApiError class
│       └── response.ts       # Response helpers
├── drizzle/                  # Migration files
├── tests/                    # Vitest tests
├── drizzle.config.ts         # Drizzle configuration
├── biome.json                # Biome linter/formatter config
└── package.json
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgres://user:pass@host:5432/db` |
| `JWT_SECRET` | JWT signing key (min 32 chars) | `your-secret-key-here` |
| `PORT` | Server port | `3000` |
| `ENV` | Environment | `development` / `production` / `test` |
| `REDIS_URL` | Redis connection | `redis://localhost:6379` |
| `S3_ENDPOINT` | S3-compatible endpoint | `http://rustfs:9000` |
| `S3_REGION` | S3 region | `us-east-1` |
| `S3_BUCKET` | S3 bucket name | `todo-files` |
| `S3_ACCESS_KEY` | S3 access key | `minioadmin` |
| `S3_SECRET_KEY` | S3 secret key | `minioadmin` |

## Database Tables (11)

- `users` - User accounts
- `todos` - Todo items
- `categories` - Todo categories
- `tags` - Tags for todos
- `todo_tags` - Junction table for todo-tag relationship
- `comments` - Comments (polymorphic, soft delete)
- `todo_histories` - Audit log for todos
- `notes` - Markdown notes
- `note_revisions` - Note version history
- `jwt_denylists` - Token invalidation
- `files` - S3 file metadata
