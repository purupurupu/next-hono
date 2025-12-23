/**
 * Todoリポジトリ
 * @module features/todo/todo-repository
 */

import { and, asc, eq, inArray, max } from "drizzle-orm";
import type { DatabaseOrTransaction } from "../../lib/db";
import {
  type Category,
  type NewTodo,
  type Tag,
  type Todo,
  categories,
  tags,
  todoTags,
  todos,
} from "../../models/schema";
import type { TodoWithRelations } from "./types";

/**
 * Todoリポジトリのインターフェース
 */
export interface TodoRepositoryInterface {
  /**
   * ユーザーのTodo一覧を取得する（position順）
   * @param userId - ユーザーID
   * @returns TodoWithRelationsの配列
   */
  findAll(userId: number): Promise<TodoWithRelations[]>;

  /**
   * IDとユーザーIDでTodoを取得する（リレーション含む）
   * @param id - TodoのID
   * @param userId - ユーザーID
   * @returns TodoWithRelations、または見つからない場合はundefined
   */
  findById(id: number, userId: number): Promise<TodoWithRelations | undefined>;

  /**
   * 複数のIDとユーザーIDでTodoを取得する
   * @param ids - TodoのIDの配列
   * @param userId - ユーザーID
   * @returns Todoの配列
   */
  findByIds(ids: number[], userId: number): Promise<Todo[]>;

  /**
   * Todoを作成する
   * @param data - 作成データ
   * @returns 作成されたTodo
   */
  create(data: NewTodo): Promise<Todo>;

  /**
   * Todoを更新する
   * @param id - TodoのID
   * @param userId - ユーザーID
   * @param data - 更新データ
   * @returns 更新されたTodo、または見つからない場合はundefined
   */
  update(
    id: number,
    userId: number,
    data: Partial<Omit<NewTodo, "userId">>,
  ): Promise<Todo | undefined>;

  /**
   * Todoを削除する
   * @param id - TodoのID
   * @param userId - ユーザーID
   * @returns 削除成功したらtrue
   */
  delete(id: number, userId: number): Promise<boolean>;

  /**
   * ユーザーの最大positionを取得する
   * @param userId - ユーザーID
   * @returns 最大position（Todoがない場合は-1）
   */
  getMaxPosition(userId: number): Promise<number>;

  /**
   * 複数のTodoのpositionを一括更新する
   * @param updates - 更新データの配列（idとposition）
   * @param userId - ユーザーID
   */
  updatePositions(
    updates: Array<{ id: number; position: number }>,
    userId: number,
  ): Promise<void>;
}

/**
 * Todoリポジトリの実装
 */
export class TodoRepository implements TodoRepositoryInterface {
  /**
   * TodoRepositoryを作成する
   * @param db - Drizzleデータベースまたはトランザクションインスタンス
   */
  constructor(private db: DatabaseOrTransaction) {}

  /**
   * ユーザーのTodo一覧を取得する（position順）
   * @param userId - ユーザーID
   * @returns TodoWithRelationsの配列
   */
  async findAll(userId: number): Promise<TodoWithRelations[]> {
    // Todoを取得
    const todoList = await this.db
      .select()
      .from(todos)
      .where(eq(todos.userId, userId))
      .orderBy(asc(todos.position));

    if (todoList.length === 0) {
      return [];
    }

    // カテゴリIDを収集
    const categoryIds = [
      ...new Set(
        todoList
          .map((t) => t.categoryId)
          .filter((id): id is number => id !== null),
      ),
    ];

    // カテゴリを取得
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

    // TodoTagとTagを結合して取得
    const todoIds = todoList.map((t) => t.id);
    const tagResults = await this.db
      .select({
        todoId: todoTags.todoId,
        tag: tags,
      })
      .from(todoTags)
      .innerJoin(tags, eq(todoTags.tagId, tags.id))
      .where(inArray(todoTags.todoId, todoIds));

    // Todoごとのタグをマップに整理
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

  /**
   * IDとユーザーIDでTodoを取得する（リレーション含む）
   * @param id - TodoのID
   * @param userId - ユーザーID
   * @returns TodoWithRelations、または見つからない場合はundefined
   */
  async findById(id: number, userId: number): Promise<TodoWithRelations | undefined> {
    // TodoとカテゴリをLEFT JOINで同時取得（1クエリ）
    const result = await this.db
      .select({
        todo: todos,
        category: categories,
      })
      .from(todos)
      .leftJoin(categories, eq(todos.categoryId, categories.id))
      .where(and(eq(todos.id, id), eq(todos.userId, userId)))
      .limit(1);

    const row = result[0];
    if (!row) {
      return undefined;
    }

    // タグを取得（1クエリ）
    const tagResults = await this.db
      .select({
        tag: tags,
      })
      .from(todoTags)
      .innerJoin(tags, eq(todoTags.tagId, tags.id))
      .where(eq(todoTags.todoId, id));

    return {
      todo: row.todo,
      category: row.category,
      tags: tagResults.map((r) => r.tag),
    };
  }

  /**
   * 複数のIDとユーザーIDでTodoを取得する
   * @param ids - TodoのIDの配列
   * @param userId - ユーザーID
   * @returns Todoの配列
   */
  async findByIds(ids: number[], userId: number): Promise<Todo[]> {
    if (ids.length === 0) {
      return [];
    }
    return await this.db
      .select()
      .from(todos)
      .where(and(inArray(todos.id, ids), eq(todos.userId, userId)));
  }

  /**
   * Todoを作成する
   * @param data - 作成データ
   * @returns 作成されたTodo
   */
  async create(data: NewTodo): Promise<Todo> {
    const result = await this.db.insert(todos).values(data).returning();
    return result[0];
  }

  /**
   * Todoを更新する
   * @param id - TodoのID
   * @param userId - ユーザーID
   * @param data - 更新データ
   * @returns 更新されたTodo、または見つからない場合はundefined
   */
  async update(
    id: number,
    userId: number,
    data: Partial<Omit<NewTodo, "userId">>,
  ): Promise<Todo | undefined> {
    const result = await this.db
      .update(todos)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(todos.id, id), eq(todos.userId, userId)))
      .returning();
    return result[0];
  }

  /**
   * Todoを削除する
   * @param id - TodoのID
   * @param userId - ユーザーID
   * @returns 削除成功したらtrue
   */
  async delete(id: number, userId: number): Promise<boolean> {
    const result = await this.db
      .delete(todos)
      .where(and(eq(todos.id, id), eq(todos.userId, userId)))
      .returning({ id: todos.id });
    return result.length > 0;
  }

  /**
   * ユーザーの最大positionを取得する
   * @param userId - ユーザーID
   * @returns 最大position（Todoがない場合は-1）
   */
  async getMaxPosition(userId: number): Promise<number> {
    const result = await this.db
      .select({ maxPos: max(todos.position) })
      .from(todos)
      .where(eq(todos.userId, userId));
    return result[0]?.maxPos ?? -1;
  }

  /**
   * 複数のTodoのpositionを一括更新する
   * @param updates - 更新データの配列（idとposition）
   * @param userId - ユーザーID
   */
  async updatePositions(
    updates: Array<{ id: number; position: number }>,
    userId: number,
  ): Promise<void> {
    // バッチ更新をトランザクションで実行
    await this.db.transaction(async (tx) => {
      for (const update of updates) {
        await tx
          .update(todos)
          .set({
            position: update.position,
            updatedAt: new Date(),
          })
          .where(and(eq(todos.id, update.id), eq(todos.userId, userId)));
      }
    });
  }
}
