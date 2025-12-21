/**
 * タグリポジトリ（Todo機能用）
 * @module features/todo/tag-repository
 */

import { and, eq, inArray } from "drizzle-orm";
import type { DatabaseOrTransaction } from "../../lib/db";
import { type Tag, tags } from "../../models/schema";

/**
 * タグリポジトリのインターフェース（Todo機能用）
 * Phase 2ではタグの所有者検証のみ必要
 */
export interface TagRepositoryInterface {
  /**
   * 複数のIDとユーザーIDでタグを検索する
   * @param ids - タグIDの配列
   * @param userId - ユーザーID
   * @returns タグの配列
   */
  findByIds(ids: number[], userId: number): Promise<Tag[]>;
}

/**
 * タグリポジトリの実装
 */
export class TagRepository implements TagRepositoryInterface {
  /**
   * TagRepositoryを作成する
   * @param db - Drizzleデータベースまたはトランザクションインスタンス
   */
  constructor(private db: DatabaseOrTransaction) {}

  /**
   * 複数のIDとユーザーIDでタグを検索する
   * @param ids - タグIDの配列
   * @param userId - ユーザーID
   * @returns タグの配列
   */
  async findByIds(ids: number[], userId: number): Promise<Tag[]> {
    if (ids.length === 0) {
      return [];
    }
    return await this.db
      .select()
      .from(tags)
      .where(and(inArray(tags.id, ids), eq(tags.userId, userId)));
  }
}
