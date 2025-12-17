import { eq } from "drizzle-orm";
import type { Database } from "../lib/db";
import { jwtDenylists } from "../models/schema";

/**
 * JWTデナイリストリポジトリのインターフェース
 */
export interface JwtDenylistRepositoryInterface {
  /**
   * トークンをデナイリストに追加する
   * @param jti - JWT ID
   * @param exp - トークンの有効期限
   */
  add(jti: string, exp: Date): Promise<void>;

  /**
   * トークンがデナイリストに存在するか確認する
   * @param jti - JWT ID
   * @returns 存在する場合はtrue
   */
  exists(jti: string): Promise<boolean>;
}

/**
 * JWTデナイリストリポジトリの実装
 * 無効化されたJWTトークンの管理を行う
 */
export class JwtDenylistRepository implements JwtDenylistRepositoryInterface {
  /**
   * JwtDenylistRepositoryを作成する
   * @param db - Drizzleデータベースインスタンス
   */
  constructor(private db: Database) {}

  /**
   * トークンをデナイリストに追加する
   * @param jti - JWT ID
   * @param exp - トークンの有効期限
   */
  async add(jti: string, exp: Date): Promise<void> {
    await this.db.insert(jwtDenylists).values({ jti, exp });
  }

  /**
   * トークンがデナイリストに存在するか確認する
   * @param jti - JWT ID
   * @returns 存在する場合はtrue
   */
  async exists(jti: string): Promise<boolean> {
    const result = await this.db
      .select({ jti: jwtDenylists.jti })
      .from(jwtDenylists)
      .where(eq(jwtDenylists.jti, jti))
      .limit(1);
    return result.length > 0;
  }
}
