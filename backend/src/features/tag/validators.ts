/**
 * タグバリデーションスキーマ
 * @module features/tag/validators
 */

import { z } from "zod";
import { TAG } from "../../lib/constants";
import { optionalColorSchema } from "../../shared/validators/common";

/**
 * タグ名を正規化する（小文字+trim）
 * @param name - タグ名
 * @returns 正規化されたタグ名
 */
function normalizeTagName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * タグ作成スキーマ
 */
export const createTagSchema = z.object({
  name: z
    .string({ message: "名前は必須です" })
    .min(1, { message: "名前は必須です" })
    .max(TAG.NAME_MAX_LENGTH, {
      message: `名前は${TAG.NAME_MAX_LENGTH}文字以内で入力してください`,
    })
    .transform(normalizeTagName),
  color: optionalColorSchema,
});

/**
 * タグ更新スキーマ
 */
export const updateTagSchema = z.object({
  name: z
    .string()
    .min(1, { message: "名前は空にできません" })
    .max(TAG.NAME_MAX_LENGTH, {
      message: `名前は${TAG.NAME_MAX_LENGTH}文字以内で入力してください`,
    })
    .transform(normalizeTagName)
    .optional(),
  color: optionalColorSchema,
});

// IDパラメータスキーマは共通モジュールからre-export
export { type IdParam, idParamSchema } from "../../shared/validators/common";

/** タグ作成入力型 */
export type CreateTagInput = z.infer<typeof createTagSchema>;

/** タグ更新入力型 */
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
