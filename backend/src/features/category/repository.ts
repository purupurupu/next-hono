/**
 * カテゴリリポジトリ
 * @module features/category/repository
 */

import { and, eq } from "drizzle-orm";
import type { DatabaseOrTransaction } from "../../lib/db";
import { categories } from "../../models/schema";
import type { Category, NewCategory } from "./types";

/**
 * カテゴリリポジトリインターフェース
 */
export interface CategoryRepositoryInterface {
  /**
   * ユーザーのすべてのカテゴリを取得する
   * @param userId - ユーザーID
   * @returns カテゴリの配列
   */
  findAll(userId: number): Promise<Category[]>;

  /**
   * IDとユーザーIDでカテゴリを取得する
   * @param id - カテゴリID
   * @param userId - ユーザーID
   * @returns カテゴリ、または見つからない場合はundefined
   */
  findById(id: number, userId: number): Promise<Category | undefined>;

  /**
   * 名前とユーザーIDでカテゴリを取得する
   * @param name - カテゴリ名
   * @param userId - ユーザーID
   * @returns カテゴリ、または見つからない場合はundefined
   */
  findByName(name: string, userId: number): Promise<Category | undefined>;

  /**
   * カテゴリを作成する
   * @param data - カテゴリ作成データ
   * @returns 作成されたカテゴリ
   */
  create(data: NewCategory): Promise<Category>;

  /**
   * カテゴリを更新する
   * @param id - カテゴリID
   * @param userId - ユーザーID
   * @param data - 更新データ
   * @returns 更新されたカテゴリ、または見つからない場合はundefined
   */
  update(
    id: number,
    userId: number,
    data: Partial<Omit<NewCategory, "userId">>,
  ): Promise<Category | undefined>;

  /**
   * カテゴリを削除する
   * @param id - カテゴリID
   * @param userId - ユーザーID
   * @returns 削除成功した場合はtrue
   */
  delete(id: number, userId: number): Promise<boolean>;
}

/**
 * カテゴリリポジトリ実装
 */
export class CategoryRepository implements CategoryRepositoryInterface {
  constructor(private db: DatabaseOrTransaction) {}

  async findAll(userId: number): Promise<Category[]> {
    return await this.db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId))
      .orderBy(categories.name);
  }

  async findById(id: number, userId: number): Promise<Category | undefined> {
    const result = await this.db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .limit(1);
    return result[0];
  }

  async findByName(name: string, userId: number): Promise<Category | undefined> {
    const result = await this.db
      .select()
      .from(categories)
      .where(and(eq(categories.name, name), eq(categories.userId, userId)))
      .limit(1);
    return result[0];
  }

  async create(data: NewCategory): Promise<Category> {
    const result = await this.db.insert(categories).values(data).returning();
    return result[0];
  }

  async update(
    id: number,
    userId: number,
    data: Partial<Omit<NewCategory, "userId">>,
  ): Promise<Category | undefined> {
    const result = await this.db
      .update(categories)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning();
    return result[0];
  }

  async delete(id: number, userId: number): Promise<boolean> {
    const result = await this.db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning({ id: categories.id });
    return result.length > 0;
  }
}
