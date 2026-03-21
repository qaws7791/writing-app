import { desc, eq } from "drizzle-orm"
import {
  toDraftId,
  type DraftAccessResult,
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
import {
  mapDraftAccessResult,
  mapDraftDetail,
  mapDraftForbiddenResult,
  mapDraftSummary,
  toDraftIdValue,
  toPromptIdValue,
} from "./draft.mappers.js"

type Clock = () => string

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

export function createDraftRepository(
  database: DbClient,
  clock: Clock = () => new Date().toISOString()
): DraftRepository {
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
      const now = clock()
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
        return mapDraftForbiddenResult(row.userId)
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
        return mapDraftForbiddenResult(current.userId)
      }

      const now = clock()

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
