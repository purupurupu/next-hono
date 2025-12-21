/**
 * Todo バリデーションスキーマ
 * @module features/todo/validators
 */

import { z } from "zod";
import { TODO } from "../../lib/constants";

/** 優先度スキーマ */
const prioritySchema = z.enum(["low", "medium", "high"], {
  message: "優先度は low, medium, high のいずれかを指定してください",
});

/** ステータススキーマ */
const statusSchema = z.enum(["pending", "in_progress", "completed"], {
  message: "ステータスは pending, in_progress, completed のいずれかを指定してください",
});

/** 日付文字列スキーマ（YYYY-MM-DD形式） */
const dueDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "日付はYYYY-MM-DD形式で入力してください",
  })
  .nullable()
  .optional();

/**
 * Todo作成スキーマ
 */
export const createTodoSchema = z.object({
  title: z
    .string({ message: "タイトルは必須です" })
    .min(1, { message: "タイトルは必須です" })
    .max(TODO.TITLE_MAX_LENGTH, {
      message: `タイトルは${TODO.TITLE_MAX_LENGTH}文字以内で入力してください`,
    }),
  description: z
    .string()
    .max(TODO.DESCRIPTION_MAX_LENGTH, {
      message: `説明は${TODO.DESCRIPTION_MAX_LENGTH}文字以内で入力してください`,
    })
    .nullable()
    .optional(),
  priority: prioritySchema.optional().default("medium"),
  status: statusSchema.optional().default("pending"),
  due_date: dueDateSchema,
  category_id: z.number().int().positive().nullable().optional(),
  tag_ids: z.array(z.number().int().positive()).optional().default([]),
});

/**
 * Todo更新スキーマ
 */
export const updateTodoSchema = z.object({
  title: z
    .string()
    .min(1, { message: "タイトルは空にできません" })
    .max(TODO.TITLE_MAX_LENGTH, {
      message: `タイトルは${TODO.TITLE_MAX_LENGTH}文字以内で入力してください`,
    })
    .optional(),
  description: z
    .string()
    .max(TODO.DESCRIPTION_MAX_LENGTH, {
      message: `説明は${TODO.DESCRIPTION_MAX_LENGTH}文字以内で入力してください`,
    })
    .nullable()
    .optional(),
  completed: z.boolean().optional(),
  priority: prioritySchema.optional(),
  status: statusSchema.optional(),
  due_date: dueDateSchema,
  category_id: z.number().int().positive().nullable().optional(),
  tag_ids: z.array(z.number().int().positive()).optional(),
});

/**
 * 順序更新スキーマ
 */
export const updateOrderSchema = z.object({
  todos: z
    .array(
      z.object({
        id: z.number().int().positive({ message: "IDは正の整数である必要があります" }),
        position: z.number().int().min(0, { message: "positionは0以上である必要があります" }),
      }),
    )
    .min(1, { message: "少なくとも1つのTodoを指定してください" }),
});

/**
 * IDパラメータスキーマ
 */
export const idParamSchema = z.object({
  id: z
    .string()
    .transform((val, ctx) => {
      const parsed = Number.parseInt(val, 10);
      if (Number.isNaN(parsed) || parsed <= 0 || !Number.isInteger(parsed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "IDは正の整数である必要があります",
        });
        return z.NEVER;
      }
      return parsed;
    }),
});

/** Todo作成入力型 */
export type CreateTodoInput = z.infer<typeof createTodoSchema>;

/** Todo更新入力型 */
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;

/** 順序更新入力型 */
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;

/** IDパラメータ型 */
export type IdParam = z.infer<typeof idParamSchema>;
