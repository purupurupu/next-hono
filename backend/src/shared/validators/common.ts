import { z } from "zod";

/**
 * IDパラメータスキーマ（パスパラメータ用）
 * 文字列を正の整数に変換・検証する
 */
export const idParamSchema = z.object({
  id: z
    .string()
    .transform((val, ctx) => {
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
