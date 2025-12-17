import { validationError } from "./errors";

/**
 * Zodバリデーションエラーのissue型
 */
interface ZodIssue {
  path: PropertyKey[];
  message: string;
}

/**
 * Zodバリデーション結果の型
 */
interface ValidationResult {
  success: boolean;
  error?: {
    issues: ZodIssue[];
  };
}

/**
 * zValidatorのバリデーションエラーハンドラを生成する
 * @param message - エラー時のメッセージ（デフォルト: "入力内容に誤りがあります"）
 * @returns zValidator用のエラーハンドラ関数
 * @example
 * ```typescript
 * app.post(
 *   "/users",
 *   zValidator("json", userSchema, handleValidationError()),
 *   async (c) => { ... }
 * );
 * ```
 */
export function handleValidationError(
  message = "入力内容に誤りがあります",
): (result: ValidationResult) => void {
  return (result) => {
    if (!result.success && result.error) {
      const details: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.map(String).join(".");
        if (!details[path]) {
          details[path] = [];
        }
        details[path].push(issue.message);
      }
      throw validationError(message, details);
    }
  };
}
