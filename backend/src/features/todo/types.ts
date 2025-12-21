/**
 * Todo レスポンス型・変換関数
 * @module features/todo/types
 */

import { TODO } from "../../lib/constants";
import type { Category, NewTodo, Tag, Todo } from "../../models/schema";
import type {
  CategoryRef,
  TagRef,
  TodoResponse,
} from "../../shared/validators/responses";

// 型はresponses.tsから再エクスポート
export type {
  CategoryRef,
  TagRef,
  TodoResponse,
} from "../../shared/validators/responses";

/** Todo更新データ型（userIdを除く部分更新用） */
export type TodoUpdateData = Partial<Omit<NewTodo, "userId">>;

/** DBから取得したTodoとリレーション */
export interface TodoWithRelations {
  todo: Todo;
  category: Category | null;
  tags: Tag[];
}

/**
 * priority整数を文字列に変換
 * @param priority - 優先度（0, 1, 2）
 * @returns 優先度文字列（"low", "medium", "high"）
 */
export function priorityToString(
  priority: number,
): "low" | "medium" | "high" {
  const value = TODO.PRIORITY_REVERSE[priority];
  if (!value) {
    return "medium"; // デフォルト値
  }
  return value;
}

/**
 * status整数を文字列に変換
 * @param status - ステータス（0, 1, 2）
 * @returns ステータス文字列（"pending", "in_progress", "completed"）
 */
export function statusToString(
  status: number,
): "pending" | "in_progress" | "completed" {
  const value = TODO.STATUS_REVERSE[status];
  if (!value) {
    return "pending"; // デフォルト値
  }
  return value;
}

/**
 * CategoryをCategoryRefに変換
 * @param category - カテゴリエンティティ
 * @returns カテゴリ参照
 */
export function formatCategoryRef(category: Category): CategoryRef {
  return {
    id: category.id,
    name: category.name,
    color: category.color,
  };
}

/**
 * TagをTagRefに変換
 * @param tag - タグエンティティ
 * @returns タグ参照
 */
export function formatTagRef(tag: Tag): TagRef {
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color,
  };
}

/**
 * DBエンティティをAPIレスポンスに変換
 * @param data - Todoとリレーション
 * @returns Todoレスポンス
 */
export function formatTodoResponse(data: TodoWithRelations): TodoResponse {
  const { todo, category, tags } = data;
  return {
    id: todo.id,
    title: todo.title,
    completed: todo.completed ?? false,
    position: todo.position ?? 0,
    due_date: todo.dueDate,
    priority: priorityToString(todo.priority),
    status: statusToString(todo.status),
    description: todo.description,
    category: category ? formatCategoryRef(category) : null,
    tags: tags.map(formatTagRef),
    created_at: todo.createdAt.toISOString(),
    updated_at: todo.updatedAt.toISOString(),
  };
}
