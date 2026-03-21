import { desc, eq } from "drizzle-orm"
import {
  toDraftId,
  toPromptId,
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
} from "@workspace/domain"

import { drafts } from "../schema/index.js"
import type { DbClient, DraftRow } from "../types/index.js"

function toPreview(plainText: string): string {
  return plainText.length <= 120 ? plainText : `${plainText.slice(0, 120)}...`
}

function mapDraftSummary(row: DraftRow): DraftSummary {
  return {
    characterCount: row.characterCount,
    id: toDraftId(row.id),
    lastSavedAt: row.lastSavedAt,
    preview: toPreview(row.bodyPlainText),
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

class DrizzleDraftRepository implements DraftRepository {
  constructor(private readonly database: DbClient) {}

  private loadDraftRow(draftId: DraftId): DraftRow | null {
    return (
      this.database
        .select()
        .from(drafts)
        .where(eq(drafts.id, draftId as number))
        .limit(1)
        .get() ?? null
    )
  }

  async create(userId: UserId, input: DraftPersistInput): Promise<DraftDetail> {
    const now = new Date().toISOString()
    const created = this.database
      .insert(drafts)
      .values({
        bodyJson: input.content,
        bodyPlainText: input.plainText,
        characterCount: input.characterCount,
        createdAt: now,
        lastSavedAt: now,
        sourcePromptId:
          input.sourcePromptId === null
            ? null
            : (input.sourcePromptId as number),
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

    const draft = await this.getById(userId, toDraftId(created.id))
    if (draft.kind !== "draft") {
      throw new Error("생성한 초안을 다시 읽지 못했습니다.")
    }

    return draft.draft
  }

  async delete(userId: UserId, draftId: DraftId): Promise<DraftDeleteResult> {
    const row = this.loadDraftRow(draftId)

    if (!row) {
      return { kind: "not-found" }
    }

    if (row.userId !== userId) {
      return {
        kind: "forbidden",
        ownerId: row.userId as UserId,
      }
    }

    this.database
      .delete(drafts)
      .where(eq(drafts.id, draftId as number))
      .run()

    return { kind: "deleted" }
  }

  async getById(userId: UserId, draftId: DraftId): Promise<DraftAccessResult> {
    const row = this.loadDraftRow(draftId)

    if (!row) {
      return { kind: "not-found" }
    }

    if (row.userId !== userId) {
      return {
        kind: "forbidden",
        ownerId: row.userId as UserId,
      }
    }

    return {
      draft: mapDraftDetail(row),
      kind: "draft",
    }
  }

  async list(userId: UserId, limit = 20): Promise<DraftSummary[]> {
    const rows = this.database
      .select()
      .from(drafts)
      .where(eq(drafts.userId, userId))
      .orderBy(desc(drafts.updatedAt), desc(drafts.id))
      .limit(limit)
      .all()

    return rows.map(mapDraftSummary)
  }

  async replace(
    userId: UserId,
    draftId: DraftId,
    input: DraftPersistInput
  ): Promise<DraftMutationResult> {
    const current = this.loadDraftRow(draftId)

    if (!current) {
      return { kind: "not-found" }
    }

    if (current.userId !== userId) {
      return {
        kind: "forbidden",
        ownerId: current.userId as UserId,
      }
    }

    const now = new Date().toISOString()

    this.database
      .update(drafts)
      .set({
        bodyJson: input.content,
        bodyPlainText: input.plainText,
        characterCount: input.characterCount,
        lastSavedAt: now,
        sourcePromptId:
          input.sourcePromptId === null
            ? null
            : (input.sourcePromptId as number),
        title: input.title,
        updatedAt: now,
        wordCount: input.wordCount,
      })
      .where(eq(drafts.id, draftId as number))
      .run()

    const updated = this.loadDraftRow(draftId)

    if (!updated) {
      return { kind: "not-found" }
    }

    return {
      draft: mapDraftDetail(updated),
      kind: "draft",
    }
  }

  async resume(userId: UserId): Promise<DraftSummary | null> {
    const row =
      this.database
        .select()
        .from(drafts)
        .where(eq(drafts.userId, userId))
        .orderBy(desc(drafts.updatedAt), desc(drafts.id))
        .limit(1)
        .get() ?? null

    return row ? mapDraftSummary(row) : null
  }
}

export function createDraftRepository(database: DbClient): DraftRepository {
  return new DrizzleDraftRepository(database)
}
