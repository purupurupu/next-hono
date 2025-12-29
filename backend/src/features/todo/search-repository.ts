/**
 * Todo検索リポジトリ
 * @module features/todo/search-repository
 */

import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNull,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { TODO } from "../../lib/constants";
import type { DatabaseOrTransaction } from "../../lib/db";
import {
  type Category,
  categories,
  type Tag,
  tags,
  todos,
  todoTags,
} from "../../models/schema";
import type { NormalizedSearchParams } from "./search-validators";
import type { TodoWithRelations } from "./types";

/**
 * 検索結果
 */
export interface SearchResult {
  /** Todoとリレーションの配列 */
  todos: TodoWithRelations[];
  /** トータル件数 */
  total: number;
}

/**
 * 検索リポジトリのインターフェース
 */
export interface TodoSearchRepositoryInterface {
  /**
   * Todoを検索する
   * @param userId - ユーザーID
   * @param params - 検索パラメータ
   * @returns 検索結果とトータル件数
   */
  search(userId: number, params: NormalizedSearchParams): Promise<SearchResult>;
}

/**
 * Todo検索リポジトリの実装
 */
export class TodoSearchRepository implements TodoSearchRepositoryInterface {
  /**
   * TodoSearchRepositoryを作成する
   * @param db - Drizzleデータベースまたはトランザクションインスタンス
   */
  constructor(private db: DatabaseOrTransaction) {}

  /**
   * Todoを検索する
   * @param userId - ユーザーID
   * @param params - 検索パラメータ
   * @returns 検索結果とトータル件数
   */
  async search(userId: number, params: NormalizedSearchParams): Promise<SearchResult> {
    // WHERE条件を構築
    const whereConditions = this.buildWhereConditions(userId, params);

    // タグフィルターがある場合、対象TodoのIDを先に取得
    let targetTodoIds: number[] | undefined;
    if (params.tagIds && params.tagIds.length > 0) {
      targetTodoIds = await this.getTodoIdsByTags(userId, params.tagIds, params.tagMode);

      // タグに一致するTodoがない場合は空結果を返す
      if (targetTodoIds.length === 0) {
        return { todos: [], total: 0 };
      }
    }

    // タグフィルター条件を追加
    const finalConditions = targetTodoIds
      ? and(whereConditions, inArray(todos.id, targetTodoIds))
      : whereConditions;

    // トータル件数を取得
    const totalResult = await this.db
      .select({ count: count() })
      .from(todos)
      .where(finalConditions);
    const total = totalResult[0]?.count ?? 0;

    if (total === 0) {
      return { todos: [], total: 0 };
    }

    // ソート条件を構築
    const orderByClause = this.buildOrderByClause(params);

    // ページネーション
    const offset = (params.page - 1) * params.perPage;

    // Todoを取得
    const todoList = await this.db
      .select()
      .from(todos)
      .where(finalConditions)
      .orderBy(...orderByClause)
      .limit(params.perPage)
      .offset(offset);

    if (todoList.length === 0) {
      return { todos: [], total };
    }

    // リレーションを取得して結合
    const todosWithRelations = await this.fetchRelations(todoList);

    return { todos: todosWithRelations, total };
  }

  /**
   * WHERE条件を構築する
   * @param userId - ユーザーID
   * @param params - 検索パラメータ
   * @returns SQL条件
   */
  private buildWhereConditions(userId: number, params: NormalizedSearchParams): SQL | undefined {
    const conditions: SQL[] = [eq(todos.userId, userId)];

    // テキスト検索（title, description のILIKE）
    if (params.q) {
      const searchPattern = `%${params.q}%`;
      const textCondition = or(
        ilike(todos.title, searchPattern),
        ilike(todos.description, searchPattern),
      );
      if (textCondition) {
        conditions.push(textCondition);
      }
    }

    // カテゴリフィルター
    if (params.categoryId !== undefined) {
      if (params.categoryId === -1) {
        // カテゴリなし
        conditions.push(isNull(todos.categoryId));
      } else {
        // 指定カテゴリ
        conditions.push(eq(todos.categoryId, params.categoryId));
      }
    }

    // ステータスフィルター
    if (params.status && params.status.length > 0) {
      const statusValues = params.status.map((s) => TODO.STATUS_MAP[s]);
      conditions.push(inArray(todos.status, statusValues));
    }

    // 優先度フィルター
    if (params.priority && params.priority.length > 0) {
      const priorityValues = params.priority.map((p) => TODO.PRIORITY_MAP[p]);
      conditions.push(inArray(todos.priority, priorityValues));
    }

    // 日付範囲フィルター
    if (params.dueDateFrom) {
      conditions.push(gte(todos.dueDate, params.dueDateFrom));
    }
    if (params.dueDateTo) {
      conditions.push(lte(todos.dueDate, params.dueDateTo));
    }

    return and(...conditions);
  }

  /**
   * タグフィルターに一致するTodoのIDを取得する
   * @param userId - ユーザーID
   * @param tagIds - タグIDの配列
   * @param tagMode - マッチモード（"any" または "all"）
   * @returns TodoのIDの配列
   */
  private async getTodoIdsByTags(
    userId: number,
    tagIds: number[],
    tagMode: "any" | "all",
  ): Promise<number[]> {
    if (tagMode === "any") {
      // いずれかのタグを持つTodo
      const result = await this.db
        .selectDistinct({ todoId: todoTags.todoId })
        .from(todoTags)
        .innerJoin(todos, eq(todoTags.todoId, todos.id))
        .where(and(eq(todos.userId, userId), inArray(todoTags.tagId, tagIds)));
      return result.map((r) => r.todoId);
    }

    // 全てのタグを持つTodo（ALL mode）
    const result = await this.db
      .select({ todoId: todoTags.todoId })
      .from(todoTags)
      .innerJoin(todos, eq(todoTags.todoId, todos.id))
      .where(and(eq(todos.userId, userId), inArray(todoTags.tagId, tagIds)))
      .groupBy(todoTags.todoId)
      .having(sql`count(distinct ${todoTags.tagId}) = ${tagIds.length}`);
    return result.map((r) => r.todoId);
  }

  /**
   * ソート条件を構築する
   * @param params - 検索パラメータ
   * @returns ソート条件の配列
   */
  private buildOrderByClause(params: NormalizedSearchParams): SQL[] {
    const direction = params.sortOrder === "desc" ? desc : asc;

    switch (params.sortBy) {
      case "due_date":
        // NULLを最後に配置
        return [sql`${todos.dueDate} IS NULL`, direction(todos.dueDate), asc(todos.position)];
      case "created_at":
        return [direction(todos.createdAt)];
      case "updated_at":
        return [direction(todos.updatedAt)];
      case "title":
        return [direction(todos.title)];
      case "priority":
        return [direction(todos.priority), asc(todos.position)];
      case "status":
        return [direction(todos.status), asc(todos.position)];
      case "position":
      default:
        return [direction(todos.position)];
    }
  }

  /**
   * Todoのリレーション（カテゴリ、タグ）を取得する
   * @param todoList - Todoの配列
   * @returns TodoWithRelationsの配列
   */
  private async fetchRelations(
    todoList: (typeof todos.$inferSelect)[],
  ): Promise<TodoWithRelations[]> {
    const todoIds = todoList.map((t) => t.id);

    // カテゴリを取得
    const categoryIds = [
      ...new Set(todoList.map((t) => t.categoryId).filter((id): id is number => id !== null)),
    ];

    const categoryMap = new Map<number, Category>();
    if (categoryIds.length > 0) {
      const categoryList = await this.db
        .select()
        .from(categories)
        .where(inArray(categories.id, categoryIds));
      for (const cat of categoryList) {
        categoryMap.set(cat.id, cat);
      }
    }

    // タグを取得
    const tagResults = await this.db
      .select({
        todoId: todoTags.todoId,
        tag: tags,
      })
      .from(todoTags)
      .innerJoin(tags, eq(todoTags.tagId, tags.id))
      .where(inArray(todoTags.todoId, todoIds));

    const tagsMap = new Map<number, Tag[]>();
    for (const row of tagResults) {
      const existing = tagsMap.get(row.todoId) ?? [];
      existing.push(row.tag);
      tagsMap.set(row.todoId, existing);
    }

    // 結果を組み立て
    return todoList.map((todo) => ({
      todo,
      category: todo.categoryId ? (categoryMap.get(todo.categoryId) ?? null) : null,
      tags: tagsMap.get(todo.id) ?? [],
    }));
  }
}
