import { z } from "zod";

/**
 * IDパラメータスキーマ（パスパラメータ用）
 * 文字列を正の整数に変換・検証する
 */
export const idParamSchema = z.object({
  id: z.string().transform((val, ctx) => {
    const parsed = Number.parseInt(val, 10);
    if (Number.isNaN(parsed) || parsed <= 0 || !Number.isInteger(parsed)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "IDは正の整数である必要があります",
      });
      return z.NEVER;
    }
    return parsed;
  }),
});

/** IDパラメータ型 */
export type IdParam = z.infer<typeof idParamSchema>;

/**
 * HEX色コード正規表現（#RRGGBB形式）
 */
export const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

/**
 * 必須の色バリデーションスキーマ
 */
export const requiredColorSchema = z
  .string({ message: "色は必須です" })
  .regex(hexColorRegex, { message: "色は #RRGGBB 形式で入力してください" });

/**
 * オプションの色バリデーションスキーマ
 */
export const optionalColorSchema = z
  .string()
  .regex(hexColorRegex, { message: "色は #RRGGBB 形式で入力してください" })
  .nullable()
  .optional();
