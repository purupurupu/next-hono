/**
 * Honoアプリケーションファクトリ
 * @module lib/app
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import authRoutes from "../features/auth/routes";
import categoryRoutes from "../features/category/routes";
import tagRoutes from "../features/tag/routes";
import todoRoutes from "../features/todo/routes";
import { ApiError } from "./errors";

/** アプリケーション作成オプション */
export interface CreateAppOptions {
  /** ロガーを有効にするか（デフォルト: false） */
  enableLogger?: boolean;
}

/**
 * Honoアプリケーションを作成する
 * @param options - アプリケーション作成オプション
 * @returns 設定済みのHonoアプリケーション
 */
export function createApp(options: CreateAppOptions = {}): Hono {
  const { enableLogger = false } = options;

  const app = new Hono();

  // Middleware
  if (enableLogger) {
    app.use("*", logger());
  }
  app.use("*", secureHeaders());
  app.use(
    "*",
    cors({
      origin: ["http://localhost:3000"],
      credentials: true,
      exposeHeaders: ["Authorization"],
    }),
  );

  // Health check
  app.get("/health", (c) => {
    return c.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Routes
  app.route("/auth", authRoutes);

  // API v1 routes
  const api = new Hono();
  api.route("/todos", todoRoutes);
  api.route("/categories", categoryRoutes);
  api.route("/tags", tagRoutes);
  app.route("/api/v1", api);

  // Error handler
  app.onError((err, c) => {
    if (err instanceof ApiError) {
      return c.json(err.toJSON(), err.statusCode);
    }

    console.error("Unhandled error:", err);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "内部エラーが発生しました",
        },
      },
      500,
    );
  });

  // 404 handler
  app.notFound((c) => {
    return c.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "リソースが見つかりません",
        },
      },
      404,
    );
  });

  return app;
}
