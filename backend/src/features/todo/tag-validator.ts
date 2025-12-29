/**
 * タグバリデータ（Todo機能用）
 * タグの所有者検証を提供する
 * @module features/todo/tag-validator
 */

import { and, eq, inArray } from "drizzle-orm";
import type { DatabaseOrTransaction } from "../../lib/db";
import { type Tag, tags } from "../../models/schema";

/**
 * タグバリデータのインターフェース（Todo機能用）
 * タグの所有者検証のみを提供
 */
export interface TagValidatorInterface {
  /**
   * 複数のIDとユーザーIDでタグを検索する
   * @param ids - タグIDの配列
   * @param userId - ユーザーID
   * @returns タグの配列
   */
  findByIds(ids: number[], userId: number): Promise<Tag[]>;
}

/**
 * タグバリデータの実装
 */
export class TagValidator implements TagValidatorInterface {
  /**
   * TagValidatorを作成する
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
