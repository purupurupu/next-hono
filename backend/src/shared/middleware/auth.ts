import type { Context, MiddlewareHandler } from "hono";
import type { TokenPayload } from "../../features/auth/token-schema";
import { AUTH } from "../../lib/constants";
import { getAuthService, getUserRepository } from "../../lib/container";
import { handleJoseError, isJoseError, unauthorized } from "../../lib/errors";
import { hasProperties, isRecord } from "../../lib/type-guards";
import type { User } from "../../models/schema";

/** 認証コンテキストの型定義 */
export interface AuthContext {
  /** トークンペイロード */
  payload: TokenPayload;
  /** ユーザー情報 */
  user: User;
}

/**
 * AuthContextの型ガード
 * @param value - 検証する値
 * @returns AuthContextかどうか
 */
function isAuthContext(value: unknown): value is AuthContext {
  if (!isRecord(value)) {
    return false;
  }
  return hasProperties(value, ["payload", "user"]);
}

/**
 * Userの型ガード
 * @param value - 検証する値
 * @returns Userかどうか
 */
function isUser(value: unknown): value is User {
  if (!isRecord(value)) {
    return false;
  }
  return hasProperties(value, ["id", "email", "encryptedPassword"]);
}

/**
 * JWT認証ミドルウェア
 * AuthorizationヘッダーからBearerトークンを検証し、ユーザー情報をコンテキストに設定する
 * @returns Honoミドルウェアハンドラー
 * @throws 認証トークンがない場合は401エラー
 * @throws トークンが無効な場合は401エラー
 * @throws ユーザーが見つからない場合は401エラー
 */
export function jwtAuth(): MiddlewareHandler {
  return async (c, next) => {
    const authHeader = c.req.header("Authorization");

    if (!authHeader) {
      throw unauthorized("認証トークンが必要です");
    }

    if (!authHeader.startsWith(AUTH.BEARER_SCHEME)) {
      throw unauthorized("無効な認証ヘッダー形式です");
    }

    const token = authHeader.slice(AUTH.BEARER_SCHEME_LENGTH);

    if (!token) {
      throw unauthorized("トークンが指定されていません");
    }

    try {
      const authService = getAuthService();
      const userRepository = getUserRepository();

      const payload = await authService.validateToken(token);

      const userId = Number.parseInt(payload.sub, 10);
      const user = await userRepository.findById(userId);

      if (!user) {
        throw unauthorized("ユーザーが見つかりません");
      }

      c.set(AUTH.CONTEXT_KEYS.AUTH, { payload, user });
      c.set(AUTH.CONTEXT_KEYS.USER, user);

      await next();
    } catch (error) {
      if (isJoseError(error)) {
        throw handleJoseError(error);
      }
      throw error;
    }
  };
}

/**
 * 認証コンテキストを取得する
 * @param c - Honoコンテキスト
 * @returns 認証コンテキスト（ペイロードとユーザー情報）
 * @throws 認証されていない場合は401エラー
 */
export function getAuthContext(c: Context): AuthContext {
  const auth: unknown = c.get(AUTH.CONTEXT_KEYS.AUTH);
  if (!isAuthContext(auth)) {
    throw unauthorized("認証されていません");
  }
  return auth;
}

/**
 * 現在のユーザーを取得する
 * @param c - Honoコンテキスト
 * @returns ユーザー情報
 * @throws 認証されていない場合は401エラー
 */
export function getCurrentUser(c: Context): User {
  const user: unknown = c.get(AUTH.CONTEXT_KEYS.USER);
  if (!isUser(user)) {
    throw unauthorized("認証されていません");
  }
  return user;
}
