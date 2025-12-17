/**
 * サービスコンテナ
 * サービスとリポジトリのインスタンス化を一元管理する
 * @module lib/container
 */

import { JwtDenylistRepository } from "../repositories/jwt-denylist";
import { UserRepository } from "../repositories/user";
import { AuthService } from "../services/auth";
import { getDb } from "./db";

/**
 * AuthServiceのインスタンスを取得する
 * @returns AuthServiceインスタンス
 */
export function getAuthService(): AuthService {
  const db = getDb();
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
  const db = getDb();
  return new UserRepository(db);
}

/**
 * JwtDenylistRepositoryのインスタンスを取得する
 * @returns JwtDenylistRepositoryインスタンス
 */
export function getJwtDenylistRepository(): JwtDenylistRepository {
  const db = getDb();
  return new JwtDenylistRepository(db);
}
