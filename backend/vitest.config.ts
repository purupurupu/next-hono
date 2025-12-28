import { defineConfig } from "vitest/config";

// テスト用DB接続設定
// ローカル: localhost:5433 (db_testのポートマッピング)
// コンテナ内: db_test:5432 (Docker内部ネットワーク)
const dbHost = process.env.DB_TEST_HOST ?? "localhost";
const dbPort = process.env.DB_TEST_PORT ?? "5433";

const testEnv = {
  DATABASE_URL: `postgres://postgres:password@${dbHost}:${dbPort}/todo_next_test`,
  JWT_SECRET:
    process.env.JWT_SECRET ?? "test-secret-key-for-vitest-local-testing",
  S3_ENDPOINT: process.env.S3_ENDPOINT ?? "http://localhost:9000",
  S3_REGION: process.env.S3_REGION ?? "us-east-1",
  S3_BUCKET: process.env.S3_BUCKET ?? "todo-files-test",
  S3_ACCESS_KEY: process.env.S3_ACCESS_KEY ?? "rustfs-dev-access",
  S3_SECRET_KEY: process.env.S3_SECRET_KEY ?? "rustfs-dev-secret-key",
  S3_USE_PATH_STYLE: process.env.S3_USE_PATH_STYLE ?? "true",
  ENV: process.env.ENV ?? "test",
};

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    env: testEnv,
    // テスト完了後にDB接続をクローズ
    globalSetup: "./tests/global-setup.ts",
    // テストを順次実行（DB競合を防ぐ）
    fileParallelism: false,
    sequence: {
      concurrent: false,
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules", "tests", "drizzle"],
    },
  },
});
