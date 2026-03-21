import {
  toDraftId,
  toPromptId,
  toUserId,
  type DraftAccessResult,
  type DraftDetail,
  type DraftId,
  type DraftPersistInput,
  type DraftSummary,
  type UserId,
} from "@workspace/core"

import type { DraftRow } from "../types/db.js"

function toForbiddenDraftResult(ownerId: string): {
  kind: "forbidden"
  ownerId: UserId
} {
  return {
    kind: "forbidden",
    ownerId: toUserId(ownerId),
  }
}

export function createDraftPreview(plainText: string): string {
  return plainText.length <= 120 ? plainText : `${plainText.slice(0, 120)}...`
}

export function toDraftIdValue(draftId: DraftId): number {
  return draftId as number
}

export function toPromptIdValue(
  promptId: DraftPersistInput["sourcePromptId"]
): number | null {
  return promptId === null ? null : (promptId as number)
}

export function mapDraftSummary(row: DraftRow): DraftSummary {
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

export function mapDraftDetail(row: DraftRow): DraftDetail {
  return {
    ...mapDraftSummary(row),
    content: row.bodyJson,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export function mapDraftAccessResult(
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

export function mapDraftForbiddenResult(ownerId: string): {
  kind: "forbidden"
  ownerId: UserId
} {
  return toForbiddenDraftResult(ownerId)
}
