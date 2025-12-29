/**
 * カテゴリカウンター（Todo機能用）
 * カテゴリの所有者検証とTodoカウント更新を提供する
 * @module features/todo/category-counter
 */

import { and, eq, sql } from "drizzle-orm";
import type { DatabaseOrTransaction } from "../../lib/db";
import { type Category, categories } from "../../models/schema";

/**
 * カテゴリカウンターのインターフェース（Todo機能用）
 * カテゴリの所有者検証とカウント更新のみを提供
 */
export interface CategoryCounterInterface {
  /**
   * IDとユーザーIDでカテゴリを検索する
   * @param id - カテゴリID
   * @param userId - ユーザーID
   * @returns カテゴリ、または見つからない場合はundefined
   */
  findById(id: number, userId: number): Promise<Category | undefined>;

  /**
   * カテゴリのTodoカウントを増加させる
   * @param id - カテゴリID
   */
  incrementTodosCount(id: number): Promise<void>;

  /**
   * カテゴリのTodoカウントを減少させる
   * @param id - カテゴリID
   */
  decrementTodosCount(id: number): Promise<void>;
}

/**
 * カテゴリカウンターの実装
 */
export class CategoryCounter implements CategoryCounterInterface {
  /**
   * CategoryCounterを作成する
   * @param db - Drizzleデータベースまたはトランザクションインスタンス
   */
  constructor(private db: DatabaseOrTransaction) {}

  /**
   * IDとユーザーIDでカテゴリを検索する
   * @param id - カテゴリID
   * @param userId - ユーザーID
   * @returns カテゴリ、または見つからない場合はundefined
   */
  async findById(id: number, userId: number): Promise<Category | undefined> {
    const result = await this.db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .limit(1);
    return result.at(0);
  }

  /**
   * カテゴリのTodoカウントを増加させる
   * @param id - カテゴリID
   */
  async incrementTodosCount(id: number): Promise<void> {
    await this.db
      .update(categories)
      .set({
        todosCount: sql`${categories.todosCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id));
  }

  /**
   * カテゴリのTodoカウントを減少させる
   * @param id - カテゴリID
   */
  async decrementTodosCount(id: number): Promise<void> {
    await this.db
      .update(categories)
      .set({
        todosCount: sql`GREATEST(${categories.todosCount} - 1, 0)`,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id));
  }
}
