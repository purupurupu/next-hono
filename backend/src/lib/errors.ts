import { HTTPException } from "hono/http-exception";

/** APIエラーコードの型定義 */
export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "EDIT_TIME_EXPIRED"
  | "INTERNAL_ERROR";

/** APIエラーレスポンスの形式 */
export interface ApiErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, string[]>;
  };
}

/** APIで使用するHTTPステータスコードの型定義 */
export type ApiErrorStatusCode = 400 | 401 | 403 | 404 | 409 | 422 | 500;

/**
 * API エラークラス
 * HTTPExceptionを継承し、統一されたエラーレスポンス形式を提供する
 */
export class ApiError extends HTTPException {
  public readonly code: ErrorCode;
  public readonly details?: Record<string, string[]>;
  public readonly statusCode: ApiErrorStatusCode;

  /**
   * ApiErrorを作成する
   * @param status - HTTPステータスコード
   * @param code - エラーコード
   * @param message - エラーメッセージ
   * @param details - バリデーションエラーの詳細（オプション）
   */
  constructor(
    status: ApiErrorStatusCode,
    code: ErrorCode,
    message: string,
    details?: Record<string, string[]>,
  ) {
    super(status, { message });
    this.code = code;
    this.details = details;
    this.statusCode = status;
  }

  /**
   * エラーをJSON形式に変換する
   * @returns APIエラーレスポンス
   */
  toJSON(): ApiErrorResponse {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
      },
    };
  }
}

/**
 * バリデーションエラーを作成する（400）
 * @param message - エラーメッセージ
 * @param details - フィールドごとのエラー詳細
 * @returns ApiError
 */
export function validationError(message: string, details?: Record<string, string[]>): ApiError {
  return new ApiError(400, "VALIDATION_ERROR", message, details);
}

/**
 * 認証エラーを作成する（401）
 * @param message - エラーメッセージ（デフォルト: "認証が必要です"）
 * @returns ApiError
 */
export function unauthorized(message = "認証が必要です"): ApiError {
  return new ApiError(401, "UNAUTHORIZED", message);
}

/**
 * 権限エラーを作成する（403）
 * @param message - エラーメッセージ（デフォルト: "アクセス権限がありません"）
 * @returns ApiError
 */
export function forbidden(message = "アクセス権限がありません"): ApiError {
  return new ApiError(403, "FORBIDDEN", message);
}

/**
 * リソース未検出エラーを作成する（404）
 * @param resource - リソース名
 * @param id - リソースID（オプション）
 * @returns ApiError
 */
export function notFound(resource: string, id?: number | string): ApiError {
  const message = id ? `${resource}（ID: ${id}）が見つかりません` : `${resource}が見つかりません`;
  return new ApiError(404, "NOT_FOUND", message);
}

/**
 * 競合エラーを作成する（409）
 * @param message - エラーメッセージ
 * @returns ApiError
 */
export function conflict(message: string): ApiError {
  return new ApiError(409, "CONFLICT", message);
}

/**
 * 編集時間超過エラーを作成する（403）
 * @param message - エラーメッセージ（デフォルト: "編集可能時間を過ぎています"）
 * @returns ApiError
 */
export function editTimeExpired(message = "編集可能時間を過ぎています"): ApiError {
  return new ApiError(403, "EDIT_TIME_EXPIRED", message);
}

/**
 * 内部エラーを作成する（500）
 * @param message - エラーメッセージ（デフォルト: "内部エラーが発生しました"）
 * @returns ApiError
 */
export function internalError(message = "内部エラーが発生しました"): ApiError {
  return new ApiError(500, "INTERNAL_ERROR", message);
}
