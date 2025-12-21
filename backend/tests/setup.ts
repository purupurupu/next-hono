import { sql } from "drizzle-orm";
import { getDb } from "../src/lib/db";
import {
  categories,
  jwtDenylists,
  tags,
  todoTags,
  todos,
  users,
} from "../src/models/schema";

export async function clearDatabase() {
  const db = getDb();
  // 外部キー制約を考慮して削除順序を設定
  await db.delete(todoTags);
  await db.delete(todos);
  await db.delete(categories);
  await db.delete(tags);
  await db.delete(jwtDenylists);
  await db.delete(users);
}

export async function resetSequences() {
  const db = getDb();
  await db.execute(sql`ALTER SEQUENCE users_id_seq RESTART WITH 1`);
  await db.execute(sql`ALTER SEQUENCE jwt_denylists_id_seq RESTART WITH 1`);
  await db.execute(sql`ALTER SEQUENCE categories_id_seq RESTART WITH 1`);
  await db.execute(sql`ALTER SEQUENCE tags_id_seq RESTART WITH 1`);
  await db.execute(sql`ALTER SEQUENCE todos_id_seq RESTART WITH 1`);
  await db.execute(sql`ALTER SEQUENCE todo_tags_id_seq RESTART WITH 1`);
}

export async function setupTestDb() {
  await clearDatabase();
}

export async function teardownTestDb() {
  await clearDatabase();
}
