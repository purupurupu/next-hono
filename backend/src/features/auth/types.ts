/**
 * Auth レスポンス型・変換関数
 * @module features/auth/types
 */

import type { User } from "../../models/schema";

/** ユーザーレスポンス型（APIが返すユーザー情報） */
export interface UserResponse {
  id: number;
  email: string;
  name: string | null;
  created_at: string;
  updated_at: string;
}

/** 認証レスポンスの型定義 */
export interface AuthResponse {
  /** ユーザー情報 */
  user: UserResponse;
  /** 認証トークン */
  token: string;
}

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
