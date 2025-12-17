import { z } from "zod";
import { VALIDATION } from "../../lib/constants";

export const signUpSchema = z
  .object({
    email: z
      .string({ error: "メールアドレスは必須です" })
      .email({ error: "有効なメールアドレスを入力してください" })
      .max(VALIDATION.EMAIL_MAX_LENGTH, {
        error: `メールアドレスは${VALIDATION.EMAIL_MAX_LENGTH}文字以内で入力してください`,
      }),
    password: z
      .string({ error: "パスワードは必須です" })
      .min(VALIDATION.PASSWORD_MIN_LENGTH, {
        error: `パスワードは${VALIDATION.PASSWORD_MIN_LENGTH}文字以上で入力してください`,
      })
      .max(VALIDATION.PASSWORD_MAX_LENGTH, {
        error: `パスワードは${VALIDATION.PASSWORD_MAX_LENGTH}文字以内で入力してください`,
      }),
    password_confirmation: z.string({ error: "パスワード確認は必須です" }),
    name: z
      .string()
      .max(VALIDATION.NAME_MAX_LENGTH, {
        error: `名前は${VALIDATION.NAME_MAX_LENGTH}文字以内で入力してください`,
      })
      .optional(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "パスワードが一致しません",
    path: ["password_confirmation"],
  });

export const signInSchema = z.object({
  email: z
    .string({ error: "メールアドレスは必須です" })
    .email({ error: "有効なメールアドレスを入力してください" }),
  password: z.string({ error: "パスワードは必須です" }),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
