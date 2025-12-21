import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
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
