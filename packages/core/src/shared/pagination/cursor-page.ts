export type CursorPageParams = {
  readonly cursor?: string
  readonly limit?: number
}

export type CursorPage<T> = {
  readonly items: readonly T[]
  readonly nextCursor: string | null
  readonly hasMore: boolean
}

export function encodeCursor(payload: Record<string, unknown>): string {
  return btoa(JSON.stringify(payload))
}

export function decodeCursor<T extends Record<string, unknown>>(
  cursor: string
): T | null {
  try {
    const decoded = JSON.parse(atob(cursor))
    if (typeof decoded !== "object" || decoded === null) return null
    return decoded as T
  } catch {
    return null
  }
}

/**
 * limit + 1개를 조회한 rows에서 CursorPage를 생성한다.
 * toCursor는 마지막 항목에서 커서 페이로드를 추출하는 함수이다.
 */
export function buildCursorPage<T>(
  rows: readonly T[],
  limit: number,
  toCursor: (item: T) => Record<string, unknown>
): CursorPage<T> {
  const hasMore = rows.length > limit
  const items = hasMore ? rows.slice(0, limit) : rows
  const last = items.at(-1)
  const nextCursor = hasMore && last ? encodeCursor(toCursor(last)) : null
  return { items, nextCursor, hasMore }
}

export function mapCursorPage<T, U>(
  page: CursorPage<T>,
  fn: (item: T) => U
): CursorPage<U> {
  return {
    items: page.items.map(fn),
    nextCursor: page.nextCursor,
    hasMore: page.hasMore,
  }
}
