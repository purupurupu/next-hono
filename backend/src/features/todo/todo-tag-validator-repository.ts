/**
 * タグ検証リポジトリ（Todo機能用）
 * タグの所有者検証を提供する
 * @module features/todo/todo-tag-validator-repository
 */

import { and, eq, inArray } from "drizzle-orm";
import type { DatabaseOrTransaction } from "../../lib/db";
import { type Tag, tags } from "../../models/schema";

/**
 * タグ検証リポジトリのインターフェース（Todo機能用）
 * タグの所有者検証のみを提供
 */
export interface TodoTagValidatorRepositoryInterface {
  /**
   * 複数のIDとユーザーIDでタグを検索する
   * @param ids - タグIDの配列
   * @param userId - ユーザーID
   * @returns タグの配列
   */
  findByIds(ids: number[], userId: number): Promise<Tag[]>;
}

/**
 * タグ検証リポジトリの実装（Todo機能用）
 */
export class TodoTagValidatorRepository implements TodoTagValidatorRepositoryInterface {
  /**
   * TodoTagValidatorRepositoryを作成する
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
