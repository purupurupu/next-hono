/**
 * カテゴリバリデーションスキーマ
 * @module features/category/validators
 */

import { z } from "zod";
import { CATEGORY } from "../../lib/constants";

/**
 * 色のバリデーションスキーマ（#RRGGBB形式）
 */
const colorSchema = z
  .string({ message: "色は必須です" })
  .regex(/^#[0-9A-Fa-f]{6}$/, {
    message: "色は #RRGGBB 形式で入力してください",
  });

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
  color: colorSchema,
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
  color: colorSchema.optional(),
});

// IDパラメータスキーマは共通モジュールからre-export
export { idParamSchema, type IdParam } from "../../shared/validators/common";

/** カテゴリ作成入力型 */
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

/** カテゴリ更新入力型 */
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
