import { defineConfig } from "vitest/config";

// 環境変数が設定されていない場合のみデフォルト値を使用
// コンテナ内: compose.ymlの環境変数が使われる
// ローカル: 下記のデフォルト値が使われる（db_testサービスへの接続）
const testEnv = {
  DATABASE_URL:
    process.env.DATABASE_URL ??
    "postgres://postgres:password@localhost:5433/todo_next_test",
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
