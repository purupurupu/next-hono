/**
 * Todoサービス
 * @module features/todo/service
 */

import { TODO } from "../../lib/constants";
import type { Database } from "../../lib/db";
import { notFound } from "../../lib/errors";
import { TODO_ERROR_MESSAGES } from "../../shared/errors/messages";
import {
  validateMultipleOwnership,
  validateSingleOwnership,
} from "../../shared/validators/ownership";
import {
  CategoryRepository,
  type CategoryRepositoryInterface,
} from "./category-repository";
import type { TagRepositoryInterface } from "./tag-repository";
import {
  TodoRepository,
  type TodoRepositoryInterface,
} from "./todo-repository";
import { TodoTagRepository } from "./todo-tag-repository";
import {
  type TodoResponse,
  type TodoUpdateData,
  formatTodoResponse,
} from "./types";
import type {
  CreateTodoInput,
  UpdateOrderInput,
  UpdateTodoInput,
} from "./validators";

/**
 * Todoサービスクラス
 * Todo関連のビジネスロジックを提供する
 */
export class TodoService {
  /**
   * TodoServiceを作成する
   * @param db - データベースインスタンス
   * @param todoRepository - Todoリポジトリ
   * @param categoryRepository - カテゴリリポジトリ
   * @param tagRepository - タグリポジトリ
   */
  constructor(
    private db: Database,
    private todoRepository: TodoRepositoryInterface,
    private categoryRepository: CategoryRepositoryInterface,
    private tagRepository: TagRepositoryInterface,
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
      throw notFound("Todo", id);
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
      const txTodoRepo = new TodoRepository(tx);
      const txTodoTagRepo = new TodoTagRepository(tx);
      const txCategoryRepo = new CategoryRepository(tx);

      // 最大positionを取得
      const maxPosition = await txTodoRepo.getMaxPosition(userId);
      const newPosition = maxPosition + 1;

      // Todoを作成
      const todo = await txTodoRepo.create({
        userId,
        title: input.title,
        description: input.description ?? null,
        priority: TODO.PRIORITY_MAP[input.priority],
        status: TODO.STATUS_MAP[input.status],
        dueDate: input.due_date ?? null,
        categoryId: input.category_id ?? null,
        position: newPosition,
        completed: false,
      });

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
        throw notFound("Todo", todo.id);
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
  async update(
    id: number,
    input: UpdateTodoInput,
    userId: number,
  ): Promise<TodoResponse> {
    // 既存のTodoを取得（トランザクション外で事前検証）
    const existing = await this.todoRepository.findById(id, userId);
    if (!existing) {
      throw notFound("Todo", id);
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
      const txTodoRepo = new TodoRepository(tx);
      const txTodoTagRepo = new TodoTagRepository(tx);
      const txCategoryRepo = new CategoryRepository(tx);

      // 更新データを構築
      const updateData: TodoUpdateData = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined)
        updateData.description = input.description;
      if (input.completed !== undefined) updateData.completed = input.completed;
      if (input.priority !== undefined)
        updateData.priority = TODO.PRIORITY_MAP[input.priority];
      if (input.status !== undefined)
        updateData.status = TODO.STATUS_MAP[input.status];
      if (input.due_date !== undefined) updateData.dueDate = input.due_date;
      if (input.category_id !== undefined)
        updateData.categoryId = input.category_id;

      // Todoを更新
      if (Object.keys(updateData).length > 0) {
        await txTodoRepo.update(id, userId, updateData);
      }

      // タグを同期
      if (input.tag_ids !== undefined) {
        await txTodoTagRepo.syncTags(id, input.tag_ids);
      }

      // カテゴリのカウントを更新
      const newCategoryId =
        input.category_id !== undefined ? input.category_id : oldCategoryId;
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
        throw notFound("Todo", id);
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
      throw notFound("Todo", id);
    }

    const categoryId = existing.todo.categoryId;

    // トランザクション内で削除処理を実行
    await this.db.transaction(async (tx) => {
      const txTodoRepo = new TodoRepository(tx);
      const txCategoryRepo = new CategoryRepository(tx);

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
  private async validateCategoryOwnership(
    categoryId: number,
    userId: number,
  ): Promise<void> {
    await validateSingleOwnership(
      categoryId,
      userId,
      this.categoryRepository,
      TODO_ERROR_MESSAGES.CATEGORY_FORBIDDEN,
    );
  }

  /**
   * タグの所有者を検証する
   * @param tagIds - タグIDの配列
   * @param userId - ユーザーID
   * @throws ForbiddenError - 他ユーザーのタグが含まれている場合
   */
  private async validateTagsOwnership(
    tagIds: number[],
    userId: number,
  ): Promise<void> {
    await validateMultipleOwnership(
      tagIds,
      userId,
      this.tagRepository,
      TODO_ERROR_MESSAGES.TAGS_FORBIDDEN,
    );
  }
}
