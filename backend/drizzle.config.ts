import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/models/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgres://postgres:password@localhost:5432/todo_next_hono",
  },
  verbose: true,
  strict: true,
});
