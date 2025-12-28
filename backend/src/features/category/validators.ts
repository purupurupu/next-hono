/**
 * カテゴリバリデーションスキーマ
 * @module features/category/validators
 */

import { z } from "zod";
import { CATEGORY } from "../../lib/constants";
import { requiredColorSchema } from "../../shared/validators/common";

/**
 * カテゴリ作成スキーマ
 */
export const createCategorySchema = z.object({
  name: z
    .string({ message: "名前は必須です" })
    .min(1, { message: "名前は必須です" })
    .max(CATEGORY.NAME_MAX_LENGTH, {
      message: `名前は${CATEGORY.NAME_MAX_LENGTH}文字以内で入力してください`,
    }),
  color: requiredColorSchema,
});

/**
 * カテゴリ更新スキーマ
 */
export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(1, { message: "名前は空にできません" })
    .max(CATEGORY.NAME_MAX_LENGTH, {
      message: `名前は${CATEGORY.NAME_MAX_LENGTH}文字以内で入力してください`,
    })
    .optional(),
  color: requiredColorSchema.optional(),
});

// IDパラメータスキーマは共通モジュールからre-export
export { type IdParam, idParamSchema } from "../../shared/validators/common";

/** カテゴリ作成入力型 */
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

/** カテゴリ更新入力型 */
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
