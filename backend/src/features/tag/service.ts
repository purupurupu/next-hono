/**
 * タグサービス
 * @module features/tag/service
 */

import { conflict, notFound } from "../../lib/errors";
import type { TagRepositoryInterface } from "./repository";
import { type TagResponse, formatTagResponse } from "./types";
import type { CreateTagInput, UpdateTagInput } from "./validators";

/**
 * タグサービスクラス
 * タグに関するビジネスロジックを提供する
 */
export class TagService {
  /**
   * TagServiceを作成する
   * @param tagRepository - タグリポジトリ
   */
  constructor(private tagRepository: TagRepositoryInterface) {}

  /**
   * ユーザーのすべてのタグを取得する
   * @param userId - ユーザーID
   * @returns タグレスポンスの配列
   */
  async list(userId: number): Promise<TagResponse[]> {
    const tags = await this.tagRepository.findAll(userId);
    return tags.map(formatTagResponse);
  }

  /**
   * タグの詳細を取得する
   * @param id - タグID
   * @param userId - ユーザーID
   * @returns タグレスポンス
   * @throws タグが見つからない場合は404エラー
   */
  async show(id: number, userId: number): Promise<TagResponse> {
    const tag = await this.tagRepository.findById(id, userId);
    if (!tag) {
      throw notFound("タグ", id);
    }
    return formatTagResponse(tag);
  }

  /**
   * タグを作成する
   * @param input - タグ作成入力（名前は正規化済み）
   * @param userId - ユーザーID
   * @returns 作成されたタグレスポンス
   * @throws 同じ名前のタグが存在する場合は409エラー
   */
  async create(input: CreateTagInput, userId: number): Promise<TagResponse> {
    // ユニーク制約チェック（正規化後の名前で）
    const existing = await this.tagRepository.findByName(input.name, userId);
    if (existing) {
      throw conflict("同じ名前のタグが既に存在します");
    }

    const tag = await this.tagRepository.create({
      userId,
      name: input.name,
      color: input.color ?? null,
    });
    return formatTagResponse(tag);
  }

  /**
   * タグを更新する
   * @param id - タグID
   * @param input - タグ更新入力（名前は正規化済み）
   * @param userId - ユーザーID
   * @returns 更新されたタグレスポンス
   * @throws タグが見つからない場合は404エラー
   * @throws 同じ名前のタグが存在する場合は409エラー
   */
  async update(id: number, input: UpdateTagInput, userId: number): Promise<TagResponse> {
    const existing = await this.tagRepository.findById(id, userId);
    if (!existing) {
      throw notFound("タグ", id);
    }

    // 名前変更時のユニーク制約チェック
    if (input.name && input.name !== existing.name) {
      const duplicate = await this.tagRepository.findByName(input.name, userId);
      if (duplicate) {
        throw conflict("同じ名前のタグが既に存在します");
      }
    }

    const updated = await this.tagRepository.update(id, userId, {
      name: input.name,
      color: input.color,
    });
    if (!updated) {
      throw notFound("タグ", id);
    }
    return formatTagResponse(updated);
  }

  /**
   * タグを削除する
   * @param id - タグID
   * @param userId - ユーザーID
   * @throws タグが見つからない場合は404エラー
   */
  async destroy(id: number, userId: number): Promise<void> {
    const existing = await this.tagRepository.findById(id, userId);
    if (!existing) {
      throw notFound("タグ", id);
    }

    // todo_tagsはカスケード削除される
    await this.tagRepository.delete(id, userId);
  }
}
