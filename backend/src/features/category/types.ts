/**
 * カテゴリレスポンス型とフォーマッター
 * @module features/category/types
 */

import type { categories } from "../../models/schema";

/** カテゴリエンティティ型 */
export type Category = typeof categories.$inferSelect;

/** カテゴリ作成用型 */
export type NewCategory = typeof categories.$inferInsert;

/**
 * カテゴリレスポンス型
 */
export interface CategoryResponse {
  id: number;
  name: string;
  color: string;
  todos_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * カテゴリエンティティをレスポンス形式に変換する
 * @param category - カテゴリエンティティ
 * @returns カテゴリレスポンス
 */
export function formatCategoryResponse(category: Category): CategoryResponse {
  return {
    id: category.id,
    name: category.name,
    color: category.color,
    todos_count: category.todosCount,
    created_at: category.createdAt.toISOString(),
    updated_at: category.updatedAt.toISOString(),
  };
}
