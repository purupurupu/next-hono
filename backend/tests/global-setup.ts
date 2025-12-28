import { closeDb } from "../src/lib/db";

/**
 * Vitest global teardown
 * テスト完了後にDB接続をクローズしてプロセスハングを防止
 */
export async function teardown() {
  console.log("Closing database connection...");
  await closeDb();
  console.log("Database connection closed.");
}
