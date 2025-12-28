/**
 * カテゴリサービス
 * @module features/category/service
 */

import { conflict, notFound, validationError } from "../../lib/errors";
import type { CategoryRepositoryInterface } from "./repository";
import { type CategoryResponse, formatCategoryResponse } from "./types";
import type { CreateCategoryInput, UpdateCategoryInput } from "./validators";

/**
 * カテゴリサービスクラス
 * カテゴリに関するビジネスロジックを提供する
 */
export class CategoryService {
  /**
   * CategoryServiceを作成する
   * @param categoryRepository - カテゴリリポジトリ
   */
  constructor(private categoryRepository: CategoryRepositoryInterface) {}

  /**
   * ユーザーのすべてのカテゴリを取得する
   * @param userId - ユーザーID
   * @returns カテゴリレスポンスの配列
   */
  async list(userId: number): Promise<CategoryResponse[]> {
    const categories = await this.categoryRepository.findAll(userId);
    return categories.map(formatCategoryResponse);
  }

  /**
   * カテゴリの詳細を取得する
   * @param id - カテゴリID
   * @param userId - ユーザーID
   * @returns カテゴリレスポンス
   * @throws カテゴリが見つからない場合は404エラー
   */
  async show(id: number, userId: number): Promise<CategoryResponse> {
    const category = await this.categoryRepository.findById(id, userId);
    if (!category) {
      throw notFound("カテゴリ", id);
    }
    return formatCategoryResponse(category);
  }

  /**
   * カテゴリを作成する
   * @param input - カテゴリ作成入力
   * @param userId - ユーザーID
   * @returns 作成されたカテゴリレスポンス
   * @throws 同じ名前のカテゴリが存在する場合は409エラー
   */
  async create(input: CreateCategoryInput, userId: number): Promise<CategoryResponse> {
    // ユニーク制約チェック
    const existing = await this.categoryRepository.findByName(input.name, userId);
    if (existing) {
      throw conflict("同じ名前のカテゴリが既に存在します");
    }

    const category = await this.categoryRepository.create({
      userId,
      name: input.name,
      color: input.color,
    });
    return formatCategoryResponse(category);
  }

  /**
   * カテゴリを更新する
   * @param id - カテゴリID
   * @param input - カテゴリ更新入力
   * @param userId - ユーザーID
   * @returns 更新されたカテゴリレスポンス
   * @throws カテゴリが見つからない場合は404エラー
   * @throws 同じ名前のカテゴリが存在する場合は409エラー
   */
  async update(id: number, input: UpdateCategoryInput, userId: number): Promise<CategoryResponse> {
    const existing = await this.categoryRepository.findById(id, userId);
    if (!existing) {
      throw notFound("カテゴリ", id);
    }

    // 名前変更時のユニーク制約チェック
    if (input.name && input.name !== existing.name) {
      const duplicate = await this.categoryRepository.findByName(input.name, userId);
      if (duplicate) {
        throw conflict("同じ名前のカテゴリが既に存在します");
      }
    }

    const updated = await this.categoryRepository.update(id, userId, {
      name: input.name,
      color: input.color,
    });
    if (!updated) {
      throw notFound("カテゴリ", id);
    }
    return formatCategoryResponse(updated);
  }

  /**
   * カテゴリを削除する
   * @param id - カテゴリID
   * @param userId - ユーザーID
   * @throws カテゴリが見つからない場合は404エラー
   * @throws カテゴリにTodoが紐づいている場合は400エラー
   */
  async destroy(id: number, userId: number): Promise<void> {
    const existing = await this.categoryRepository.findById(id, userId);
    if (!existing) {
      throw notFound("カテゴリ", id);
    }

    // Todo紐づきチェック
    if (existing.todosCount > 0) {
      throw validationError("このカテゴリにはTodoが紐づいているため削除できません");
    }

    await this.categoryRepository.delete(id, userId);
  }
}
