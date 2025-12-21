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

// ============================================
// Todo レスポンススキーマ
// ============================================

/**
 * カテゴリ参照スキーマ
 */
export const categoryRefSchema = z.object({
  id: z.number(),
  name: z.string(),
  color: z.string(),
});

/**
 * タグ参照スキーマ
 */
export const tagRefSchema = z.object({
  id: z.number(),
  name: z.string(),
  color: z.string().nullable(),
});

/**
 * Todoレスポンススキーマ
 */
export const todoResponseSchema = z.object({
  id: z.number(),
  title: z.string(),
  completed: z.boolean(),
  position: z.number(),
  due_date: z.string().nullable(),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["pending", "in_progress", "completed"]),
  description: z.string().nullable(),
  category: categoryRefSchema.nullable(),
  tags: z.array(tagRefSchema),
  created_at: z.string(),
  updated_at: z.string(),
});

/**
 * Todo一覧レスポンススキーマ
 */
export const todoListResponseSchema = z.array(todoResponseSchema);

/** カテゴリ参照の型 */
export type CategoryRefType = z.infer<typeof categoryRefSchema>;

/** タグ参照の型 */
export type TagRefType = z.infer<typeof tagRefSchema>;

/** Todoレスポンスの型 */
export type TodoResponseType = z.infer<typeof todoResponseSchema>;

/** Todo一覧レスポンスの型 */
export type TodoListResponseType = z.infer<typeof todoListResponseSchema>;
