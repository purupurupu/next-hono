import { HTTPException } from "hono/http-exception";

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "EDIT_TIME_EXPIRED"
  | "INTERNAL_ERROR";

export interface ApiErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, string[]>;
  };
}

export class ApiError extends HTTPException {
  public readonly code: ErrorCode;
  public readonly details?: Record<string, string[]>;

  constructor(
    status: number,
    code: ErrorCode,
    message: string,
    details?: Record<string, string[]>
  ) {
    super(status, { message });
    this.code = code;
    this.details = details;
  }

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

export function validationError(
  message: string,
  details?: Record<string, string[]>
): ApiError {
  return new ApiError(400, "VALIDATION_ERROR", message, details);
}

export function unauthorized(message = "認証が必要です"): ApiError {
  return new ApiError(401, "UNAUTHORIZED", message);
}

export function forbidden(message = "アクセス権限がありません"): ApiError {
  return new ApiError(403, "FORBIDDEN", message);
}

export function notFound(resource: string, id?: number | string): ApiError {
  const message = id
    ? `${resource}（ID: ${id}）が見つかりません`
    : `${resource}が見つかりません`;
  return new ApiError(404, "NOT_FOUND", message);
}

export function conflict(message: string): ApiError {
  return new ApiError(409, "CONFLICT", message);
}

export function editTimeExpired(
  message = "編集可能時間を過ぎています"
): ApiError {
  return new ApiError(403, "EDIT_TIME_EXPIRED", message);
}

export function internalError(message = "内部エラーが発生しました"): ApiError {
  return new ApiError(500, "INTERNAL_ERROR", message);
}
