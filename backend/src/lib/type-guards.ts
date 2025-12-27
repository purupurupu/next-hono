/**
 * 型ガードユーティリティ
 * @module lib/type-guards
 */

/**
 * 値がRecord<string, unknown>かどうかを判定する型ガード
 * @param value - 検証する値
 * @returns Record<string, unknown>の場合true
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * オブジェクトが指定されたプロパティをすべて持つかどうかを判定する
 * @param obj - 検証するオブジェクト
 * @param properties - 必須プロパティ名の配列
 * @returns すべてのプロパティが存在する場合true
 */
export function hasProperties<T extends string>(
  obj: Record<string, unknown>,
  properties: T[],
): boolean {
  return properties.every((prop) => prop in obj);
}
