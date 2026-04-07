import { and, desc, eq, lt } from "drizzle-orm"

import { writingVersions } from "../schema/writing-versions"
import type { DbClient, WritingVersionRow } from "../types/index"

export type WritingVersionSummary = {
  id: number
  writingId: number
  versionNumber: number
  title: string
  wordCount: number
  createdAt: Date
}

export type WritingVersionDetail = WritingVersionSummary & {
  bodyJson: unknown
  aiFeedbackJson: unknown | null
}

export type WritingVersionCreateInput = {
  writingId: number
  versionNumber: number
  title: string
  bodyJson: unknown
  wordCount: number
  aiFeedbackJson?: unknown | null
}

export type WritingVersionRepository = {
  create: (input: WritingVersionCreateInput) => Promise<WritingVersionDetail>
  list: (
    writingId: number,
    params?: { limit?: number; cursor?: string }
  ) => Promise<{
    items: WritingVersionSummary[]
    nextCursor: string | null
  }>
  getByVersion: (
    writingId: number,
    versionNumber: number
  ) => Promise<WritingVersionDetail | null>
}

function mapVersionSummary(row: WritingVersionRow): WritingVersionSummary {
  return {
    id: row.id,
    writingId: row.writingId,
    versionNumber: row.versionNumber,
    title: row.title,
    wordCount: row.wordCount,
    createdAt: row.createdAt,
  }
}

function mapVersionDetail(row: WritingVersionRow): WritingVersionDetail {
  return {
    ...mapVersionSummary(row),
    bodyJson: row.bodyJson,
    aiFeedbackJson: row.aiFeedbackJson,
  }
}

export function createWritingVersionRepository(
  database: DbClient
): WritingVersionRepository {
  return {
    async create(input) {
      const row = await database
        .insert(writingVersions)
        .values({
          writingId: input.writingId,
          versionNumber: input.versionNumber,
          title: input.title,
          bodyJson: input.bodyJson,
          wordCount: input.wordCount,
          aiFeedbackJson: input.aiFeedbackJson ?? null,
        })
        .returning()
        .then((rows) => rows[0]!)

      return mapVersionDetail(row)
    },

    async list(writingId, params = {}) {
      const limit = params.limit ?? 50

      let cursorCondition
      if (params.cursor) {
        const decoded = JSON.parse(
          Buffer.from(params.cursor, "base64url").toString()
        ) as { v: number }
        cursorCondition = lt(writingVersions.versionNumber, decoded.v)
      }

      const rows = await database
        .select()
        .from(writingVersions)
        .where(and(eq(writingVersions.writingId, writingId), cursorCondition))
        .orderBy(desc(writingVersions.versionNumber))
        .limit(limit + 1)

      const hasMore = rows.length > limit
      const items = (hasMore ? rows.slice(0, limit) : rows).map(
        mapVersionSummary
      )

      const lastItem = items[items.length - 1]
      const nextCursor =
        hasMore && lastItem
          ? Buffer.from(JSON.stringify({ v: lastItem.versionNumber })).toString(
              "base64url"
            )
          : null

      return { items, nextCursor }
    },

    async getByVersion(writingId, versionNumber) {
      const row = await database
        .select()
        .from(writingVersions)
        .where(
          and(
            eq(writingVersions.writingId, writingId),
            eq(writingVersions.versionNumber, versionNumber)
          )
        )
        .limit(1)
        .then((rows) => rows[0] ?? null)

      return row ? mapVersionDetail(row) : null
    },
  }
}
