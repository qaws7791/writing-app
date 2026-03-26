import { and, desc, eq, lt, or } from "drizzle-orm"
import {
  toWritingId,
  buildCursorPage,
  decodeCursor,
  mapCursorPage,
  type CursorPage,
  type CursorPageParams,
  type WritingCrudAccessResult,
  type WritingDeleteResult,
  type WritingDetail,
  type WritingId,
  type WritingMutationResult,
  type WritingPersistInput,
  type WritingRepository,
  type WritingSummary,
  type UserId,
} from "@workspace/core"

import { writings } from "../schema/index.js"
import type { DbClient, WritingRow } from "../types/index.js"
import {
  mapWritingCrudAccessResult,
  mapWritingDetail,
  mapWritingForbiddenResult,
  mapWritingSummary,
  toWritingIdValue,
  toPromptIdValue,
} from "./writing-crud.mappers.js"

type Clock = () => string

function loadWritingRow(
  database: DbClient,
  writingId: WritingId
): WritingRow | null {
  return (
    database
      .select()
      .from(writings)
      .where(eq(writings.id, toWritingIdValue(writingId)))
      .limit(1)
      .get() ?? null
  )
}

export function createWritingRepository(
  database: DbClient,
  clock: Clock = () => new Date().toISOString()
): WritingRepository {
  async function getWritingById(
    userId: UserId,
    writingId: WritingId
  ): Promise<WritingCrudAccessResult> {
    return mapWritingCrudAccessResult(
      userId,
      loadWritingRow(database, writingId)
    )
  }

  return {
    async create(
      userId: UserId,
      input: WritingPersistInput
    ): Promise<WritingDetail> {
      const now = clock()
      const created = database
        .insert(writings)
        .values({
          bodyJson: input.content,
          bodyPlainText: input.plainText,
          characterCount: input.characterCount,
          createdAt: now,
          lastSavedAt: now,
          sourcePromptId: toPromptIdValue(input.sourcePromptId),
          title: input.title,
          updatedAt: now,
          userId,
          wordCount: input.wordCount,
        })
        .returning({ id: writings.id })
        .get()

      if (!created) {
        throw new Error("글을 생성하지 못했습니다.")
      }

      const writing = await getWritingById(userId, toWritingId(created.id))
      if (writing.kind !== "writing") {
        throw new Error("생성한 글을 다시 읽지 못했습니다.")
      }

      return writing.writing
    },

    async delete(
      userId: UserId,
      writingId: WritingId
    ): Promise<WritingDeleteResult> {
      const row = loadWritingRow(database, writingId)

      if (!row) {
        return { kind: "not-found" }
      }

      if (row.userId !== userId) {
        return mapWritingForbiddenResult(row.userId)
      }

      database
        .delete(writings)
        .where(eq(writings.id, toWritingIdValue(writingId)))
        .run()

      return { kind: "deleted" }
    },

    async getById(
      userId: UserId,
      writingId: WritingId
    ): Promise<WritingCrudAccessResult> {
      return getWritingById(userId, writingId)
    },

    async list(
      userId: UserId,
      params: CursorPageParams = {}
    ): Promise<CursorPage<WritingSummary>> {
      const limit = params.limit ?? 20
      const cursor = params.cursor
        ? decodeCursor<{ u: string; i: number }>(params.cursor)
        : null

      const cursorCondition = cursor
        ? or(
            lt(writings.updatedAt, cursor.u),
            and(eq(writings.updatedAt, cursor.u), lt(writings.id, cursor.i))
          )
        : undefined

      const rows = database
        .select()
        .from(writings)
        .where(and(eq(writings.userId, userId), cursorCondition))
        .orderBy(desc(writings.updatedAt), desc(writings.id))
        .limit(limit + 1)
        .all()

      return mapCursorPage(
        buildCursorPage(rows, limit, (row) => ({
          u: row.updatedAt,
          i: row.id,
        })),
        mapWritingSummary
      )
    },

    async replace(
      userId: UserId,
      writingId: WritingId,
      input: WritingPersistInput
    ): Promise<WritingMutationResult> {
      const current = loadWritingRow(database, writingId)

      if (!current) {
        return { kind: "not-found" }
      }

      if (current.userId !== userId) {
        return mapWritingForbiddenResult(current.userId)
      }

      const now = clock()

      database
        .update(writings)
        .set({
          bodyJson: input.content,
          bodyPlainText: input.plainText,
          characterCount: input.characterCount,
          lastSavedAt: now,
          sourcePromptId: toPromptIdValue(input.sourcePromptId),
          title: input.title,
          updatedAt: now,
          wordCount: input.wordCount,
        })
        .where(eq(writings.id, toWritingIdValue(writingId)))
        .run()

      const updated = loadWritingRow(database, writingId)

      if (!updated) {
        return { kind: "not-found" }
      }

      return {
        writing: mapWritingDetail(updated),
        kind: "writing",
      }
    },

    async resume(userId: UserId): Promise<WritingSummary | null> {
      const row =
        database
          .select()
          .from(writings)
          .where(eq(writings.userId, userId))
          .orderBy(desc(writings.updatedAt), desc(writings.id))
          .limit(1)
          .get() ?? null

      return row ? mapWritingSummary(row) : null
    },
  }
}
