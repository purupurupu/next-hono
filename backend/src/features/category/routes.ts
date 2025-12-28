/**
 * カテゴリルートハンドラ
 * @module features/category/routes
 */

import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { getCategoryService } from "../../lib/container";
import { created, noContent, ok } from "../../lib/response";
import { handleValidationError } from "../../lib/validator";
import { getCurrentUser, jwtAuth } from "../../shared/middleware/auth";
import { createCategorySchema, idParamSchema, updateCategorySchema } from "./validators";

const categories = new Hono();

// 全エンドポイントに認証を適用
categories.use("*", jwtAuth());

/**
 * GET /api/v1/categories
 * カテゴリ一覧を取得する
 */
categories.get("/", async (c) => {
  const user = getCurrentUser(c);
  const categoryService = getCategoryService();
  const result = await categoryService.list(user.id);
  return ok(c, result);
});

/**
 * GET /api/v1/categories/:id
 * カテゴリ詳細を取得する
 */
categories.get("/:id", zValidator("param", idParamSchema, handleValidationError()), async (c) => {
  const user = getCurrentUser(c);
  const { id } = c.req.valid("param");
  const categoryService = getCategoryService();
  const result = await categoryService.show(id, user.id);
  return ok(c, result);
});

/**
 * POST /api/v1/categories
 * カテゴリを作成する
 */
categories.post(
  "/",
  zValidator("json", createCategorySchema, handleValidationError()),
  async (c) => {
    const user = getCurrentUser(c);
    const body = c.req.valid("json");
    const categoryService = getCategoryService();
    const result = await categoryService.create(body, user.id);
    return created(c, result);
  },
);

/**
 * PATCH /api/v1/categories/:id
 * カテゴリを更新する
 */
categories.patch(
  "/:id",
  zValidator("param", idParamSchema, handleValidationError()),
  zValidator("json", updateCategorySchema, handleValidationError()),
  async (c) => {
    const user = getCurrentUser(c);
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const categoryService = getCategoryService();
    const result = await categoryService.update(id, body, user.id);
    return ok(c, result);
  },
);

/**
 * DELETE /api/v1/categories/:id
 * カテゴリを削除する
 */
categories.delete(
  "/:id",
  zValidator("param", idParamSchema, handleValidationError()),
  async (c) => {
    const user = getCurrentUser(c);
    const { id } = c.req.valid("param");
    const categoryService = getCategoryService();
    await categoryService.destroy(id, user.id);
    return noContent(c);
  },
);

export default categories;
