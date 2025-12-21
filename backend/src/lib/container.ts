/**
 * サービスコンテナ
 * サービスとリポジトリのインスタンス化を一元管理する
 * @module lib/container
 */

import { JwtDenylistRepository } from "../features/auth/jwt-denylist-repository";
import { AuthService } from "../features/auth/service";
import { UserRepository } from "../features/auth/user-repository";
import { CategoryRepository } from "../features/todo/category-repository";
import { TodoService } from "../features/todo/service";
import { TagRepository } from "../features/todo/tag-repository";
import { TodoRepository } from "../features/todo/todo-repository";
import { getDb } from "./db";

/** データベース接続（シングルトン） */
const db = getDb();

// シングルトンインスタンス（Auth関連）
let authServiceInstance: AuthService | null = null;
let userRepositoryInstance: UserRepository | null = null;
let jwtDenylistRepositoryInstance: JwtDenylistRepository | null = null;

/**
 * AuthServiceのインスタンスを取得する（シングルトン）
 * @returns AuthServiceインスタンス
 */
export function getAuthService(): AuthService {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService(
      getUserRepository(),
      getJwtDenylistRepository(),
    );
  }
  return authServiceInstance;
}

/**
 * UserRepositoryのインスタンスを取得する（シングルトン）
 * @returns UserRepositoryインスタンス
 */
export function getUserRepository(): UserRepository {
  if (!userRepositoryInstance) {
    userRepositoryInstance = new UserRepository(db);
  }
  return userRepositoryInstance;
}

/**
 * JwtDenylistRepositoryのインスタンスを取得する（シングルトン）
 * @returns JwtDenylistRepositoryインスタンス
 */
export function getJwtDenylistRepository(): JwtDenylistRepository {
  if (!jwtDenylistRepositoryInstance) {
    jwtDenylistRepositoryInstance = new JwtDenylistRepository(db);
  }
  return jwtDenylistRepositoryInstance;
}

/**
 * シングルトンインスタンスをリセットする（テスト用）
 */
export function resetSingletons(): void {
  authServiceInstance = null;
  userRepositoryInstance = null;
  jwtDenylistRepositoryInstance = null;
}

// ============================================
// Todo Feature
// ============================================

/**
 * TodoServiceのインスタンスを取得する
 * @returns TodoServiceインスタンス
 */
export function getTodoService(): TodoService {
  return new TodoService(
    db,
    new TodoRepository(db),
    new CategoryRepository(db),
    new TagRepository(db),
  );
}

/**
 * TodoRepositoryのインスタンスを取得する
 * @returns TodoRepositoryインスタンス
 */
export function getTodoRepository(): TodoRepository {
  return new TodoRepository(db);
}

/**
 * CategoryRepositoryのインスタンスを取得する
 * @returns CategoryRepositoryインスタンス
 */
export function getCategoryRepository(): CategoryRepository {
  return new CategoryRepository(db);
}

/**
 * TagRepositoryのインスタンスを取得する
 * @returns TagRepositoryインスタンス
 */
export function getTagRepository(): TagRepository {
  return new TagRepository(db);
}
