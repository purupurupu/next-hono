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
import { type DatabaseOrTransaction, getDb } from "./db";

// ============================================
// Auth Feature
// ============================================

/**
 * UserRepositoryのインスタンスを取得する
 * @returns UserRepositoryインスタンス
 */
export function getUserRepository(): UserRepository {
  return new UserRepository(getDb());
}

/**
 * JwtDenylistRepositoryのインスタンスを取得する
 * @returns JwtDenylistRepositoryインスタンス
 */
export function getJwtDenylistRepository(): JwtDenylistRepository {
  return new JwtDenylistRepository(getDb());
}

/**
 * AuthServiceのインスタンスを取得する
 * @returns AuthServiceインスタンス
 */
export function getAuthService(): AuthService {
  return new AuthService(getUserRepository(), getJwtDenylistRepository());
}

// ============================================
// Todo Feature
// ============================================

/**
 * トランザクション対応リポジトリのファクトリ型
 *
 * Drizzleではトランザクション内の操作にはトランザクションオブジェクト(tx)を
 * 使用する必要がある。通常のdb接続を使うとトランザクション外の操作になるため、
 * トランザクション内で新しいリポジトリインスタンスを作成するためのファクトリを提供する。
 *
 * @example
 * ```typescript
 * await this.db.transaction(async (tx) => {
 *   const txTodoRepo = this.factories.createTodoRepository(tx);
 *   // txTodoRepoの操作は全て同一トランザクション内で実行される
 * });
 * ```
 */
export interface RepositoryFactories {
  /** TodoRepositoryを作成する */
  createTodoRepository: (db: DatabaseOrTransaction) => TodoRepository;
  /** CategoryRepositoryを作成する */
  createCategoryRepository: (db: DatabaseOrTransaction) => CategoryRepository;
  /** TagRepositoryを作成する */
  createTagRepository: (db: DatabaseOrTransaction) => TagRepository;
  /** TodoTagRepositoryを作成する */
  createTodoTagRepository: (db: DatabaseOrTransaction) => TodoTagRepository;
}

/**
 * デフォルトのリポジトリファクトリを取得する
 * @returns リポジトリファクトリオブジェクト
 */
export function getRepositoryFactories(): RepositoryFactories {
  return {
    createTodoRepository: (db) => new TodoRepository(db),
    createCategoryRepository: (db) => new CategoryRepository(db),
    createTagRepository: (db) => new TagRepository(db),
    createTodoTagRepository: (db) => new TodoTagRepository(db),
  };
}

/**
 * TodoServiceのインスタンスを取得する
 *
 * 直接渡すリポジトリとファクトリの両方を渡す理由:
 * - 直接渡すリポジトリ: 通常の読み取り操作用（インスタンス再利用でオーバーヘッド削減）
 * - ファクトリ: トランザクション内で新しいリポジトリを作成するため
 *
 * @returns TodoServiceインスタンス
 */
export function getTodoService(): TodoService {
  const db = getDb();
  return new TodoService(
    db,
    new TodoRepository(db),
    new CategoryRepository(db),
    new TagRepository(db),
    getRepositoryFactories(),
  );
}
