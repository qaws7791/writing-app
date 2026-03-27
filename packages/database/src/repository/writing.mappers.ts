import {
  toWritingId,
  toPromptId,
  toUserId,
  type WritingCrudAccessResult,
  type WritingDetail,
  type WritingId,
  type WritingPersistInput,
  type WritingSummary,
  type UserId,
} from "@workspace/core"

import type { WritingRow } from "../types/db.js"

function toForbiddenWritingResult(ownerId: string): {
  kind: "forbidden"
  ownerId: UserId
} {
  return {
    kind: "forbidden",
    ownerId: toUserId(ownerId),
  }
}

export function createWritingPreview(plainText: string): string {
  return plainText.length <= 120 ? plainText : `${plainText.slice(0, 120)}...`
}

export function toWritingIdValue(writingId: WritingId): number {
  return writingId as number
}

export function toPromptIdValue(
  promptId: WritingPersistInput["sourcePromptId"]
): number | null {
  return promptId === null ? null : (promptId as number)
}

export function mapWritingSummary(row: WritingRow): WritingSummary {
  return {
    characterCount: row.characterCount,
    id: toWritingId(row.id),
    lastSavedAt: row.lastSavedAt,
    preview: createWritingPreview(row.bodyPlainText),
    sourcePromptId:
      row.sourcePromptId === null ? null : toPromptId(row.sourcePromptId),
    title: row.title,
    wordCount: row.wordCount,
  }
}

export function mapWritingDetail(row: WritingRow): WritingDetail {
  return {
    ...mapWritingSummary(row),
    content: row.bodyJson,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export function mapWritingCrudAccessResult(
  userId: UserId,
  row: WritingRow | null
): WritingCrudAccessResult {
  if (!row) {
    return { kind: "not-found" }
  }

  if (row.userId !== userId) {
    return toForbiddenWritingResult(row.userId)
  }

  return {
    writing: mapWritingDetail(row),
    kind: "writing",
  }
}

export function mapWritingForbiddenResult(ownerId: string): {
  kind: "forbidden"
  ownerId: UserId
} {
  return toForbiddenWritingResult(ownerId)
}
