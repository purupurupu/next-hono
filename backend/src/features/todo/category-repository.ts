/**
 * カテゴリリポジトリ（Todo機能用）
 * @module features/todo/category-repository
 */

import { and, eq, sql } from "drizzle-orm";
import type { Database } from "../../lib/db";
import { type Category, categories } from "../../models/schema";

/**
 * カテゴリリポジトリのインターフェース（Todo機能用）
 * Phase 2ではカテゴリの所有者検証とカウント更新のみ必要
 */
export interface CategoryRepositoryInterface {
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
 * カテゴリリポジトリの実装
 */
export class CategoryRepository implements CategoryRepositoryInterface {
  /**
   * CategoryRepositoryを作成する
   * @param db - Drizzleデータベースインスタンス
   */
  constructor(private db: Database) {}

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
    return result[0];
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
