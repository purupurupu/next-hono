/**
 * Todo検索バリデーションスキーマ
 * @module features/todo/search-validators
 */

import { z } from "zod";

/** 優先度スキーマ */
const prioritySchema = z.enum(["low", "medium", "high"]);

/** ステータススキーマ */
const statusSchema = z.enum(["pending", "in_progress", "completed"]);

/** 日付文字列スキーマ（YYYY-MM-DD形式） */
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: "日付はYYYY-MM-DD形式で入力してください",
});

/** ソートフィールドスキーマ */
const sortBySchema = z.enum([
  "position",
  "created_at",
  "updated_at",
  "due_date",
  "title",
  "priority",
  "status",
]);

/** ソート順スキーマ */
const sortOrderSchema = z.enum(["asc", "desc"]);

/** タグモードスキーマ */
const tagModeSchema = z.enum(["any", "all"]);

/**
 * 検索クエリスキーマ
 * クエリパラメータは文字列として受け取り、適切に変換する
 */
export const searchTodoSchema = z.object({
  // テキスト検索
  q: z.string().optional(),

  // カテゴリフィルター（-1でカテゴリなし）
  category_id: z.coerce.number().int().optional(),

  // ステータスフィルター（単一）
  status: statusSchema.optional(),
  // ステータスフィルター（配列形式）
  "status[]": z.union([statusSchema, z.array(statusSchema)]).optional(),

  // 優先度フィルター（単一）
  priority: prioritySchema.optional(),
  // 優先度フィルター（配列形式）
  "priority[]": z.union([prioritySchema, z.array(prioritySchema)]).optional(),

  // タグフィルター
  tag_ids: z
    .preprocess((val) => {
      if (val === undefined || val === null || val === "") return undefined;
      if (Array.isArray(val)) return val.map(Number);
      if (typeof val === "string") return val.split(",").map(Number);
      return [Number(val)];
    }, z.array(z.number().int().positive()).optional())
    .optional(),
  "tag_ids[]": z
    .union([z.coerce.number().int().positive(), z.array(z.coerce.number().int().positive())])
    .optional(),
  tag_mode: tagModeSchema.optional(),

  // 日付範囲フィルター
  due_date_from: dateSchema.optional(),
  due_date_to: dateSchema.optional(),

  // ソート
  sort_by: sortBySchema.optional(),
  sort_order: sortOrderSchema.optional(),

  // ページネーション
  page: z.coerce.number().int().positive().optional(),
  per_page: z.coerce.number().int().positive().max(100).optional(),
});

/** 検索入力の生の型 */
export type SearchTodoInput = z.infer<typeof searchTodoSchema>;

/**
 * 正規化された検索パラメータ
 */
export interface NormalizedSearchParams {
  /** 検索クエリ */
  q?: string;
  /** カテゴリID（-1でカテゴリなし） */
  categoryId?: number;
  /** ステータスフィルター */
  status?: Array<"pending" | "in_progress" | "completed">;
  /** 優先度フィルター */
  priority?: Array<"low" | "medium" | "high">;
  /** タグIDフィルター */
  tagIds?: number[];
  /** タグマッチモード */
  tagMode: "any" | "all";
  /** 期限開始日 */
  dueDateFrom?: string;
  /** 期限終了日 */
  dueDateTo?: string;
  /** ソートフィールド */
  sortBy: "position" | "created_at" | "updated_at" | "due_date" | "title" | "priority" | "status";
  /** ソート順 */
  sortOrder: "asc" | "desc";
  /** ページ番号 */
  page: number;
  /** ページサイズ */
  perPage: number;
}

/**
 * 配列パラメータを正規化する
 * @param val1 - 単一値または配列
 * @param val2 - 配列形式のパラメータ
 * @returns 正規化された配列
 */
function normalizeArrayParam<T>(val1: T | T[] | undefined, val2: T | T[] | undefined): T[] | undefined {
  // 配列形式（status[]）を優先
  if (val2 !== undefined) {
    return Array.isArray(val2) ? val2 : [val2];
  }
  // 単一形式（status）
  if (val1 !== undefined) {
    return Array.isArray(val1) ? val1 : [val1];
  }
  return undefined;
}

/**
 * 検索パラメータを正規化する
 * 配列形式とカンマ区切り形式を統一
 * @param input - 生の検索入力
 * @returns 正規化された検索パラメータ
 */
export function normalizeSearchParams(input: SearchTodoInput): NormalizedSearchParams {
  // タグIDの正規化
  let tagIds: number[] | undefined;
  if (input["tag_ids[]"] !== undefined) {
    tagIds = Array.isArray(input["tag_ids[]"]) ? input["tag_ids[]"] : [input["tag_ids[]"]];
  } else if (input.tag_ids !== undefined) {
    tagIds = input.tag_ids;
  }

  return {
    q: input.q?.trim() || undefined,
    categoryId: input.category_id,
    status: normalizeArrayParam(input.status, input["status[]"]),
    priority: normalizeArrayParam(input.priority, input["priority[]"]),
    tagIds: tagIds && tagIds.length > 0 ? tagIds : undefined,
    tagMode: input.tag_mode ?? "any",
    dueDateFrom: input.due_date_from,
    dueDateTo: input.due_date_to,
    sortBy: input.sort_by ?? "position",
    sortOrder: input.sort_order ?? "asc",
    page: input.page ?? 1,
    perPage: input.per_page ?? 20,
  };
}
