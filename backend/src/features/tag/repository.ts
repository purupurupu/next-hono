/**
 * タグリポジトリ
 * @module features/tag/repository
 */

import { and, eq } from "drizzle-orm";
import type { DatabaseOrTransaction } from "../../lib/db";
import { tags } from "../../models/schema";
import type { NewTag, Tag } from "./types";

/**
 * タグリポジトリインターフェース
 */
export interface TagRepositoryInterface {
  /**
   * ユーザーのすべてのタグを取得する
   * @param userId - ユーザーID
   * @returns タグの配列
   */
  findAll(userId: number): Promise<Tag[]>;

  /**
   * IDとユーザーIDでタグを取得する
   * @param id - タグID
   * @param userId - ユーザーID
   * @returns タグ、または見つからない場合はundefined
   */
  findById(id: number, userId: number): Promise<Tag | undefined>;

  /**
   * 名前とユーザーIDでタグを取得する
   * @param name - タグ名（正規化済み）
   * @param userId - ユーザーID
   * @returns タグ、または見つからない場合はundefined
   */
  findByName(name: string, userId: number): Promise<Tag | undefined>;

  /**
   * タグを作成する
   * @param data - タグ作成データ
   * @returns 作成されたタグ
   */
  create(data: NewTag): Promise<Tag>;

  /**
   * タグを更新する
   * @param id - タグID
   * @param userId - ユーザーID
   * @param data - 更新データ
   * @returns 更新されたタグ、または見つからない場合はundefined
   */
  update(
    id: number,
    userId: number,
    data: Partial<Omit<NewTag, "userId">>,
  ): Promise<Tag | undefined>;

  /**
   * タグを削除する
   * @param id - タグID
   * @param userId - ユーザーID
   * @returns 削除成功した場合はtrue
   */
  delete(id: number, userId: number): Promise<boolean>;
}

/**
 * タグリポジトリ実装
 */
export class TagRepository implements TagRepositoryInterface {
  constructor(private db: DatabaseOrTransaction) {}

  async findAll(userId: number): Promise<Tag[]> {
    return await this.db
      .select()
      .from(tags)
      .where(eq(tags.userId, userId))
      .orderBy(tags.name);
  }

  async findById(id: number, userId: number): Promise<Tag | undefined> {
    const result = await this.db
      .select()
      .from(tags)
      .where(and(eq(tags.id, id), eq(tags.userId, userId)))
      .limit(1);
    return result[0];
  }

  async findByName(name: string, userId: number): Promise<Tag | undefined> {
    const result = await this.db
      .select()
      .from(tags)
      .where(and(eq(tags.name, name), eq(tags.userId, userId)))
      .limit(1);
    return result[0];
  }

  async create(data: NewTag): Promise<Tag> {
    const result = await this.db.insert(tags).values(data).returning();
    return result[0];
  }

  async update(
    id: number,
    userId: number,
    data: Partial<Omit<NewTag, "userId">>,
  ): Promise<Tag | undefined> {
    const result = await this.db
      .update(tags)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(tags.id, id), eq(tags.userId, userId)))
      .returning();
    return result[0];
  }

  async delete(id: number, userId: number): Promise<boolean> {
    const result = await this.db
      .delete(tags)
      .where(and(eq(tags.id, id), eq(tags.userId, userId)))
      .returning({ id: tags.id });
    return result.length > 0;
  }
}
