# Next.js + Hono Todo Application

Full-stack Todoアプリケーション with JWT認証

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| Backend | Hono, Bun, Drizzle ORM, TypeScript |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |
| Storage | RustFS (S3互換) |
| Infrastructure | Docker Compose |

## Prerequisites

- [Docker](https://www.docker.com/) & Docker Compose
- [mise](https://mise.jdx.dev/)（ローカル開発用、任意）

## Quick Start

### 1. リポジトリをクローン

```bash
git clone <repository-url>
cd next-hono
```

### 2. 環境変数を設定

```bash
cp .env.example .env
```

`.env` を編集（本番環境では必ず `JWT_SECRET` を変更）:

```env
POSTGRES_DB=todo_next_hono
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
JWT_SECRET=your-super-secret-key-change-in-production
```

### 3. Dockerで起動

```bash
docker compose up -d
```

### 4. 動作確認

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

## Development Commands

### Docker操作

```bash
# 起動
docker compose up -d

# 停止
docker compose down

# ログ確認
docker compose logs -f backend
docker compose logs -f frontend

# 再ビルド（依存関係更新後）
docker compose build backend
docker compose build frontend
```

### Frontend (pnpm)

```bash
docker compose exec frontend pnpm run dev        # 開発サーバー
docker compose exec frontend pnpm run build      # ビルド
docker compose exec frontend pnpm run lint       # Lint
docker compose exec frontend pnpm run typecheck  # 型チェック
```

### Backend (Bun)

```bash
docker compose exec backend bun run dev          # 開発サーバー（ホットリロード）
docker compose exec backend bun run typecheck    # 型チェック
docker compose exec backend bun run lint         # Biome lint
docker compose exec backend bun run lint:fix     # Biome lint（自動修正）
```

### Database

```bash
docker compose exec backend bun run db:generate  # マイグレーション生成
docker compose exec backend bun run db:push      # スキーマをDBに適用
docker compose exec backend bun run db:studio    # Drizzle Studio起動
```

### テスト

```bash
# テスト用DBを起動
docker compose up -d db_test

# テスト実行
docker compose exec backend bun run test

# ウォッチモード
docker compose exec backend bun run test:watch

# 単一テストファイル
docker compose exec backend bun run test tests/auth.test.ts

# 特定のテストケース
docker compose exec backend bun run test -t "should create todo"
```

## Project Structure

```
.
├── frontend/          # Next.js アプリケーション
├── backend/           # Hono API サーバー
├── docs/              # 詳細ドキュメント
├── compose.yml        # Docker Compose 設定
├── .mise.toml         # mise バージョン管理
└── CLAUDE.md          # Claude Code 用ガイド
```

## Documentation

詳細なドキュメントは以下を参照してください：

- [CLAUDE.md](./CLAUDE.md) - Claude Code用の詳細なアーキテクチャガイド
- [docs/](./docs/) - API仕様、移行ガイド、データベーススキーマ

## License

MIT
