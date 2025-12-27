import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/lib/app";
import {
  categoryListResponseSchema,
  categoryResponseSchema,
  errorResponseSchema,
} from "../src/shared/validators/responses";
import { createUserAndGetToken } from "./helpers/auth";
import { parseResponse } from "./helpers/response";
import { clearDatabase } from "./setup";

const app = createApp();

describe("カテゴリAPI", () => {
  let token: string;

  beforeAll(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await clearDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    token = await createUserAndGetToken("category-test@example.com");
  });

  describe("GET /api/v1/categories - カテゴリ一覧取得", () => {
    it("正常系: 空の一覧を取得できる", async () => {
      const response = await app.request("/api/v1/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);
      const body = await parseResponse(response, categoryListResponseSchema);
      expect(body).toEqual([]);
    });

    it("正常系: 作成したカテゴリを一覧で取得できる", async () => {
      // カテゴリを作成
      await app.request("/api/v1/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "仕事", color: "#FF0000" }),
      });
      await app.request("/api/v1/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "プライベート", color: "#00FF00" }),
      });

      const response = await app.request("/api/v1/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);
      const body = await parseResponse(response, categoryListResponseSchema);
      expect(body).toHaveLength(2);
    });

    it("異常系: 認証なしで401エラー", async () => {
      const response = await app.request("/api/v1/categories");

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/v1/categories - カテゴリ作成", () => {
    it("正常系: カテゴリを作成できる", async () => {
      const response = await app.request("/api/v1/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "仕事", color: "#FF5733" }),
      });

      expect(response.status).toBe(201);
      const body = await parseResponse(response, categoryResponseSchema);
      expect(body.name).toBe("仕事");
      expect(body.color).toBe("#FF5733");
      expect(body.todos_count).toBe(0);
    });

    it("異常系: 同じ名前のカテゴリで409エラー", async () => {
      await app.request("/api/v1/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "重複", color: "#FF0000" }),
      });

      const response = await app.request("/api/v1/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "重複", color: "#00FF00" }),
      });

      expect(response.status).toBe(409);
      const body = await parseResponse(response, errorResponseSchema);
      expect(body.error.code).toBe("CONFLICT");
    });

    it("異常系: 名前が空で400エラー", async () => {
      const response = await app.request("/api/v1/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "", color: "#FF0000" }),
      });

      expect(response.status).toBe(400);
      const body = await parseResponse(response, errorResponseSchema);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("異常系: 名前が51文字で400エラー", async () => {
      const response = await app.request("/api/v1/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "a".repeat(51), color: "#FF0000" }),
      });

      expect(response.status).toBe(400);
      const body = await parseResponse(response, errorResponseSchema);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("異常系: 無効な色形式で400エラー", async () => {
      const response = await app.request("/api/v1/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "テスト", color: "invalid" }),
      });

      expect(response.status).toBe(400);
      const body = await parseResponse(response, errorResponseSchema);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("GET /api/v1/categories/:id - カテゴリ詳細取得", () => {
    it("正常系: カテゴリ詳細を取得できる", async () => {
      const createResponse = await app.request("/api/v1/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "詳細テスト", color: "#123456" }),
      });
      const created = await parseResponse(createResponse, categoryResponseSchema);

      const response = await app.request(`/api/v1/categories/${created.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);
      const body = await parseResponse(response, categoryResponseSchema);
      expect(body.id).toBe(created.id);
      expect(body.name).toBe("詳細テスト");
    });

    it("異常系: 存在しないIDで404エラー", async () => {
      const response = await app.request("/api/v1/categories/99999", {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(404);
      const body = await parseResponse(response, errorResponseSchema);
      expect(body.error.code).toBe("NOT_FOUND");
    });
  });

  describe("PATCH /api/v1/categories/:id - カテゴリ更新", () => {
    it("正常系: カテゴリを更新できる", async () => {
      const createResponse = await app.request("/api/v1/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "更新前", color: "#000000" }),
      });
      const created = await parseResponse(createResponse, categoryResponseSchema);

      const response = await app.request(`/api/v1/categories/${created.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "更新後", color: "#FFFFFF" }),
      });

      expect(response.status).toBe(200);
      const body = await parseResponse(response, categoryResponseSchema);
      expect(body.name).toBe("更新後");
      expect(body.color).toBe("#FFFFFF");
    });

    it("正常系: 名前のみ更新できる", async () => {
      const createResponse = await app.request("/api/v1/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "部分更新", color: "#AABBCC" }),
      });
      const created = await parseResponse(createResponse, categoryResponseSchema);

      const response = await app.request(`/api/v1/categories/${created.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "名前変更" }),
      });

      expect(response.status).toBe(200);
      const body = await parseResponse(response, categoryResponseSchema);
      expect(body.name).toBe("名前変更");
      expect(body.color).toBe("#AABBCC");
    });

    it("異常系: 他のカテゴリと同じ名前で409エラー", async () => {
      await app.request("/api/v1/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "既存", color: "#111111" }),
      });
      const createResponse = await app.request("/api/v1/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "変更対象", color: "#222222" }),
      });
      const created = await parseResponse(createResponse, categoryResponseSchema);

      const response = await app.request(`/api/v1/categories/${created.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "既存" }),
      });

      expect(response.status).toBe(409);
      const body = await parseResponse(response, errorResponseSchema);
      expect(body.error.code).toBe("CONFLICT");
    });

    it("異常系: 存在しないIDで404エラー", async () => {
      const response = await app.request("/api/v1/categories/99999", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "更新" }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/v1/categories/:id - カテゴリ削除", () => {
    it("正常系: カテゴリを削除できる", async () => {
      const createResponse = await app.request("/api/v1/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "削除対象", color: "#FF0000" }),
      });
      const created = await parseResponse(createResponse, categoryResponseSchema);

      const response = await app.request(`/api/v1/categories/${created.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(204);

      // 削除確認
      const getResponse = await app.request(`/api/v1/categories/${created.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(getResponse.status).toBe(404);
    });

    it("異常系: 存在しないIDで404エラー", async () => {
      const response = await app.request("/api/v1/categories/99999", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(404);
    });
  });

  describe("ユーザー分離", () => {
    it("他のユーザーのカテゴリにはアクセスできない", async () => {
      // ユーザー1がカテゴリを作成
      const createResponse = await app.request("/api/v1/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "ユーザー1のカテゴリ", color: "#FF0000" }),
      });
      const created = await parseResponse(createResponse, categoryResponseSchema);

      // ユーザー2を作成
      const token2 = await createUserAndGetToken("another@example.com");

      // ユーザー2からのアクセス
      const getResponse = await app.request(`/api/v1/categories/${created.id}`, {
        headers: { Authorization: `Bearer ${token2}` },
      });
      expect(getResponse.status).toBe(404);

      const updateResponse = await app.request(`/api/v1/categories/${created.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token2}`,
        },
        body: JSON.stringify({ name: "変更" }),
      });
      expect(updateResponse.status).toBe(404);

      const deleteResponse = await app.request(`/api/v1/categories/${created.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token2}` },
      });
      expect(deleteResponse.status).toBe(404);

      // ユーザー2の一覧にはユーザー1のカテゴリが含まれない
      const listResponse = await app.request("/api/v1/categories", {
        headers: { Authorization: `Bearer ${token2}` },
      });
      const list = await parseResponse(listResponse, categoryListResponseSchema);
      expect(list).toHaveLength(0);
    });
  });
});
