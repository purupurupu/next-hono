/**
 * テスト用ファクトリヘルパー
 * テストデータの作成を一元化する
 * @module tests/helpers/factory
 */

import { createApp } from "../../src/lib/app";
import { getDb } from "../../src/lib/db";
import { categories, tags, todoTags, todos } from "../../src/models/schema";
import { authResponseSchema } from "../../src/shared/validators/responses";
import { parseResponse } from "./response";

const app = createApp();

/**
 * テスト用ユーザーを作成してトークンを取得する
 * @param email - ユーザーのメールアドレス
 * @returns JWTトークンとユーザーID
 */
export async function createTestUser(
  email = "test@example.com",
): Promise<{ token: string; userId: number }> {
  const response = await app.request("/auth/sign_up", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password: "password123",
      password_confirmation: "password123",
      name: "テストユーザー",
    }),
  });
  const body = await parseResponse(response, authResponseSchema);
  return { token: body.token, userId: body.user.id };
}

/**
 * テスト用カテゴリを作成する
 * @param userId - ユーザーID
 * @param name - カテゴリ名
 * @param color - カテゴリの色
 * @returns 作成されたカテゴリのID
 */
export async function createTestCategory(
  userId: number,
  name = "テストカテゴリ",
  color = "#ff0000",
): Promise<number> {
  const db = getDb();
  const result = await db
    .insert(categories)
    .values({
      userId,
      name,
      color,
    })
    .returning();
  const record = result.at(0);
  if (!record) {
    throw new Error("Failed to create test category");
  }
  return record.id;
}

/**
 * テスト用タグを作成する
 * @param userId - ユーザーID
 * @param name - タグ名
 * @param color - タグの色
 * @returns 作成されたタグのID
 */
export async function createTestTag(
  userId: number,
  name = "テストタグ",
  color = "#00ff00",
): Promise<number> {
  const db = getDb();
  const result = await db
    .insert(tags)
    .values({
      userId,
      name,
      color,
    })
    .returning();
  const record = result.at(0);
  if (!record) {
    throw new Error("Failed to create test tag");
  }
  return record.id;
}

/**
 * テスト用Todoを作成する
 * @param data - Todo作成データ
 * @returns 作成されたTodoのID
 */
export async function createTestTodo(data: {
  userId: number;
  title: string;
  description?: string;
  priority?: number;
  status?: number;
  dueDate?: string;
  categoryId?: number;
  position?: number;
}): Promise<number> {
  const db = getDb();
  const result = await db
    .insert(todos)
    .values({
      userId: data.userId,
      title: data.title,
      description: data.description ?? null,
      priority: data.priority ?? 1,
      status: data.status ?? 0,
      dueDate: data.dueDate ?? null,
      categoryId: data.categoryId ?? null,
      position: data.position ?? 0,
      completed: data.status === 2,
    })
    .returning();
  const record = result.at(0);
  if (!record) {
    throw new Error("Failed to create test todo");
  }
  return record.id;
}

/**
 * TodoにTagを紐付ける
 * @param todoId - TodoのID
 * @param tagId - タグのID
 */
export async function attachTagToTodo(todoId: number, tagId: number): Promise<void> {
  const db = getDb();
  await db.insert(todoTags).values({ todoId, tagId });
}
