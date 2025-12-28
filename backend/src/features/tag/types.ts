/**
 * タグレスポンス型とフォーマッター
 * @module features/tag/types
 */

import type { tags } from "../../models/schema";

/** タグエンティティ型 */
export type Tag = typeof tags.$inferSelect;

/** タグ作成用型 */
export type NewTag = typeof tags.$inferInsert;

/**
 * タグレスポンス型
 */
export interface TagResponse {
  id: number;
  name: string;
  color: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * タグエンティティをレスポンス形式に変換する
 * @param tag - タグエンティティ
 * @returns タグレスポンス
 */
export function formatTagResponse(tag: Tag): TagResponse {
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color,
    created_at: tag.createdAt.toISOString(),
    updated_at: tag.updatedAt.toISOString(),
  };
}
