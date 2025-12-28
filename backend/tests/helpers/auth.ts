/**
 * テスト用認証ヘルパー
 * @module tests/helpers/auth
 */

import { createApp } from "../../src/lib/app";
import { authResponseSchema } from "../../src/shared/validators/responses";
import { parseResponse } from "./response";

const app = createApp();

/**
 * テスト用ユーザーを作成してトークンを取得する
 * @param email - ユーザーのメールアドレス
 * @returns JWTトークン
 */
export async function createUserAndGetToken(email: string): Promise<string> {
  const response = await app.request("/auth/sign_up", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password: "password123",
      password_confirmation: "password123",
    }),
  });
  const body = await parseResponse(response, authResponseSchema);
  return body.token;
}
