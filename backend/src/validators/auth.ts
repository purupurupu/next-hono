import { z } from "zod";

export const signUpSchema = z
  .object({
    email: z
      .string({ error: "メールアドレスは必須です" })
      .email({ error: "有効なメールアドレスを入力してください" })
      .max(255, { error: "メールアドレスは255文字以内で入力してください" }),
    password: z
      .string({ error: "パスワードは必須です" })
      .min(8, { error: "パスワードは8文字以上で入力してください" })
      .max(72, { error: "パスワードは72文字以内で入力してください" }),
    password_confirmation: z.string({ error: "パスワード確認は必須です" }),
    name: z.string().max(255, { error: "名前は255文字以内で入力してください" }).optional(),
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
