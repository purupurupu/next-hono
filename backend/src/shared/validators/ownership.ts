/**
 * 所有者検証ユーティリティ
 * @module shared/validators/ownership
 */

import { forbidden } from "../../lib/errors";

/**
 * IDを持つエンティティのインターフェース
 */
interface HasId {
  id: number;
}

/**
 * IDによる複数エンティティ取得が可能なリポジトリのインターフェース
 */
interface FindByIdsRepository<T extends HasId> {
  findByIds(ids: number[], userId: number): Promise<T[]>;
}

/**
 * IDによる単一エンティティ取得が可能なリポジトリのインターフェース
 */
interface FindByIdRepository<T extends HasId> {
  findById(id: number, userId: number): Promise<T | undefined>;
}

/**
 * 複数のエンティティの所有権を検証する
 * @param ids - 検証するエンティティIDの配列
 * @param userId - ユーザーID
 * @param repository - findByIdsメソッドを持つリポジトリ
 * @param errorMessage - エラー時のメッセージ
 * @throws ForbiddenError - 所有権のないエンティティが含まれている場合
 */
export async function validateMultipleOwnership<T extends HasId>(
  ids: number[],
  userId: number,
  repository: FindByIdsRepository<T>,
  errorMessage: string,
): Promise<void> {
  if (ids.length === 0) {
    return;
  }
  const entities = await repository.findByIds(ids, userId);
  if (entities.length !== ids.length) {
    throw forbidden(errorMessage);
  }
}

/**
 * 単一のエンティティの所有権を検証する
 * @param id - 検証するエンティティID
 * @param userId - ユーザーID
 * @param repository - findByIdメソッドを持つリポジトリ
 * @param errorMessage - エラー時のメッセージ
 * @throws ForbiddenError - 所有権のないエンティティの場合
 */
export async function validateSingleOwnership<T extends HasId>(
  id: number,
  userId: number,
  repository: FindByIdRepository<T>,
  errorMessage: string,
): Promise<void> {
  const entity = await repository.findById(id, userId);
  if (!entity) {
    throw forbidden(errorMessage);
  }
}
