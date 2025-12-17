/**
 * サービスコンテナ
 * サービスとリポジトリのインスタンス化を一元管理する
 * @module lib/container
 */

import { JwtDenylistRepository } from "../features/auth/jwt-denylist-repository";
import { AuthService } from "../features/auth/service";
import { UserRepository } from "../features/auth/user-repository";
import { getDb } from "./db";

/** データベース接続（シングルトン） */
const db = getDb();

/**
 * AuthServiceのインスタンスを取得する
 * @returns AuthServiceインスタンス
 */
export function getAuthService(): AuthService {
  return new AuthService(
    new UserRepository(db),
    new JwtDenylistRepository(db),
  );
}

/**
 * UserRepositoryのインスタンスを取得する
 * @returns UserRepositoryインスタンス
 */
export function getUserRepository(): UserRepository {
  return new UserRepository(db);
}

/**
 * JwtDenylistRepositoryのインスタンスを取得する
 * @returns JwtDenylistRepositoryインスタンス
 */
export function getJwtDenylistRepository(): JwtDenylistRepository {
  return new JwtDenylistRepository(db);
}
