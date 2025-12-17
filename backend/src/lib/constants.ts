/**
 * アプリケーション定数
 * @module lib/constants
 */

/** 認証関連の定数 */
export const AUTH = {
  /** bcryptのコスト係数 */
  BCRYPT_COST: 12,
  /** JWTの有効期限 */
  JWT_EXPIRES_IN: "24h",
  /** JWTアルゴリズム */
  JWT_ALGORITHM: "HS256",
} as const;

/** バリデーション関連の定数 */
export const VALIDATION = {
  /** パスワードの最小文字数 */
  PASSWORD_MIN_LENGTH: 8,
  /** パスワードの最大文字数（bcryptの制限） */
  PASSWORD_MAX_LENGTH: 72,
  /** メールアドレスの最大文字数 */
  EMAIL_MAX_LENGTH: 255,
  /** 名前の最大文字数 */
  NAME_MAX_LENGTH: 255,
} as const;
