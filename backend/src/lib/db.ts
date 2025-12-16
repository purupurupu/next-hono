import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../models/schema";
import { getConfig } from "./config";

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let client: ReturnType<typeof postgres> | null = null;

export function getDb() {
  if (db) return db;

  const config = getConfig();
  client = postgres(config.DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  db = drizzle(client, { schema });
  return db;
}

export async function closeDb() {
  if (client) {
    await client.end();
    client = null;
    db = null;
  }
}

export type Database = ReturnType<typeof getDb>;
