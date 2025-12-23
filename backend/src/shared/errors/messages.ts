/**
 * 共通エラーメッセージ定数
 * @module shared/errors/messages
 */

/** Todo機能のエラーメッセージ */
export const TODO_ERROR_MESSAGES = {
  /** カテゴリ使用不可 */
  CATEGORY_FORBIDDEN: "指定されたカテゴリは使用できません",
  /** タグ使用不可 */
  TAGS_FORBIDDEN: "指定されたタグの一部が使用できません",
  /** 順序更新不可 */
  ORDER_FORBIDDEN: "更新できないTodoが含まれています",
} as const;

/** 認証機能のエラーメッセージ */
export const AUTH_ERROR_MESSAGES = {
  /** パスワード不一致 */
  PASSWORD_MISMATCH: "パスワードが一致しません",
  /** メールアドレス重複 */
  EMAIL_CONFLICT: "このメールアドレスは既に登録されています",
  /** 認証失敗 */
  INVALID_CREDENTIALS: "メールアドレスまたはパスワードが正しくありません",
  /** 無効なトークン */
  INVALID_TOKEN: "無効なトークンです",
  /** トークン無効化済み */
  TOKEN_REVOKED: "トークンは無効化されています",
} as const;
