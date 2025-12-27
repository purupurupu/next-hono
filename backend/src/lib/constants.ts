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

/** Todo関連の定数 */
export const TODO = {
  /** タイトルの最大文字数 */
  TITLE_MAX_LENGTH: 255,
  /** 説明の最大文字数 */
  DESCRIPTION_MAX_LENGTH: 10000,

  /** 優先度: 文字列 -> 整数 */
  PRIORITY_MAP: {
    low: 0,
    medium: 1,
    high: 2,
  } as const,
  /** 優先度: 整数 -> 文字列 */
  PRIORITY_REVERSE: ["low", "medium", "high"] as const,

  /** ステータス: 文字列 -> 整数 */
  STATUS_MAP: {
    pending: 0,
    in_progress: 1,
    completed: 2,
  } as const,
  /** ステータス: 整数 -> 文字列 */
  STATUS_REVERSE: ["pending", "in_progress", "completed"] as const,
} as const;

/** 優先度の文字列型 */
export type TodoPriority = keyof typeof TODO.PRIORITY_MAP;

/** ステータスの文字列型 */
export type TodoStatus = keyof typeof TODO.STATUS_MAP;

/** カテゴリ関連の定数 */
export const CATEGORY = {
  /** 名前の最大文字数 */
  NAME_MAX_LENGTH: 50,
} as const;

/** タグ関連の定数 */
export const TAG = {
  /** 名前の最大文字数 */
  NAME_MAX_LENGTH: 30,
} as const;
