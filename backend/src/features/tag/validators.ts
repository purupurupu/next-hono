/**
 * タグバリデーションスキーマ
 * @module features/tag/validators
 */

import { z } from "zod";
import { TAG } from "../../lib/constants";

/**
 * 色のバリデーションスキーマ（#RRGGBB形式、オプション）
 */
const colorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, {
    message: "色は #RRGGBB 形式で入力してください",
  })
  .nullable()
  .optional();

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
  color: colorSchema,
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
  color: colorSchema,
});

// IDパラメータスキーマは共通モジュールからre-export
export { idParamSchema, type IdParam } from "../../shared/validators/common";

/** タグ作成入力型 */
export type CreateTagInput = z.infer<typeof createTagSchema>;

/** タグ更新入力型 */
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
