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
import { TodoTagRepository } from "../features/todo/todo-tag-repository";
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

// ============================================
// Todo Feature
// ============================================

/**
 * TodoServiceのインスタンスを取得する
 * @returns TodoServiceインスタンス
 */
export function getTodoService(): TodoService {
  return new TodoService(
    new TodoRepository(db),
    new TodoTagRepository(db),
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
