import type { Context } from "hono";

export interface PaginationMeta {
  total: number;
  current_page: number;
  total_pages: number;
  per_page: number;
}

export interface ListResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export function paginate<T>(
  data: T[],
  total: number,
  page: number,
  perPage: number,
): ListResponse<T> {
  return {
    data,
    meta: {
      total,
      current_page: page,
      total_pages: Math.ceil(total / perPage),
      per_page: perPage,
    },
  };
}

export function ok<T>(c: Context, data: T) {
  return c.json(data, 200);
}

export function created<T>(c: Context, data: T) {
  return c.json(data, 201);
}

export function noContent(c: Context) {
  return c.body(null, 204);
}
