/**
 * サービスコンテナ
 * サービスとリポジトリのインスタンス化を一元管理する
 * @module lib/container
 */

import { JwtDenylistRepository } from "../repositories/jwt-denylist";
import { UserRepository } from "../repositories/user";
import { AuthService } from "../services/auth";
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
