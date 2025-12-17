import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { ApiError } from "../src/lib/errors";
import authRoutes from "../src/routes/auth";
import { clearDatabase } from "./setup";

/** 認証レスポンスのスキーマ */
const authResponseSchema = z.object({
  user: z.object({
    id: z.number(),
    email: z.string(),
    name: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
  }),
  token: z.string(),
});

/** エラーレスポンスのスキーマ */
const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.array(z.string())).optional(),
  }),
});

/**
 * JSONレスポンスをZodスキーマでパースする
 * @param response - Fetchレスポンス
 * @param schema - Zodスキーマ
 * @returns パースされたデータ
 */
async function parseResponse<T extends z.ZodTypeAny>(
  response: Response,
  schema: T,
): Promise<z.infer<T>> {
  const json: unknown = await response.json();
  return schema.parse(json);
}

const app = new Hono();

app.use(
  "*",
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
    exposeHeaders: ["Authorization"],
  }),
);

app.route("/auth", authRoutes);

app.onError((err, c) => {
  if (err instanceof ApiError) {
    return c.json(err.toJSON(), err.statusCode);
  }
  console.error("Test error:", err);
  const message = err instanceof Error ? err.message : "Unknown error";
  return c.json({ error: { code: "INTERNAL_ERROR", message } }, 500);
});

describe("認証API", () => {
  beforeAll(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await clearDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe("POST /auth/sign_up - ユーザー登録", () => {
    it("正常系: 新規ユーザーを登録できる", async () => {
      const response = await app.request("/auth/sign_up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test@example.com",
          password: "password123",
          password_confirmation: "password123",
          name: "テストユーザー",
        }),
      });

      expect(response.status).toBe(201);
      const body = await parseResponse(response, authResponseSchema);
      expect(body.user).toBeDefined();
      expect(body.user.email).toBe("test@example.com");
      expect(body.user.name).toBe("テストユーザー");
      expect(body.token).toBeDefined();
      expect(typeof body.token).toBe("string");
    });

    it("正常系: 名前なしで登録できる", async () => {
      const response = await app.request("/auth/sign_up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "noname@example.com",
          password: "password123",
          password_confirmation: "password123",
        }),
      });

      expect(response.status).toBe(201);
      const body = await parseResponse(response, authResponseSchema);
      expect(body.user.email).toBe("noname@example.com");
      expect(body.user.name).toBeNull();
    });

    it("異常系: メールアドレス重複で409エラー", async () => {
      await app.request("/auth/sign_up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "duplicate@example.com",
          password: "password123",
          password_confirmation: "password123",
        }),
      });

      const response = await app.request("/auth/sign_up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "duplicate@example.com",
          password: "password456",
          password_confirmation: "password456",
        }),
      });

      expect(response.status).toBe(409);
      const body = await parseResponse(response, errorResponseSchema);
      expect(body.error.code).toBe("CONFLICT");
    });

    it("異常系: パスワード不一致で400エラー", async () => {
      const response = await app.request("/auth/sign_up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "mismatch@example.com",
          password: "password123",
          password_confirmation: "different123",
        }),
      });

      expect(response.status).toBe(400);
      const body = await parseResponse(response, errorResponseSchema);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("異常系: パスワードが短すぎると400エラー", async () => {
      const response = await app.request("/auth/sign_up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "short@example.com",
          password: "short",
          password_confirmation: "short",
        }),
      });

      expect(response.status).toBe(400);
      const body = await parseResponse(response, errorResponseSchema);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("異常系: 無効なメールアドレスで400エラー", async () => {
      const response = await app.request("/auth/sign_up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "invalid-email",
          password: "password123",
          password_confirmation: "password123",
        }),
      });

      expect(response.status).toBe(400);
      const body = await parseResponse(response, errorResponseSchema);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("POST /auth/sign_in - ログイン", () => {
    beforeEach(async () => {
      await app.request("/auth/sign_up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "login@example.com",
          password: "password123",
          password_confirmation: "password123",
          name: "ログインテスト",
        }),
      });
    });

    it("正常系: ログインしてトークンを取得できる", async () => {
      const response = await app.request("/auth/sign_in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "login@example.com",
          password: "password123",
        }),
      });

      expect(response.status).toBe(200);
      const body = await parseResponse(response, authResponseSchema);
      expect(body.user).toBeDefined();
      expect(body.user.email).toBe("login@example.com");
      expect(body.token).toBeDefined();
    });

    it("異常系: 存在しないメールアドレスで401エラー", async () => {
      const response = await app.request("/auth/sign_in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "notexist@example.com",
          password: "password123",
        }),
      });

      expect(response.status).toBe(401);
      const body = await parseResponse(response, errorResponseSchema);
      expect(body.error.code).toBe("UNAUTHORIZED");
    });

    it("異常系: パスワード間違いで401エラー", async () => {
      const response = await app.request("/auth/sign_in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "login@example.com",
          password: "wrongpassword",
        }),
      });

      expect(response.status).toBe(401);
      const body = await parseResponse(response, errorResponseSchema);
      expect(body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("DELETE /auth/sign_out - ログアウト", () => {
    let token: string;

    beforeEach(async () => {
      const signUpResponse = await app.request("/auth/sign_up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "logout@example.com",
          password: "password123",
          password_confirmation: "password123",
        }),
      });
      const signUpBody = await parseResponse(signUpResponse, authResponseSchema);
      token = signUpBody.token;
    });

    it("正常系: ログアウトしてトークンを無効化できる", async () => {
      const response = await app.request("/auth/sign_out", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(204);

      const retryResponse = await app.request("/auth/sign_out", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(retryResponse.status).toBe(401);
    });

    it("異常系: トークンなしで401エラー", async () => {
      const response = await app.request("/auth/sign_out", {
        method: "DELETE",
      });

      expect(response.status).toBe(401);
      const body = await parseResponse(response, errorResponseSchema);
      expect(body.error.code).toBe("UNAUTHORIZED");
    });

    it("異常系: 無効なトークンで401エラー", async () => {
      const response = await app.request("/auth/sign_out", {
        method: "DELETE",
        headers: {
          Authorization: "Bearer invalid-token",
        },
      });

      expect(response.status).toBe(401);
    });
  });
});
