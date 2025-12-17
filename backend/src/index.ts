import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { getConfig } from "./lib/config";
import { closeDb } from "./lib/db";
import { ApiError } from "./lib/errors";
import authRoutes from "./routes/auth";

const app = new Hono();

// Middleware
app.use("*", logger());
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
// TODO: Add API routes
// app.route('/api/v1', apiRoutes)

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

// Graceful shutdown
const shutdown = async () => {
  console.log("Shutting down...");
  await closeDb();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Start server
const config = getConfig();
console.log(`Server starting on port ${config.PORT}...`);

export default {
  port: config.PORT,
  fetch: app.fetch,
};
