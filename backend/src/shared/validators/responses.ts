/**
 * APIレスポンスのバリデーションスキーマと型定義
 * このファイルがレスポンス型の唯一の定義源（Single Source of Truth）
 * @module validators/responses
 */

import { z } from "zod";

// ============================================
// User / Auth
// ============================================

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

/** ユーザーレスポンスの型 */
export type UserResponse = z.infer<typeof userSchema>;

/**
 * 認証レスポンスのスキーマ
 */
export const authResponseSchema = z.object({
  user: userSchema,
  token: z.string(),
});

/** 認証レスポンスの型 */
export type AuthResponse = z.infer<typeof authResponseSchema>;

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

/** エラーレスポンスの型 */
export type ErrorResponse = z.infer<typeof errorResponseSchema>;

// ============================================
// Category
// ============================================

/**
 * カテゴリレスポンススキーマ（一覧・詳細用）
 */
export const categoryResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  color: z.string(),
  todos_count: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

/** カテゴリレスポンスの型 */
export type CategoryResponse = z.infer<typeof categoryResponseSchema>;

/**
 * カテゴリ一覧レスポンススキーマ
 */
export const categoryListResponseSchema = z.array(categoryResponseSchema);

/** カテゴリ一覧レスポンスの型 */
export type CategoryListResponse = z.infer<typeof categoryListResponseSchema>;

// ============================================
// Tag
// ============================================

/**
 * タグレスポンススキーマ（一覧・詳細用）
 */
export const tagResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  color: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

/** タグレスポンスの型 */
export type TagResponse = z.infer<typeof tagResponseSchema>;

/**
 * タグ一覧レスポンススキーマ
 */
export const tagListResponseSchema = z.array(tagResponseSchema);

/** タグ一覧レスポンスの型 */
export type TagListResponse = z.infer<typeof tagListResponseSchema>;

// ============================================
// Todo
// ============================================

/**
 * カテゴリ参照スキーマ
 */
export const categoryRefSchema = z.object({
  id: z.number(),
  name: z.string(),
  color: z.string(),
});

/** カテゴリ参照の型 */
export type CategoryRef = z.infer<typeof categoryRefSchema>;

/**
 * タグ参照スキーマ
 */
export const tagRefSchema = z.object({
  id: z.number(),
  name: z.string(),
  color: z.string().nullable(),
});

/** タグ参照の型 */
export type TagRef = z.infer<typeof tagRefSchema>;

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

/** Todoレスポンスの型 */
export type TodoResponse = z.infer<typeof todoResponseSchema>;

/**
 * Todo一覧レスポンススキーマ
 */
export const todoListResponseSchema = z.array(todoResponseSchema);

/** Todo一覧レスポンスの型 */
export type TodoListResponse = z.infer<typeof todoListResponseSchema>;

// ============================================
// 後方互換性のためのエイリアス（deprecated）
// ============================================

/** @deprecated Use AuthResponse instead */
export type AuthResponseType = AuthResponse;

/** @deprecated Use ErrorResponse instead */
export type ErrorResponseType = ErrorResponse;

/** @deprecated Use CategoryRef instead */
export type CategoryRefType = CategoryRef;

/** @deprecated Use TagRef instead */
export type TagRefType = TagRef;

/** @deprecated Use TodoResponse instead */
export type TodoResponseType = TodoResponse;

/** @deprecated Use TodoListResponse instead */
export type TodoListResponseType = TodoListResponse;
