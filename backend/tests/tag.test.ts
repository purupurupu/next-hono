import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/lib/app";
import {
  errorResponseSchema,
  tagListResponseSchema,
  tagResponseSchema,
} from "../src/shared/validators/responses";
import { createUserAndGetToken } from "./helpers/auth";
import { parseResponse } from "./helpers/response";
import { clearDatabase } from "./setup";

const app = createApp();

describe("タグAPI", () => {
  let token: string;

  beforeAll(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await clearDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    token = await createUserAndGetToken("tag-test@example.com");
  });

  describe("GET /api/v1/tags - タグ一覧取得", () => {
    it("正常系: 空の一覧を取得できる", async () => {
      const response = await app.request("/api/v1/tags", {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);
      const body = await parseResponse(response, tagListResponseSchema);
      expect(body).toEqual([]);
    });

    it("正常系: 作成したタグを一覧で取得できる", async () => {
      await app.request("/api/v1/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "urgent", color: "#FF0000" }),
      });
      await app.request("/api/v1/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "important" }),
      });

      const response = await app.request("/api/v1/tags", {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);
      const body = await parseResponse(response, tagListResponseSchema);
      expect(body).toHaveLength(2);
    });

    it("異常系: 認証なしで401エラー", async () => {
      const response = await app.request("/api/v1/tags");

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/v1/tags - タグ作成", () => {
    it("正常系: タグを作成できる（色あり）", async () => {
      const response = await app.request("/api/v1/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "Urgent", color: "#FF5733" }),
      });

      expect(response.status).toBe(201);
      const body = await parseResponse(response, tagResponseSchema);
      expect(body.name).toBe("urgent"); // 正規化される
      expect(body.color).toBe("#FF5733");
    });

    it("正常系: タグを作成できる（色なし）", async () => {
      const response = await app.request("/api/v1/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "Important" }),
      });

      expect(response.status).toBe(201);
      const body = await parseResponse(response, tagResponseSchema);
      expect(body.name).toBe("important"); // 正規化される
      expect(body.color).toBeNull();
    });

    it("正常系: タグ名が正規化される（小文字+trim）", async () => {
      const response = await app.request("/api/v1/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "  UPPER Case  ", color: "#000000" }),
      });

      expect(response.status).toBe(201);
      const body = await parseResponse(response, tagResponseSchema);
      expect(body.name).toBe("upper case");
    });

    it("異常系: 同じ名前のタグで409エラー", async () => {
      await app.request("/api/v1/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "duplicate" }),
      });

      const response = await app.request("/api/v1/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "DUPLICATE" }), // 正規化後に同じになる
      });

      expect(response.status).toBe(409);
      const body = await parseResponse(response, errorResponseSchema);
      expect(body.error.code).toBe("CONFLICT");
    });

    it("異常系: 名前が空で400エラー", async () => {
      const response = await app.request("/api/v1/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "" }),
      });

      expect(response.status).toBe(400);
      const body = await parseResponse(response, errorResponseSchema);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("異常系: 名前が31文字で400エラー", async () => {
      const response = await app.request("/api/v1/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "a".repeat(31) }),
      });

      expect(response.status).toBe(400);
      const body = await parseResponse(response, errorResponseSchema);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("異常系: 無効な色形式で400エラー", async () => {
      const response = await app.request("/api/v1/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "test", color: "red" }),
      });

      expect(response.status).toBe(400);
      const body = await parseResponse(response, errorResponseSchema);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("GET /api/v1/tags/:id - タグ詳細取得", () => {
    it("正常系: タグ詳細を取得できる", async () => {
      const createResponse = await app.request("/api/v1/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "detail-test", color: "#123456" }),
      });
      const created = await parseResponse(createResponse, tagResponseSchema);

      const response = await app.request(`/api/v1/tags/${created.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);
      const body = await parseResponse(response, tagResponseSchema);
      expect(body.id).toBe(created.id);
      expect(body.name).toBe("detail-test");
    });

    it("異常系: 存在しないIDで404エラー", async () => {
      const response = await app.request("/api/v1/tags/99999", {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(404);
      const body = await parseResponse(response, errorResponseSchema);
      expect(body.error.code).toBe("NOT_FOUND");
    });
  });

  describe("PATCH /api/v1/tags/:id - タグ更新", () => {
    it("正常系: タグを更新できる", async () => {
      const createResponse = await app.request("/api/v1/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "before", color: "#000000" }),
      });
      const created = await parseResponse(createResponse, tagResponseSchema);

      const response = await app.request(`/api/v1/tags/${created.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "After", color: "#FFFFFF" }),
      });

      expect(response.status).toBe(200);
      const body = await parseResponse(response, tagResponseSchema);
      expect(body.name).toBe("after"); // 正規化される
      expect(body.color).toBe("#FFFFFF");
    });

    it("正常系: 名前のみ更新できる", async () => {
      const createResponse = await app.request("/api/v1/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "partial", color: "#AABBCC" }),
      });
      const created = await parseResponse(createResponse, tagResponseSchema);

      const response = await app.request(`/api/v1/tags/${created.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "renamed" }),
      });

      expect(response.status).toBe(200);
      const body = await parseResponse(response, tagResponseSchema);
      expect(body.name).toBe("renamed");
      expect(body.color).toBe("#AABBCC");
    });

    it("異常系: 他のタグと同じ名前で409エラー", async () => {
      await app.request("/api/v1/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "existing" }),
      });
      const createResponse = await app.request("/api/v1/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "to-update" }),
      });
      const created = await parseResponse(createResponse, tagResponseSchema);

      const response = await app.request(`/api/v1/tags/${created.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "EXISTING" }), // 正規化後に同じ
      });

      expect(response.status).toBe(409);
      const body = await parseResponse(response, errorResponseSchema);
      expect(body.error.code).toBe("CONFLICT");
    });

    it("異常系: 存在しないIDで404エラー", async () => {
      const response = await app.request("/api/v1/tags/99999", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "update" }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/v1/tags/:id - タグ削除", () => {
    it("正常系: タグを削除できる", async () => {
      const createResponse = await app.request("/api/v1/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "to-delete" }),
      });
      const created = await parseResponse(createResponse, tagResponseSchema);

      const response = await app.request(`/api/v1/tags/${created.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(204);

      // 削除確認
      const getResponse = await app.request(`/api/v1/tags/${created.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(getResponse.status).toBe(404);
    });

    it("異常系: 存在しないIDで404エラー", async () => {
      const response = await app.request("/api/v1/tags/99999", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(404);
    });
  });

  describe("ユーザー分離", () => {
    it("他のユーザーのタグにはアクセスできない", async () => {
      // ユーザー1がタグを作成
      const createResponse = await app.request("/api/v1/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "user1-tag" }),
      });
      const created = await parseResponse(createResponse, tagResponseSchema);

      // ユーザー2を作成
      const token2 = await createUserAndGetToken("another@example.com");

      // ユーザー2からのアクセス
      const getResponse = await app.request(`/api/v1/tags/${created.id}`, {
        headers: { Authorization: `Bearer ${token2}` },
      });
      expect(getResponse.status).toBe(404);

      const updateResponse = await app.request(`/api/v1/tags/${created.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token2}`,
        },
        body: JSON.stringify({ name: "changed" }),
      });
      expect(updateResponse.status).toBe(404);

      const deleteResponse = await app.request(`/api/v1/tags/${created.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token2}` },
      });
      expect(deleteResponse.status).toBe(404);

      // ユーザー2の一覧にはユーザー1のタグが含まれない
      const listResponse = await app.request("/api/v1/tags", {
        headers: { Authorization: `Bearer ${token2}` },
      });
      const list = await parseResponse(listResponse, tagListResponseSchema);
      expect(list).toHaveLength(0);
    });
  });
});
