import type { DraftId, UserId } from "../../../shared/brand/index"
import type { DraftDetail, DraftRepository } from "../../../shared/ports/index"
import type { DraftContent } from "../../../shared/schema/index"
import { extractDraftTextMetrics } from "../../../shared/utilities/index"
import type { Draft } from "../model/index"
import { updateDraftContent, updateDraftTitle } from "../operations/index"
import {
  draftForbidden,
  draftNotFound,
  draftValidationFailed,
  type DraftModuleError,
} from "../errors/index"

export type AutosaveDraftInput = {
  readonly content?: DraftContent
  readonly title?: string
}

export type AutosaveDraftUseCaseOutput =
  | { kind: "success"; draft: DraftDetail }
  | DraftModuleError

function toDraft(detail: DraftDetail): Draft {
  const metrics = extractDraftTextMetrics(detail.content)

  return {
    characterCount: detail.characterCount,
    content: detail.content,
    createdAt: detail.createdAt,
    id: detail.id,
    lastSavedAt: detail.lastSavedAt,
    plainText: metrics.plainText,
    preview: detail.preview,
    sourcePromptId: detail.sourcePromptId,
    title: detail.title,
    updatedAt: detail.updatedAt,
    wordCount: detail.wordCount,
  }
}

/**
 * Autosaves draft with content and/or title.
 * At least one field must be provided.
 */
export async function autosaveDraftUseCase(
  userId: UserId,
  draftId: DraftId,
  input: AutosaveDraftInput,
  draftRepository: DraftRepository,
  getNow: () => string
): Promise<AutosaveDraftUseCaseOutput> {
  if (input.title === undefined && input.content === undefined) {
    return draftValidationFailed("변경할 제목 또는 본문이 필요합니다.")
  }

  const existing = await draftRepository.getById(userId, draftId)

  if (existing.kind === "not-found") {
    return draftNotFound("초안을 찾을 수 없습니다.")
  }

  if (existing.kind === "forbidden") {
    return draftForbidden(
      "다른 사용자의 초안에는 접근할 수 없습니다.",
      existing.ownerId
    )
  }

  const now = getNow()
  const nextTitle = input.title ?? existing.draft.title
  const nextContent = input.content ?? existing.draft.content

  let updated = updateDraftTitle(toDraft(existing.draft), nextTitle, now)
  if (input.content !== undefined) {
    updated = updateDraftContent(updated, nextContent, now)
  }

  const persisted = await draftRepository.replace(userId, draftId, {
    characterCount: updated.characterCount,
    content: updated.content,
    plainText: updated.plainText,
    sourcePromptId: updated.sourcePromptId,
    title: updated.title,
    wordCount: updated.wordCount,
  })

  if (persisted.kind === "not-found") {
    return draftNotFound("초안을 찾을 수 없습니다.")
  }

  if (persisted.kind === "forbidden") {
    return draftForbidden(
      "다른 사용자의 초안에는 접근할 수 없습니다.",
      persisted.ownerId
    )
  }

  return { draft: persisted.draft, kind: "success" }
}
