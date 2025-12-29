/**
 * Todo検索サービス
 * @module features/todo/search-service
 */

import type { TodoSearchRepositoryInterface } from "./search-repository";
import type { NormalizedSearchParams } from "./search-validators";
import { formatTodoResponse } from "./types";
import type { TodoResponse } from "../../shared/validators/responses";

/**
 * フィルター適用状態
 */
export interface FiltersApplied {
  /** 検索クエリ */
  q?: string;
  /** ステータスフィルター */
  status?: string[];
  /** 優先度フィルター */
  priority?: string[];
  /** カテゴリID（nullはカテゴリなし） */
  category_id?: number | null;
  /** タグID */
  tag_ids?: number[];
  /** タグマッチモード */
  tag_mode?: string;
  /** 期限開始日 */
  due_date_from?: string;
  /** 期限終了日 */
  due_date_to?: string;
}

/**
 * 検索メタデータ
 */
export interface SearchMeta {
  /** トータル件数 */
  total: number;
  /** 現在のページ */
  current_page: number;
  /** トータルページ数 */
  total_pages: number;
  /** ページサイズ */
  per_page: number;
  /** 検索クエリ */
  search_query?: string;
  /** 適用されたフィルター */
  filters_applied: FiltersApplied;
}

/**
 * 検索サジェスション
 */
export interface SearchSuggestion {
  /** サジェスションタイプ */
  type: "reduce_filters" | "broaden_search" | "check_dates";
  /** メッセージ */
  message: string;
  /** 現在のフィルター */
  current_filters?: string[];
}

/**
 * 検索レスポンス
 */
export interface TodoSearchResponse {
  /** Todoデータ */
  data: TodoResponse[];
  /** メタデータ */
  meta: SearchMeta;
  /** サジェスション（結果0件時） */
  suggestions?: SearchSuggestion[];
}

/**
 * Todo検索サービス
 */
export class TodoSearchService {
  /**
   * TodoSearchServiceを作成する
   * @param searchRepository - 検索リポジトリ
   */
  constructor(private searchRepository: TodoSearchRepositoryInterface) {}

  /**
   * Todoを検索する
   * @param params - 正規化された検索パラメータ
   * @param userId - ユーザーID
   * @returns 検索レスポンス
   */
  async search(params: NormalizedSearchParams, userId: number): Promise<TodoSearchResponse> {
    const { todos, total } = await this.searchRepository.search(userId, params);

    // レスポンス形式に変換
    const todoResponses: TodoResponse[] = todos.map(formatTodoResponse);

    // メタデータを構築
    const totalPages = Math.ceil(total / params.perPage);
    const filtersApplied = this.buildFiltersApplied(params);

    // サジェスションを生成（結果が0件の場合）
    const suggestions = total === 0 ? this.generateSuggestions(params) : undefined;

    return {
      data: todoResponses,
      meta: {
        total,
        current_page: params.page,
        total_pages: totalPages,
        per_page: params.perPage,
        search_query: params.q,
        filters_applied: filtersApplied,
      },
      suggestions,
    };
  }

  /**
   * 適用されたフィルターを構築する
   * @param params - 検索パラメータ
   * @returns フィルター適用状態
   */
  private buildFiltersApplied(params: NormalizedSearchParams): FiltersApplied {
    const filters: FiltersApplied = {};

    if (params.q) {
      filters.q = params.q;
    }
    if (params.status && params.status.length > 0) {
      filters.status = params.status;
    }
    if (params.priority && params.priority.length > 0) {
      filters.priority = params.priority;
    }
    if (params.categoryId !== undefined) {
      // -1はカテゴリなし（null）を表す
      filters.category_id = params.categoryId === -1 ? null : params.categoryId;
    }
    if (params.tagIds && params.tagIds.length > 0) {
      filters.tag_ids = params.tagIds;
      filters.tag_mode = params.tagMode;
    }
    if (params.dueDateFrom) {
      filters.due_date_from = params.dueDateFrom;
    }
    if (params.dueDateTo) {
      filters.due_date_to = params.dueDateTo;
    }

    return filters;
  }

  /**
   * 結果が0件の場合のサジェスションを生成する
   * @param params - 検索パラメータ
   * @returns サジェスションの配列
   */
  private generateSuggestions(params: NormalizedSearchParams): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];
    const appliedFilters: string[] = [];

    // 適用されているフィルターを収集
    if (params.q) appliedFilters.push("検索キーワード");
    if (params.status && params.status.length > 0) appliedFilters.push("ステータス");
    if (params.priority && params.priority.length > 0) appliedFilters.push("優先度");
    if (params.categoryId !== undefined) appliedFilters.push("カテゴリ");
    if (params.tagIds && params.tagIds.length > 0) appliedFilters.push("タグ");
    if (params.dueDateFrom || params.dueDateTo) appliedFilters.push("期限日");

    // フィルターが多い場合
    if (appliedFilters.length >= 2) {
      suggestions.push({
        type: "reduce_filters",
        message: "条件に一致するTodoが見つかりません。フィルターを減らしてみてください。",
        current_filters: appliedFilters,
      });
    }

    // 検索キーワードがある場合
    if (params.q && params.q.length > 3) {
      suggestions.push({
        type: "broaden_search",
        message: "検索キーワードを短くしてみてください。",
      });
    }

    // 日付範囲がある場合
    if (params.dueDateFrom && params.dueDateTo) {
      suggestions.push({
        type: "check_dates",
        message: "日付範囲を広げてみてください。",
      });
    }

    return suggestions;
  }
}
