/**
 * テスト用認証ヘルパー
 * @module tests/helpers/auth
 * @deprecated factory.ts の createTestUser を使用してください
 */

import { createTestUser } from "./factory";

/**
 * テスト用ユーザーを作成してトークンを取得する
 * @param email - ユーザーのメールアドレス
 * @returns JWTトークン
 * @deprecated createTestUser を使用してください
 */
export async function createUserAndGetToken(email: string): Promise<string> {
  const result = await createTestUser(email);
  return result.token;
}
