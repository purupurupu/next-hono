import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/lib/app";
import { getDb } from "../src/lib/db";
import { categories, tags } from "../src/models/schema";
import {
  authResponseSchema,
  errorResponseSchema,
  todoListResponseSchema,
  todoResponseSchema,
} from "../src/shared/validators/responses";
import { parseResponse } from "./helpers/response";
import { clearDatabase } from "./setup";

const app = createApp();

describe("Todo API", () => {
  let token: string;
  let userId: number;

  /**
   * ユーザーを作成してトークンを取得
   */
  async function createTestUser(
    email = "todo-test@example.com",
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
   * テスト用カテゴリを作成
   */
  async function createTestCategory(
    userIdParam: number,
    name = "テストカテゴリ",
  ): Promise<number> {
    const db = getDb();
    const result = await db
      .insert(categories)
      .values({
        userId: userIdParam,
        name,
        color: "#ff0000",
      })
      .returning();
    return result[0].id;
  }

  /**
   * テスト用タグを作成
   */
  async function createTestTag(
    userIdParam: number,
    name = "テストタグ",
  ): Promise<number> {
    const db = getDb();
    const result = await db
      .insert(tags)
      .values({
        userId: userIdParam,
        name,
        color: "#00ff00",
      })
      .returning();
    return result[0].id;
  }

  beforeAll(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await clearDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    const user = await createTestUser();
    token = user.token;
    userId = user.userId;
  });

  describe("GET /api/v1/todos - Todo一覧取得", () => {
    it("正常系: 空の配列を返す", async () => {
      const response = await app.request("/api/v1/todos", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(200);
      const body = await parseResponse(response, todoListResponseSchema);
      expect(body).toEqual([]);
    });

    it("正常系: Todoをposition順で返す", async () => {
      // Todo を3つ作成
      await app.request("/api/v1/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: "Todo 1" }),
      });
      await app.request("/api/v1/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: "Todo 2" }),
      });
      await app.request("/api/v1/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: "Todo 3" }),
      });

      const response = await app.request("/api/v1/todos", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(200);
      const body = await parseResponse(response, todoListResponseSchema);
      expect(body).toHaveLength(3);
      expect(body[0].title).toBe("Todo 1");
      expect(body[0].position).toBe(0);
      expect(body[1].title).toBe("Todo 2");
      expect(body[1].position).toBe(1);
      expect(body[2].title).toBe("Todo 3");
      expect(body[2].position).toBe(2);
    });

    it("正常系: 他ユーザーのTodoは含まれない", async () => {
      // 別ユーザーを作成してTodoを追加
      const otherUser = await createTestUser("todo-other@example.com");
      await app.request("/api/v1/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${otherUser.token}`,
        },
        body: JSON.stringify({ title: "Other user's todo" }),
      });

      // 元のユーザーでTodoを追加
      await app.request("/api/v1/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: "My todo" }),
      });

      // 元のユーザーで一覧取得
      const response = await app.request("/api/v1/todos", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(200);
      const body = await parseResponse(response, todoListResponseSchema);
      expect(body).toHaveLength(1);
      expect(body[0].title).toBe("My todo");
    });

    it("異常系: 認証なしで401エラー", async () => {
      const response = await app.request("/api/v1/todos", {
        method: "GET",
      });

      expect(response.status).toBe(401);
      const body = await parseResponse(response, errorResponseSchema);
      expect(body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("GET /api/v1/todos/:id - Todo詳細取得", () => {
    it("正常系: カテゴリ・タグ付きで取得", async () => {
      const categoryId = await createTestCategory(userId);
      const tagId = await createTestTag(userId);

      // Todo作成
      const createResponse = await app.request("/api/v1/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: "Test Todo",
          description: "Test description",
          priority: "high",
          status: "in_progress",
          due_date: "2025-12-31",
          category_id: categoryId,
          tag_ids: [tagId],
        }),
      });
      const created = await parseResponse(createResponse, todoResponseSchema);

      // 詳細取得
      const response = await app.request(`/api/v1/todos/${created.id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(200);
      const body = await parseResponse(response, todoResponseSchema);
      expect(body.id).toBe(created.id);
      expect(body.title).toBe("Test Todo");
      expect(body.description).toBe("Test description");
      expect(body.priority).toBe("high");
      expect(body.status).toBe("in_progress");
      expect(body.due_date).toBe("2025-12-31");
      expect(body.category).not.toBeNull();
      expect(body.category?.id).toBe(categoryId);
      expect(body.tags).toHaveLength(1);
      expect(body.tags[0].id).toBe(tagId);
    });

    it("異常系: 存在しないIDで404エラー", async () => {
      const response = await app.request("/api/v1/todos/99999", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(404);
      const body = await parseResponse(response, errorResponseSchema);
      expect(body.error.code).toBe("NOT_FOUND");
    });

    it("異常系: 他ユーザーのTodoで404エラー", async () => {
      const otherUser = await createTestUser("todo-other@example.com");
      const createResponse = await app.request("/api/v1/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${otherUser.token}`,
        },
        body: JSON.stringify({ title: "Other's todo" }),
      });
      const created = await parseResponse(createResponse, todoResponseSchema);

      const response = await app.request(`/api/v1/todos/${created.id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/v1/todos - Todo作成", () => {
    it("正常系: 必須項目のみで作成", async () => {
      const response = await app.request("/api/v1/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: "Test Todo" }),
      });

      expect(response.status).toBe(201);
      const body = await parseResponse(response, todoResponseSchema);
      expect(body.title).toBe("Test Todo");
      expect(body.completed).toBe(false);
      expect(body.priority).toBe("medium"); // デフォルト
      expect(body.status).toBe("pending"); // デフォルト
      expect(body.position).toBe(0);
      expect(body.category).toBeNull();
      expect(body.tags).toEqual([]);
    });

    it("正常系: 全項目指定で作成", async () => {
      const categoryId = await createTestCategory(userId);
      const tagId1 = await createTestTag(userId, "Tag 1");
      const tagId2 = await createTestTag(userId, "Tag 2");

      const response = await app.request("/api/v1/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: "Full Todo",
          description: "Description text",
          priority: "high",
          status: "in_progress",
          due_date: "2025-12-31",
          category_id: categoryId,
          tag_ids: [tagId1, tagId2],
        }),
      });

      expect(response.status).toBe(201);
      const body = await parseResponse(response, todoResponseSchema);
      expect(body.title).toBe("Full Todo");
      expect(body.description).toBe("Description text");
      expect(body.priority).toBe("high");
      expect(body.status).toBe("in_progress");
      expect(body.due_date).toBe("2025-12-31");
      expect(body.category?.id).toBe(categoryId);
      expect(body.tags).toHaveLength(2);
    });

    it("正常系: positionが自動設定される", async () => {
      const res1 = await app.request("/api/v1/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: "First" }),
      });
      const todo1 = await parseResponse(res1, todoResponseSchema);

      const res2 = await app.request("/api/v1/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: "Second" }),
      });
      const todo2 = await parseResponse(res2, todoResponseSchema);

      expect(todo1.position).toBe(0);
      expect(todo2.position).toBe(1);
    });

    it("異常系: titleが空で400エラー", async () => {
      const response = await app.request("/api/v1/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: "" }),
      });

      expect(response.status).toBe(400);
      const body = await parseResponse(response, errorResponseSchema);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("異常系: 他ユーザーのCategoryで403エラー", async () => {
      const otherUser = await createTestUser("todo-other@example.com");
      const otherCategoryId = await createTestCategory(
        otherUser.userId,
        "Other Category",
      );

      const response = await app.request("/api/v1/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: "Test",
          category_id: otherCategoryId,
        }),
      });

      expect(response.status).toBe(403);
      const body = await parseResponse(response, errorResponseSchema);
      expect(body.error.code).toBe("FORBIDDEN");
    });

    it("異常系: 他ユーザーのTagで403エラー", async () => {
      const otherUser = await createTestUser("todo-other@example.com");
      const otherTagId = await createTestTag(otherUser.userId, "Other Tag");

      const response = await app.request("/api/v1/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: "Test",
          tag_ids: [otherTagId],
        }),
      });

      expect(response.status).toBe(403);
      const body = await parseResponse(response, errorResponseSchema);
      expect(body.error.code).toBe("FORBIDDEN");
    });
  });

  describe("PATCH /api/v1/todos/:id - Todo更新", () => {
    it("正常系: 部分更新", async () => {
      const createResponse = await app.request("/api/v1/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: "Original Title" }),
      });
      const created = await parseResponse(createResponse, todoResponseSchema);

      const response = await app.request(`/api/v1/todos/${created.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: "Updated Title" }),
      });

      expect(response.status).toBe(200);
      const body = await parseResponse(response, todoResponseSchema);
      expect(body.title).toBe("Updated Title");
      expect(body.priority).toBe("medium"); // 変更なし
    });

    it("正常系: completed更新", async () => {
      const createResponse = await app.request("/api/v1/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: "Test" }),
      });
      const created = await parseResponse(createResponse, todoResponseSchema);

      const response = await app.request(`/api/v1/todos/${created.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ completed: true }),
      });

      expect(response.status).toBe(200);
      const body = await parseResponse(response, todoResponseSchema);
      expect(body.completed).toBe(true);
    });

    it("正常系: タグの差し替え", async () => {
      const tagId1 = await createTestTag(userId, "Tag 1");
      const tagId2 = await createTestTag(userId, "Tag 2");

      const createResponse = await app.request("/api/v1/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: "Test", tag_ids: [tagId1] }),
      });
      const created = await parseResponse(createResponse, todoResponseSchema);
      expect(created.tags).toHaveLength(1);
      expect(created.tags[0].id).toBe(tagId1);

      const response = await app.request(`/api/v1/todos/${created.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tag_ids: [tagId2] }),
      });

      expect(response.status).toBe(200);
      const body = await parseResponse(response, todoResponseSchema);
      expect(body.tags).toHaveLength(1);
      expect(body.tags[0].id).toBe(tagId2);
    });

    it("異常系: 存在しないIDで404エラー", async () => {
      const response = await app.request("/api/v1/todos/99999", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: "Updated" }),
      });

      expect(response.status).toBe(404);
    });

    it("異常系: 他ユーザーのTodoで404エラー", async () => {
      const otherUser = await createTestUser("todo-other@example.com");
      const createResponse = await app.request("/api/v1/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${otherUser.token}`,
        },
        body: JSON.stringify({ title: "Other's todo" }),
      });
      const created = await parseResponse(createResponse, todoResponseSchema);

      const response = await app.request(`/api/v1/todos/${created.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: "Try to update" }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/v1/todos/:id - Todo削除", () => {
    it("正常系: 削除成功で204", async () => {
      const createResponse = await app.request("/api/v1/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: "To be deleted" }),
      });
      const created = await parseResponse(createResponse, todoResponseSchema);

      const response = await app.request(`/api/v1/todos/${created.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(204);

      // 削除確認
      const getResponse = await app.request(`/api/v1/todos/${created.id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      expect(getResponse.status).toBe(404);
    });

    it("異常系: 存在しないIDで404エラー", async () => {
      const response = await app.request("/api/v1/todos/99999", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(404);
    });

    it("異常系: 他ユーザーのTodoで404エラー", async () => {
      const otherUser = await createTestUser("todo-other@example.com");
      const createResponse = await app.request("/api/v1/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${otherUser.token}`,
        },
        body: JSON.stringify({ title: "Other's todo" }),
      });
      const created = await parseResponse(createResponse, todoResponseSchema);

      const response = await app.request(`/api/v1/todos/${created.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(404);
    });
  });

  describe("PATCH /api/v1/todos/update_order - 順序一括更新", () => {
    it("正常系: 複数のposition更新", async () => {
      // 3つのTodoを作成
      const res1 = await app.request("/api/v1/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: "First" }),
      });
      const todo1 = await parseResponse(res1, todoResponseSchema);

      const res2 = await app.request("/api/v1/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: "Second" }),
      });
      const todo2 = await parseResponse(res2, todoResponseSchema);

      const res3 = await app.request("/api/v1/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: "Third" }),
      });
      const todo3 = await parseResponse(res3, todoResponseSchema);

      // 順序を逆転
      const response = await app.request("/api/v1/todos/update_order", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          todos: [
            { id: todo3.id, position: 0 },
            { id: todo2.id, position: 1 },
            { id: todo1.id, position: 2 },
          ],
        }),
      });

      expect(response.status).toBe(204);

      // 確認
      const listResponse = await app.request("/api/v1/todos", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const list = await parseResponse(listResponse, todoListResponseSchema);
      expect(list[0].title).toBe("Third");
      expect(list[1].title).toBe("Second");
      expect(list[2].title).toBe("First");
    });

    it("異常系: 他ユーザーのTodo含むと403エラー", async () => {
      const otherUser = await createTestUser("todo-other@example.com");
      const otherTodoRes = await app.request("/api/v1/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${otherUser.token}`,
        },
        body: JSON.stringify({ title: "Other's todo" }),
      });
      const otherTodo = await parseResponse(otherTodoRes, todoResponseSchema);

      const myTodoRes = await app.request("/api/v1/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: "My todo" }),
      });
      const myTodo = await parseResponse(myTodoRes, todoResponseSchema);

      const response = await app.request("/api/v1/todos/update_order", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          todos: [
            { id: myTodo.id, position: 0 },
            { id: otherTodo.id, position: 1 },
          ],
        }),
      });

      expect(response.status).toBe(403);
      const body = await parseResponse(response, errorResponseSchema);
      expect(body.error.code).toBe("FORBIDDEN");
    });

    it("異常系: 空配列で400エラー", async () => {
      const response = await app.request("/api/v1/todos/update_order", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ todos: [] }),
      });

      expect(response.status).toBe(400);
      const body = await parseResponse(response, errorResponseSchema);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });
  });
});
