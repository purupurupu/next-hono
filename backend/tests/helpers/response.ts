/**
 * テスト用レスポンスヘルパー
 * @module tests/helpers/response
 */

import type { z } from "zod";

/**
 * JSONレスポンスをZodスキーマでパースする
 * @param response - Fetchレスポンス
 * @param schema - Zodスキーマ
 * @returns パースされたデータ
 */
export async function parseResponse<T extends z.ZodTypeAny>(
  response: Response,
  schema: T,
): Promise<z.infer<T>> {
  const json: unknown = await response.json();
  const result = schema.safeParse(json);
  if (!result.success) {
    throw new Error(`Response validation failed: ${JSON.stringify(result.error.issues)}`);
  }
  return result.data;
}
