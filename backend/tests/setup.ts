import { sql } from "drizzle-orm";
import { getDb } from "../src/lib/db";
import { jwtDenylists, users } from "../src/models/schema";

export async function clearDatabase() {
  const db = getDb();
  await db.delete(jwtDenylists);
  await db.delete(users);
}

export async function resetSequences() {
  const db = getDb();
  await db.execute(sql`ALTER SEQUENCE users_id_seq RESTART WITH 1`);
  await db.execute(sql`ALTER SEQUENCE jwt_denylists_id_seq RESTART WITH 1`);
}

export async function setupTestDb() {
  await clearDatabase();
}

export async function teardownTestDb() {
  await clearDatabase();
}
