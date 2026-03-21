import { desc, eq } from "drizzle-orm"
import {
  toDraftId,
  toPromptId,
  toUserId,
  type DraftAccessResult,
  type DraftContent,
  type DraftDeleteResult,
  type DraftDetail,
  type DraftId,
  type DraftMutationResult,
  type DraftPersistInput,
  type DraftRepository,
  type DraftSummary,
  type UserId,
} from "@workspace/core"

import { drafts } from "../schema/index.js"
import type { DbClient, DraftRow } from "../types/index.js"

function createDraftPreview(plainText: string): string {
  return plainText.length <= 120 ? plainText : `${plainText.slice(0, 120)}...`
}

function toDraftIdValue(draftId: DraftId): number {
  return draftId as number
}

function toPromptIdValue(
  promptId: DraftPersistInput["sourcePromptId"]
): number | null {
  return promptId === null ? null : (promptId as number)
}

function toForbiddenDraftResult(ownerId: string): {
  kind: "forbidden"
  ownerId: UserId
} {
  return {
    kind: "forbidden",
    ownerId: toUserId(ownerId),
  }
}

function loadDraftRow(database: DbClient, draftId: DraftId): DraftRow | null {
  return (
    database
      .select()
      .from(drafts)
      .where(eq(drafts.id, toDraftIdValue(draftId)))
      .limit(1)
      .get() ?? null
  )
}

function mapDraftSummary(row: DraftRow): DraftSummary {
  return {
    characterCount: row.characterCount,
    id: toDraftId(row.id),
    lastSavedAt: row.lastSavedAt,
    preview: createDraftPreview(row.bodyPlainText),
    sourcePromptId:
      row.sourcePromptId === null ? null : toPromptId(row.sourcePromptId),
    title: row.title,
    wordCount: row.wordCount,
  }
}

function mapDraftDetail(row: DraftRow): DraftDetail {
  return {
    ...mapDraftSummary(row),
    content: row.bodyJson as DraftContent,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function mapDraftAccessResult(
  userId: UserId,
  row: DraftRow | null
): DraftAccessResult {
  if (!row) {
    return { kind: "not-found" }
  }

  if (row.userId !== userId) {
    return toForbiddenDraftResult(row.userId)
  }

  return {
    draft: mapDraftDetail(row),
    kind: "draft",
  }
}

export function createDraftRepository(database: DbClient): DraftRepository {
  async function getDraftById(
    userId: UserId,
    draftId: DraftId
  ): Promise<DraftAccessResult> {
    return mapDraftAccessResult(userId, loadDraftRow(database, draftId))
  }

  return {
    async create(
      userId: UserId,
      input: DraftPersistInput
    ): Promise<DraftDetail> {
      const now = new Date().toISOString()
      const created = database
        .insert(drafts)
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
        .returning({ id: drafts.id })
        .get()

      if (!created) {
        throw new Error("초안을 생성하지 못했습니다.")
      }

      const draft = await getDraftById(userId, toDraftId(created.id))
      if (draft.kind !== "draft") {
        throw new Error("생성한 초안을 다시 읽지 못했습니다.")
      }

      return draft.draft
    },

    async delete(userId: UserId, draftId: DraftId): Promise<DraftDeleteResult> {
      const row = loadDraftRow(database, draftId)

      if (!row) {
        return { kind: "not-found" }
      }

      if (row.userId !== userId) {
        return toForbiddenDraftResult(row.userId)
      }

      database
        .delete(drafts)
        .where(eq(drafts.id, toDraftIdValue(draftId)))
        .run()

      return { kind: "deleted" }
    },

    async getById(
      userId: UserId,
      draftId: DraftId
    ): Promise<DraftAccessResult> {
      return getDraftById(userId, draftId)
    },

    async list(userId: UserId, limit = 20): Promise<DraftSummary[]> {
      const rows = database
        .select()
        .from(drafts)
        .where(eq(drafts.userId, userId))
        .orderBy(desc(drafts.updatedAt), desc(drafts.id))
        .limit(limit)
        .all()

      return rows.map(mapDraftSummary)
    },

    async replace(
      userId: UserId,
      draftId: DraftId,
      input: DraftPersistInput
    ): Promise<DraftMutationResult> {
      const current = loadDraftRow(database, draftId)

      if (!current) {
        return { kind: "not-found" }
      }

      if (current.userId !== userId) {
        return toForbiddenDraftResult(current.userId)
      }

      const now = new Date().toISOString()

      database
        .update(drafts)
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
        .where(eq(drafts.id, toDraftIdValue(draftId)))
        .run()

      const updated = loadDraftRow(database, draftId)

      if (!updated) {
        return { kind: "not-found" }
      }

      return {
        draft: mapDraftDetail(updated),
        kind: "draft",
      }
    },

    async resume(userId: UserId): Promise<DraftSummary | null> {
      const row =
        database
          .select()
          .from(drafts)
          .where(eq(drafts.userId, userId))
          .orderBy(desc(drafts.updatedAt), desc(drafts.id))
          .limit(1)
          .get() ?? null

      return row ? mapDraftSummary(row) : null
    },
  }
}
