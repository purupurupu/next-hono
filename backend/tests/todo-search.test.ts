import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/lib/app";
import { errorResponseSchema, todoResponseSchema } from "../src/shared/validators/responses";
import {
  attachTagToTodo,
  createTestCategory,
  createTestTag,
  createTestTodo,
  createTestUser,
} from "./helpers/factory";
import { parseResponse } from "./helpers/response";
import { clearDatabase } from "./setup";
import { z } from "zod";

const app = createApp();

/** 検索レスポンスのスキーマ */
const todoSearchResponseSchema = z.object({
  data: z.array(todoResponseSchema),
  meta: z.object({
    total: z.number(),
    current_page: z.number(),
    total_pages: z.number(),
    per_page: z.number(),
    search_query: z.string().optional(),
    filters_applied: z.record(z.string(), z.unknown()),
  }),
  suggestions: z
    .array(
      z.object({
        type: z.string(),
        message: z.string(),
        current_filters: z.array(z.string()).optional(),
      }),
    )
    .optional(),
});

describe("Todo Search API", () => {
  let token: string;
  let userId: number;

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

  describe("GET /api/v1/todos/search - 基本検索", () => {
    it("正常系: パラメータなしで全件取得", async () => {
      await createTestTodo({ userId, title: "Todo 1", position: 0 });
      await createTestTodo({ userId, title: "Todo 2", position: 1 });

      const response = await app.request("/api/v1/todos/search", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);
      const body = await parseResponse(response, todoSearchResponseSchema);
      expect(body.data).toHaveLength(2);
      expect(body.meta.total).toBe(2);
      expect(body.meta.current_page).toBe(1);
      expect(body.meta.per_page).toBe(20);
    });

    it("正常系: 空結果で空配列を返す", async () => {
      const response = await app.request("/api/v1/todos/search", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);
      const body = await parseResponse(response, todoSearchResponseSchema);
      expect(body.data).toEqual([]);
      expect(body.meta.total).toBe(0);
    });

    it("異常系: 認証なしで401エラー", async () => {
      const response = await app.request("/api/v1/todos/search", {
        method: "GET",
      });

      expect(response.status).toBe(401);
      const body = await parseResponse(response, errorResponseSchema);
      expect(body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("GET /api/v1/todos/search - テキスト検索", () => {
    it("正常系: タイトルで部分一致検索", async () => {
      await createTestTodo({ userId, title: "買い物リスト", position: 0 });
      await createTestTodo({ userId, title: "会議メモ", position: 1 });
      await createTestTodo({ userId, title: "買い物メモ", position: 2 });

      const response = await app.request("/api/v1/todos/search?q=買い物", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);
      const body = await parseResponse(response, todoSearchResponseSchema);
      expect(body.data).toHaveLength(2);
      expect(body.meta.search_query).toBe("買い物");
    });

    it("正常系: 説明で部分一致検索", async () => {
      await createTestTodo({ userId, title: "タスク1", description: "重要な仕事", position: 0 });
      await createTestTodo({ userId, title: "タスク2", description: "普通の作業", position: 1 });

      const response = await app.request("/api/v1/todos/search?q=重要", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);
      const body = await parseResponse(response, todoSearchResponseSchema);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].title).toBe("タスク1");
    });

    it("正常系: 大文字小文字を区別しない検索（ILIKE）", async () => {
      await createTestTodo({ userId, title: "TODO Item", position: 0 });
      await createTestTodo({ userId, title: "todo item", position: 1 });

      const response = await app.request("/api/v1/todos/search?q=TODO", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);
      const body = await parseResponse(response, todoSearchResponseSchema);
      expect(body.data).toHaveLength(2);
    });
  });

  describe("GET /api/v1/todos/search - ステータスフィルター", () => {
    it("正常系: 単一ステータスでフィルター", async () => {
      await createTestTodo({ userId, title: "Pending", status: 0, position: 0 });
      await createTestTodo({ userId, title: "In Progress", status: 1, position: 1 });
      await createTestTodo({ userId, title: "Completed", status: 2, position: 2 });

      const response = await app.request("/api/v1/todos/search?status=pending", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);
      const body = await parseResponse(response, todoSearchResponseSchema);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].status).toBe("pending");
    });

    it("正常系: 複数ステータスでフィルター（配列形式）", async () => {
      await createTestTodo({ userId, title: "Pending", status: 0, position: 0 });
      await createTestTodo({ userId, title: "In Progress", status: 1, position: 1 });
      await createTestTodo({ userId, title: "Completed", status: 2, position: 2 });

      const response = await app.request(
        "/api/v1/todos/search?status[]=pending&status[]=in_progress",
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      expect(response.status).toBe(200);
      const body = await parseResponse(response, todoSearchResponseSchema);
      expect(body.data).toHaveLength(2);
    });
  });

  describe("GET /api/v1/todos/search - 優先度フィルター", () => {
    it("正常系: 優先度でフィルター", async () => {
      await createTestTodo({ userId, title: "Low", priority: 0, position: 0 });
      await createTestTodo({ userId, title: "Medium", priority: 1, position: 1 });
      await createTestTodo({ userId, title: "High", priority: 2, position: 2 });

      const response = await app.request("/api/v1/todos/search?priority=high", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);
      const body = await parseResponse(response, todoSearchResponseSchema);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].priority).toBe("high");
    });
  });

  describe("GET /api/v1/todos/search - カテゴリフィルター", () => {
    it("正常系: カテゴリでフィルター", async () => {
      const categoryId = await createTestCategory(userId, "Work");
      await createTestTodo({ userId, title: "Work Task", categoryId, position: 0 });
      await createTestTodo({ userId, title: "No Category", position: 1 });

      const response = await app.request(`/api/v1/todos/search?category_id=${categoryId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);
      const body = await parseResponse(response, todoSearchResponseSchema);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].category?.id).toBe(categoryId);
    });

    it("正常系: カテゴリなし（-1）でフィルター", async () => {
      const categoryId = await createTestCategory(userId, "Work");
      await createTestTodo({ userId, title: "Work Task", categoryId, position: 0 });
      await createTestTodo({ userId, title: "No Category", position: 1 });

      const response = await app.request("/api/v1/todos/search?category_id=-1", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);
      const body = await parseResponse(response, todoSearchResponseSchema);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].category).toBeNull();
    });
  });

  describe("GET /api/v1/todos/search - タグフィルター", () => {
    it("正常系: タグでフィルター（ANYモード）", async () => {
      const tag1 = await createTestTag(userId, "urgent");
      const tag2 = await createTestTag(userId, "important");
      const todoId1 = await createTestTodo({ userId, title: "Todo 1", position: 0 });
      const todoId2 = await createTestTodo({ userId, title: "Todo 2", position: 1 });
      await createTestTodo({ userId, title: "Todo 3", position: 2 });

      await attachTagToTodo(todoId1, tag1);
      await attachTagToTodo(todoId2, tag2);

      const response = await app.request(`/api/v1/todos/search?tag_ids[]=${tag1}&tag_mode=any`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);
      const body = await parseResponse(response, todoSearchResponseSchema);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].title).toBe("Todo 1");
    });

    it("正常系: タグでフィルター（ALLモード）", async () => {
      const tag1 = await createTestTag(userId, "urgent");
      const tag2 = await createTestTag(userId, "important");
      const todoId1 = await createTestTodo({ userId, title: "Todo 1", position: 0 });
      const todoId2 = await createTestTodo({ userId, title: "Todo 2", position: 1 });

      // Todo 1 has both tags
      await attachTagToTodo(todoId1, tag1);
      await attachTagToTodo(todoId1, tag2);
      // Todo 2 has only one tag
      await attachTagToTodo(todoId2, tag1);

      const response = await app.request(
        `/api/v1/todos/search?tag_ids[]=${tag1}&tag_ids[]=${tag2}&tag_mode=all`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      expect(response.status).toBe(200);
      const body = await parseResponse(response, todoSearchResponseSchema);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].title).toBe("Todo 1");
    });
  });

  describe("GET /api/v1/todos/search - 日付範囲フィルター", () => {
    it("正常系: 日付範囲でフィルター", async () => {
      await createTestTodo({ userId, title: "Past", dueDate: "2024-01-01", position: 0 });
      await createTestTodo({ userId, title: "Current", dueDate: "2025-06-15", position: 1 });
      await createTestTodo({ userId, title: "Future", dueDate: "2026-12-31", position: 2 });

      const response = await app.request(
        "/api/v1/todos/search?due_date_from=2025-01-01&due_date_to=2025-12-31",
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      expect(response.status).toBe(200);
      const body = await parseResponse(response, todoSearchResponseSchema);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].title).toBe("Current");
    });
  });

  describe("GET /api/v1/todos/search - ソート", () => {
    it("正常系: position昇順（デフォルト）", async () => {
      await createTestTodo({ userId, title: "Third", position: 2 });
      await createTestTodo({ userId, title: "First", position: 0 });
      await createTestTodo({ userId, title: "Second", position: 1 });

      const response = await app.request("/api/v1/todos/search", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);
      const body = await parseResponse(response, todoSearchResponseSchema);
      expect(body.data[0].title).toBe("First");
      expect(body.data[1].title).toBe("Second");
      expect(body.data[2].title).toBe("Third");
    });

    it("正常系: priority降順でソート", async () => {
      await createTestTodo({ userId, title: "Low", priority: 0, position: 0 });
      await createTestTodo({ userId, title: "High", priority: 2, position: 1 });
      await createTestTodo({ userId, title: "Medium", priority: 1, position: 2 });

      const response = await app.request("/api/v1/todos/search?sort_by=priority&sort_order=desc", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);
      const body = await parseResponse(response, todoSearchResponseSchema);
      expect(body.data[0].priority).toBe("high");
      expect(body.data[1].priority).toBe("medium");
      expect(body.data[2].priority).toBe("low");
    });

    it("正常系: due_dateソートでNULLが最後", async () => {
      await createTestTodo({ userId, title: "No Date", dueDate: undefined, position: 0 });
      await createTestTodo({ userId, title: "Early", dueDate: "2025-01-01", position: 1 });
      await createTestTodo({ userId, title: "Late", dueDate: "2025-12-31", position: 2 });

      const response = await app.request("/api/v1/todos/search?sort_by=due_date&sort_order=asc", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);
      const body = await parseResponse(response, todoSearchResponseSchema);
      expect(body.data[0].title).toBe("Early");
      expect(body.data[1].title).toBe("Late");
      expect(body.data[2].title).toBe("No Date");
    });
  });

  describe("GET /api/v1/todos/search - ページネーション", () => {
    it("正常系: ページサイズ指定", async () => {
      for (let i = 0; i < 10; i++) {
        await createTestTodo({ userId, title: `Todo ${i}`, position: i });
      }

      const response = await app.request("/api/v1/todos/search?per_page=5", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);
      const body = await parseResponse(response, todoSearchResponseSchema);
      expect(body.data).toHaveLength(5);
      expect(body.meta.total).toBe(10);
      expect(body.meta.per_page).toBe(5);
      expect(body.meta.total_pages).toBe(2);
    });

    it("正常系: 2ページ目を取得", async () => {
      for (let i = 0; i < 10; i++) {
        await createTestTodo({ userId, title: `Todo ${i}`, position: i });
      }

      const response = await app.request("/api/v1/todos/search?per_page=5&page=2", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);
      const body = await parseResponse(response, todoSearchResponseSchema);
      expect(body.data).toHaveLength(5);
      expect(body.meta.current_page).toBe(2);
      expect(body.data[0].title).toBe("Todo 5");
    });
  });

  describe("GET /api/v1/todos/search - 複合条件", () => {
    it("正常系: テキスト検索 + ステータスフィルター", async () => {
      await createTestTodo({ userId, title: "買い物", status: 0, position: 0 });
      await createTestTodo({ userId, title: "買い物リスト", status: 2, position: 1 });
      await createTestTodo({ userId, title: "会議", status: 0, position: 2 });

      const response = await app.request("/api/v1/todos/search?q=買い物&status=pending", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);
      const body = await parseResponse(response, todoSearchResponseSchema);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].title).toBe("買い物");
    });
  });

  describe("GET /api/v1/todos/search - ユーザースコープ", () => {
    it("正常系: 他ユーザーのTodoは含まれない", async () => {
      const otherUser = await createTestUser("other@example.com");
      await createTestTodo({ userId, title: "My Todo", position: 0 });
      await createTestTodo({ userId: otherUser.userId, title: "Other Todo", position: 0 });

      const response = await app.request("/api/v1/todos/search", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);
      const body = await parseResponse(response, todoSearchResponseSchema);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].title).toBe("My Todo");
    });
  });

  describe("GET /api/v1/todos/search - サジェスション", () => {
    it("正常系: 結果0件でサジェスションを返す", async () => {
      await createTestTodo({ userId, title: "Test", position: 0 });

      const response = await app.request(
        "/api/v1/todos/search?q=nonexistent&status=completed",
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      expect(response.status).toBe(200);
      const body = await parseResponse(response, todoSearchResponseSchema);
      expect(body.data).toHaveLength(0);
      expect(body.suggestions).toBeDefined();
      expect(body.suggestions!.length).toBeGreaterThan(0);
    });
  });
});
