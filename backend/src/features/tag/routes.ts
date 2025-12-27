/**
 * タグルートハンドラ
 * @module features/tag/routes
 */

import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { getTagService } from "../../lib/container";
import { created, noContent, ok } from "../../lib/response";
import { handleValidationError } from "../../lib/validator";
import { getCurrentUser, jwtAuth } from "../../shared/middleware/auth";
import { createTagSchema, idParamSchema, updateTagSchema } from "./validators";

const tags = new Hono();

// 全エンドポイントに認証を適用
tags.use("*", jwtAuth());

/**
 * GET /api/v1/tags
 * タグ一覧を取得する
 */
tags.get("/", async (c) => {
  const user = getCurrentUser(c);
  const tagService = getTagService();
  const result = await tagService.list(user.id);
  return ok(c, result);
});

/**
 * GET /api/v1/tags/:id
 * タグ詳細を取得する
 */
tags.get("/:id", zValidator("param", idParamSchema, handleValidationError()), async (c) => {
  const user = getCurrentUser(c);
  const { id } = c.req.valid("param");
  const tagService = getTagService();
  const result = await tagService.show(id, user.id);
  return ok(c, result);
});

/**
 * POST /api/v1/tags
 * タグを作成する
 */
tags.post("/", zValidator("json", createTagSchema, handleValidationError()), async (c) => {
  const user = getCurrentUser(c);
  const body = c.req.valid("json");
  const tagService = getTagService();
  const result = await tagService.create(body, user.id);
  return created(c, result);
});

/**
 * PATCH /api/v1/tags/:id
 * タグを更新する
 */
tags.patch(
  "/:id",
  zValidator("param", idParamSchema, handleValidationError()),
  zValidator("json", updateTagSchema, handleValidationError()),
  async (c) => {
    const user = getCurrentUser(c);
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const tagService = getTagService();
    const result = await tagService.update(id, body, user.id);
    return ok(c, result);
  },
);

/**
 * DELETE /api/v1/tags/:id
 * タグを削除する
 */
tags.delete("/:id", zValidator("param", idParamSchema, handleValidationError()), async (c) => {
  const user = getCurrentUser(c);
  const { id } = c.req.valid("param");
  const tagService = getTagService();
  await tagService.destroy(id, user.id);
  return noContent(c);
});

export default tags;
