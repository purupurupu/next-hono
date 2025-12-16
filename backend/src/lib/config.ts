import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  PORT: z.coerce.number().default(3000),
  ENV: z.enum(["development", "production", "test"]).default("development"),
  REDIS_URL: z.string().url().optional(),
  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().default("us-east-1"),
  S3_BUCKET: z.string().default("todo-files"),
  S3_ACCESS_KEY: z.string(),
  S3_SECRET_KEY: z.string(),
  S3_USE_PATH_STYLE: z.coerce.boolean().default(true),
});

export type Env = z.infer<typeof envSchema>;

let config: Env | null = null;

export function getConfig(): Env {
  if (config) return config;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("Invalid environment variables:", result.error.format());
    throw new Error("Invalid environment configuration");
  }

  config = result.data;
  return config;
}

export function isDevelopment(): boolean {
  return getConfig().ENV === "development";
}

export function isProduction(): boolean {
  return getConfig().ENV === "production";
}

export function isTest(): boolean {
  return getConfig().ENV === "test";
}
