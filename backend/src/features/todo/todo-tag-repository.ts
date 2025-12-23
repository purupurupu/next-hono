/**
 * TodoTagリポジトリ
 * @module features/todo/todo-tag-repository
 */

import { eq } from "drizzle-orm";
import type { DatabaseOrTransaction } from "../../lib/db";
import { todoTags } from "../../models/schema";

/**
 * TodoTagリポジトリのインターフェース
 */
export interface TodoTagRepositoryInterface {
  /**
   * Todoのタグを同期する（既存のタグを削除して新しいタグを挿入）
   * @param todoId - TodoのID
   * @param tagIds - タグIDの配列
   */
  syncTags(todoId: number, tagIds: number[]): Promise<void>;

  /**
   * Todoに関連する全タグを削除する
   * @param todoId - TodoのID
   */
  deleteByTodoId(todoId: number): Promise<void>;
}

/**
 * TodoTagリポジトリの実装
 */
export class TodoTagRepository implements TodoTagRepositoryInterface {
  /**
   * TodoTagRepositoryを作成する
   * @param db - Drizzleデータベースまたはトランザクションインスタンス
   */
  constructor(private db: DatabaseOrTransaction) {}

  /**
   * Todoのタグを同期する（既存のタグを削除して新しいタグを挿入）
   * @param todoId - TodoのID
   * @param tagIds - タグIDの配列
   */
  async syncTags(todoId: number, tagIds: number[]): Promise<void> {
    // 既存のタグを削除
    await this.deleteByTodoId(todoId);

    // 新しいタグを挿入
    if (tagIds.length > 0) {
      const values = tagIds.map((tagId) => ({
        todoId,
        tagId,
      }));
      await this.db.insert(todoTags).values(values);
    }
  }

  /**
   * Todoに関連する全タグを削除する
   * @param todoId - TodoのID
   */
  async deleteByTodoId(todoId: number): Promise<void> {
    await this.db.delete(todoTags).where(eq(todoTags.todoId, todoId));
  }
}
