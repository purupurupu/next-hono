import { eq } from "drizzle-orm";
import type { Database } from "../lib/db";
import { type NewUser, type User, users } from "../models/schema";

/**
 * ユーザーリポジトリのインターフェース
 */
export interface UserRepositoryInterface {
  /**
   * メールアドレスでユーザーを検索する
   * @param email - 検索するメールアドレス
   * @returns ユーザー、または見つからない場合はundefined
   */
  findByEmail(email: string): Promise<User | undefined>;

  /**
   * IDでユーザーを検索する
   * @param id - ユーザーID
   * @returns ユーザー、または見つからない場合はundefined
   */
  findById(id: number): Promise<User | undefined>;

  /**
   * 新しいユーザーを作成する
   * @param user - 作成するユーザー情報
   * @returns 作成されたユーザー
   */
  create(user: NewUser): Promise<User>;
}

/**
 * ユーザーリポジトリの実装
 * データベースとのユーザーCRUD操作を提供する
 */
export class UserRepository implements UserRepositoryInterface {
  /**
   * UserRepositoryを作成する
   * @param db - Drizzleデータベースインスタンス
   */
  constructor(private db: Database) {}

  /**
   * メールアドレスでユーザーを検索する
   * @param email - 検索するメールアドレス
   * @returns ユーザー、または見つからない場合はundefined
   */
  async findByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  /**
   * IDでユーザーを検索する
   * @param id - ユーザーID
   * @returns ユーザー、または見つからない場合はundefined
   */
  async findById(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  /**
   * 新しいユーザーを作成する
   * @param user - 作成するユーザー情報
   * @returns 作成されたユーザー
   */
  async create(user: NewUser): Promise<User> {
    const result = await this.db.insert(users).values(user).returning();
    return result[0];
  }
}
