/**
 * Auth レスポンス型・変換関数
 * @module features/auth/types
 */

import type { User } from "../../models/schema";
import type { UserResponse } from "../../shared/validators/responses";

// 型はresponses.tsから再エクスポート
export type { AuthResponse, UserResponse } from "../../shared/validators/responses";

/**
 * ユーザーをレスポンス形式にフォーマットする
 * @param user - ユーザーエンティティ
 * @returns フォーマットされたユーザー情報
 */
export function formatUser(user: User): UserResponse {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    created_at: user.createdAt.toISOString(),
    updated_at: user.updatedAt.toISOString(),
  };
}
