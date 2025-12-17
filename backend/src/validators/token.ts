/**
 * トークン関連のバリデーションスキーマ
 * @module validators/token
 */

import { z } from "zod";

/**
 * JWTペイロードのバリデーションスキーマ
 */
export const tokenPayloadSchema = z.object({
  /** ユーザーID（文字列） */
  sub: z.string(),
  /** JWT ID（一意識別子） */
  jti: z.string(),
  /** ユーザーのメールアドレス */
  email: z.string(),
  /** 有効期限（UNIX時間） */
  exp: z.number(),
  /** 発行時刻（UNIX時間） */
  iat: z.number(),
});

/**
 * JWTペイロードの型定義
 */
export type TokenPayload = z.infer<typeof tokenPayloadSchema>;
