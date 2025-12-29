/**
 * Todoサービス
 * @module features/todo/service
 */

import { RESOURCE_NAMES, TODO } from "../../lib/constants";
import type { RepositoryFactories } from "../../lib/container";
import type { Database } from "../../lib/db";
import { notFound } from "../../lib/errors";
import { TODO_ERROR_MESSAGES } from "../../shared/errors/messages";
import {
  validateMultipleOwnership,
  validateSingleOwnership,
} from "../../shared/validators/ownership";
import type { TodoCategoryRepositoryInterface } from "./todo-category-repository";
import type { TodoRepositoryInterface } from "./todo-repository";
import type { TodoTagValidatorRepositoryInterface } from "./todo-tag-validator-repository";
import { formatTodoResponse, type TodoResponse, type TodoUpdateData } from "./types";
import type { CreateTodoInput, UpdateOrderInput, UpdateTodoInput } from "./validators";

/**
 * API入力をDB形式に変換するヘルパー（作成用）
 *
 * completed は status から導出される:
 * - status: "completed" → completed: true
 * - status: "pending" | "in_progress" → completed: false
 *
 * @param input - API入力データ
 * @param userId - ユーザーID
 * @param position - 新しいposition値
 * @returns DB保存形式のデータ
 */
function convertCreateInputToDbFormat(
  input: CreateTodoInput,
  userId: number,
  position: number,
): {
  userId: number;
  title: string;
  description: string | null;
  priority: number;
  status: number;
  dueDate: string | null;
  categoryId: number | null;
  position: number;
  completed: boolean;
} {
  return {
    userId,
    title: input.title,
    description: input.description ?? null,
    priority: TODO.PRIORITY_MAP[input.priority],
    status: TODO.STATUS_MAP[input.status],
    dueDate: input.due_date ?? null,
    categoryId: input.category_id ?? null,
    position,
    completed: input.status === "completed",
  };
}

/**
 * API入力をDB形式に変換するヘルパー（更新用）
 *
 * completed と status は双方向同期される:
 * - completed が指定された場合: status も同期（true→completed, false→pending）
 * - status が指定された場合: completed も同期（completed→true, それ以外→false）
 * - 両方指定された場合: completed を優先
 *
 * @param input - 更新入力データ
 * @returns 更新用データ（undefinedのフィールドは除外）
 */
function convertUpdateInputToDbFormat(input: UpdateTodoInput): TodoUpdateData {
  const updateData: TodoUpdateData = {};

  if (input.title !== undefined) {
    updateData.title = input.title;
  }
  if (input.description !== undefined) {
    updateData.description = input.description;
  }

  // completed と status の双方向同期
  if (input.completed !== undefined) {
    // completed が指定された場合は completed を優先
    updateData.completed = input.completed;
    // status も同期（completed: true → status: completed, false → status: pending）
    updateData.status = input.completed ? TODO.STATUS_MAP.completed : TODO.STATUS_MAP.pending;
  } else if (input.status !== undefined) {
    // status のみ指定された場合
    updateData.status = TODO.STATUS_MAP[input.status];
    // completed も同期（status: completed → true, それ以外 → false）
    updateData.completed = input.status === "completed";
  }

  if (input.priority !== undefined) {
    updateData.priority = TODO.PRIORITY_MAP[input.priority];
  }
  if (input.due_date !== undefined) {
    updateData.dueDate = input.due_date;
  }
  if (input.category_id !== undefined) {
    updateData.categoryId = input.category_id;
  }

  return updateData;
}

/**
 * Todoサービスクラス
 * Todo関連のビジネスロジックを提供する
 */
export class TodoService {
  /**
   * TodoServiceを作成する
   * @param db - データベースインスタンス
   * @param todoRepository - Todoリポジトリ
   * @param todoCategoryRepository - カテゴリリポジトリ（所有者検証・カウント更新用）
   * @param todoTagValidatorRepository - タグ検証リポジトリ（所有者検証用）
   * @param factories - トランザクション用リポジトリファクトリ
   */
  constructor(
    private db: Database,
    private todoRepository: TodoRepositoryInterface,
    private todoCategoryRepository: TodoCategoryRepositoryInterface,
    private todoTagValidatorRepository: TodoTagValidatorRepositoryInterface,
    private factories: RepositoryFactories,
  ) {}

  /**
   * ユーザーのTodo一覧を取得する
   * @param userId - ユーザーID
   * @returns Todoレスポンスの配列
   */
  async list(userId: number): Promise<TodoResponse[]> {
    const todos = await this.todoRepository.findAll(userId);
    return todos.map(formatTodoResponse);
  }

  /**
   * Todoの詳細を取得する
   * @param id - TodoのID
   * @param userId - ユーザーID
   * @returns Todoレスポンス
   * @throws NotFoundError - Todoが見つからない場合
   */
  async show(id: number, userId: number): Promise<TodoResponse> {
    const todo = await this.todoRepository.findById(id, userId);
    if (!todo) {
      throw notFound(RESOURCE_NAMES.TODO, id);
    }
    return formatTodoResponse(todo);
  }

  /**
   * Todoを作成する
   * @param input - 作成データ
   * @param userId - ユーザーID
   * @returns 作成されたTodoレスポンス
   * @throws ForbiddenError - 他ユーザーのCategory/Tagを使用した場合
   */
  async create(input: CreateTodoInput, userId: number): Promise<TodoResponse> {
    // カテゴリの所有者検証（トランザクション外で事前検証）
    if (input.category_id) {
      await this.validateCategoryOwnership(input.category_id, userId);
    }

    // タグの所有者検証（トランザクション外で事前検証）
    if (input.tag_ids && input.tag_ids.length > 0) {
      await this.validateTagsOwnership(input.tag_ids, userId);
    }

    // トランザクション内で作成処理を実行
    return await this.db.transaction(async (tx) => {
      const txTodoRepo = this.factories.createTodoRepository(tx);
      const txTodoTagRepo = this.factories.createTodoTagRepository(tx);
      const txCategoryRepo = this.factories.createCategoryRepository(tx);

      // 最大positionを取得
      const maxPosition = await txTodoRepo.getMaxPosition(userId);
      const newPosition = maxPosition + 1;

      // 入力をDB形式に変換してTodoを作成
      const todoData = convertCreateInputToDbFormat(input, userId, newPosition);
      const todo = await txTodoRepo.create(todoData);

      // タグを関連付け
      if (input.tag_ids && input.tag_ids.length > 0) {
        await txTodoTagRepo.syncTags(todo.id, input.tag_ids);
      }

      // カテゴリのカウントを増加
      if (input.category_id) {
        await txCategoryRepo.incrementTodosCount(input.category_id);
      }

      // リレーション付きで再取得
      const created = await txTodoRepo.findById(todo.id, userId);
      if (!created) {
        throw notFound(RESOURCE_NAMES.TODO, todo.id);
      }

      return formatTodoResponse(created);
    });
  }

  /**
   * Todoを更新する
   * @param id - TodoのID
   * @param input - 更新データ
   * @param userId - ユーザーID
   * @returns 更新されたTodoレスポンス
   * @throws NotFoundError - Todoが見つからない場合
   * @throws ForbiddenError - 他ユーザーのCategory/Tagを使用した場合
   */
  async update(id: number, input: UpdateTodoInput, userId: number): Promise<TodoResponse> {
    // 既存のTodoを取得（トランザクション外で事前検証）
    const existing = await this.todoRepository.findById(id, userId);
    if (!existing) {
      throw notFound(RESOURCE_NAMES.TODO, id);
    }

    const oldCategoryId = existing.todo.categoryId;

    // 新しいカテゴリの所有者検証（トランザクション外で事前検証）
    if (input.category_id !== undefined && input.category_id !== null) {
      await this.validateCategoryOwnership(input.category_id, userId);
    }

    // タグの所有者検証（トランザクション外で事前検証）
    if (input.tag_ids !== undefined && input.tag_ids.length > 0) {
      await this.validateTagsOwnership(input.tag_ids, userId);
    }

    // トランザクション内で更新処理を実行
    return await this.db.transaction(async (tx) => {
      const txTodoRepo = this.factories.createTodoRepository(tx);
      const txTodoTagRepo = this.factories.createTodoTagRepository(tx);
      const txCategoryRepo = this.factories.createCategoryRepository(tx);

      // 入力をDB形式に変換
      const updateData = convertUpdateInputToDbFormat(input);

      // Todoを更新
      if (Object.keys(updateData).length > 0) {
        await txTodoRepo.update(id, userId, updateData);
      }

      // タグを同期
      if (input.tag_ids !== undefined) {
        await txTodoTagRepo.syncTags(id, input.tag_ids);
      }

      // カテゴリのカウントを更新
      const newCategoryId = input.category_id !== undefined ? input.category_id : oldCategoryId;
      if (oldCategoryId !== newCategoryId) {
        if (oldCategoryId) {
          await txCategoryRepo.decrementTodosCount(oldCategoryId);
        }
        if (newCategoryId) {
          await txCategoryRepo.incrementTodosCount(newCategoryId);
        }
      }

      // リレーション付きで再取得
      const updated = await txTodoRepo.findById(id, userId);
      if (!updated) {
        throw notFound(RESOURCE_NAMES.TODO, id);
      }

      return formatTodoResponse(updated);
    });
  }

  /**
   * Todoを削除する
   * @param id - TodoのID
   * @param userId - ユーザーID
   * @throws NotFoundError - Todoが見つからない場合
   */
  async destroy(id: number, userId: number): Promise<void> {
    // 既存のTodoを取得（トランザクション外で事前検証）
    const existing = await this.todoRepository.findById(id, userId);
    if (!existing) {
      throw notFound(RESOURCE_NAMES.TODO, id);
    }

    const categoryId = existing.todo.categoryId;

    // トランザクション内で削除処理を実行
    await this.db.transaction(async (tx) => {
      const txTodoRepo = this.factories.createTodoRepository(tx);
      const txCategoryRepo = this.factories.createCategoryRepository(tx);

      // Todoを削除（todo_tagsはカスケード削除される）
      await txTodoRepo.delete(id, userId);

      // カテゴリのカウントを減少
      if (categoryId) {
        await txCategoryRepo.decrementTodosCount(categoryId);
      }
    });
  }

  /**
   * Todoの順序を一括更新する
   * @param input - 順序更新データ
   * @param userId - ユーザーID
   * @throws ForbiddenError - 他ユーザーのTodoが含まれている場合
   */
  async updateOrder(input: UpdateOrderInput, userId: number): Promise<void> {
    const todoIds = input.todos.map((t) => t.id);

    // 全てのTodoがこのユーザーのものか検証
    await validateMultipleOwnership(
      todoIds,
      userId,
      this.todoRepository,
      TODO_ERROR_MESSAGES.ORDER_FORBIDDEN,
    );

    // positionを一括更新
    await this.todoRepository.updatePositions(input.todos, userId);
  }

  /**
   * カテゴリの所有者を検証する
   * @param categoryId - カテゴリID
   * @param userId - ユーザーID
   * @throws ForbiddenError - 他ユーザーのカテゴリの場合
   */
  private async validateCategoryOwnership(categoryId: number, userId: number): Promise<void> {
    await validateSingleOwnership(
      categoryId,
      userId,
      this.todoCategoryRepository,
      TODO_ERROR_MESSAGES.CATEGORY_FORBIDDEN,
    );
  }

  /**
   * タグの所有者を検証する
   * @param tagIds - タグIDの配列
   * @param userId - ユーザーID
   * @throws ForbiddenError - 他ユーザーのタグが含まれている場合
   */
  private async validateTagsOwnership(tagIds: number[], userId: number): Promise<void> {
    await validateMultipleOwnership(
      tagIds,
      userId,
      this.todoTagValidatorRepository,
      TODO_ERROR_MESSAGES.TAGS_FORBIDDEN,
    );
  }
}
