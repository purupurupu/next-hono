/**
 * APIレスポンスのバリデーションスキーマ
 * @module validators/responses
 */

import { z } from "zod";

/**
 * ユーザー情報のスキーマ
 */
export const userSchema = z.object({
  id: z.number(),
  email: z.string(),
  name: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

/**
 * 認証レスポンスのスキーマ
 */
export const authResponseSchema = z.object({
  user: userSchema,
  token: z.string(),
});

/**
 * APIエラーレスポンスのスキーマ
 */
export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.array(z.string())).optional(),
  }),
});

/** 認証レスポンスの型 */
export type AuthResponseType = z.infer<typeof authResponseSchema>;

/** エラーレスポンスの型 */
export type ErrorResponseType = z.infer<typeof errorResponseSchema>;
