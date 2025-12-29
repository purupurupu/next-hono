/**
 * Todo ルートハンドラ
 * @module features/todo/routes
 */

import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { getTodoSearchService, getTodoService } from "../../lib/container";
import { created, noContent, ok } from "../../lib/response";
import { handleValidationError } from "../../lib/validator";
import { getCurrentUser, jwtAuth } from "../../shared/middleware/auth";
import { normalizeSearchParams, searchTodoSchema } from "./search-validators";
import { createTodoSchema, idParamSchema, updateOrderSchema, updateTodoSchema } from "./validators";

const todos = new Hono();

// 全ルートに認証ミドルウェアを適用
todos.use("*", jwtAuth());

/**
 * Todo一覧を取得
 * GET /api/v1/todos
 */
todos.get("/", async (c) => {
  const user = getCurrentUser(c);
  const todoService = getTodoService();
  const result = await todoService.list(user.id);
  return ok(c, result);
});

/**
 * Todo検索・フィルタリング
 * GET /api/v1/todos/search
 * 注意: /:id より前に定義する必要がある
 */
todos.get("/search", zValidator("query", searchTodoSchema, handleValidationError()), async (c) => {
  const user = getCurrentUser(c);
  const rawParams = c.req.valid("query");
  const params = normalizeSearchParams(rawParams);
  const searchService = getTodoSearchService();
  const result = await searchService.search(params, user.id);
  return ok(c, result);
});

/**
 * Todo詳細を取得
 * GET /api/v1/todos/:id
 */
todos.get("/:id", zValidator("param", idParamSchema, handleValidationError()), async (c) => {
  const user = getCurrentUser(c);
  const { id } = c.req.valid("param");
  const todoService = getTodoService();
  const result = await todoService.show(id, user.id);
  return ok(c, result);
});

/**
 * Todoを作成
 * POST /api/v1/todos
 */
todos.post("/", zValidator("json", createTodoSchema, handleValidationError()), async (c) => {
  const user = getCurrentUser(c);
  const body = c.req.valid("json");
  const todoService = getTodoService();
  const result = await todoService.create(body, user.id);
  return created(c, result);
});

/**
 * Todoの順序を一括更新
 * PATCH /api/v1/todos/update_order
 * 注意: /:id より前に定義する必要がある
 */
todos.patch(
  "/update_order",
  zValidator("json", updateOrderSchema, handleValidationError()),
  async (c) => {
    const user = getCurrentUser(c);
    const body = c.req.valid("json");
    const todoService = getTodoService();
    await todoService.updateOrder(body, user.id);
    return noContent(c);
  },
);

/**
 * Todoを更新
 * PATCH /api/v1/todos/:id
 */
todos.patch(
  "/:id",
  zValidator("param", idParamSchema, handleValidationError()),
  zValidator("json", updateTodoSchema, handleValidationError()),
  async (c) => {
    const user = getCurrentUser(c);
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const todoService = getTodoService();
    const result = await todoService.update(id, body, user.id);
    return ok(c, result);
  },
);

/**
 * Todoを削除
 * DELETE /api/v1/todos/:id
 */
todos.delete("/:id", zValidator("param", idParamSchema, handleValidationError()), async (c) => {
  const user = getCurrentUser(c);
  const { id } = c.req.valid("param");
  const todoService = getTodoService();
  await todoService.destroy(id, user.id);
  return noContent(c);
});

export default todos;
