import type { WritingId, UserId } from "../../../shared/brand/index"
import type { WritingDetail } from "../writing-types"
import type { WritingRepository } from "../writing-crud-port"
import type { WritingContent } from "../../../shared/schema/index"
import { extractWritingTextMetrics } from "../../../shared/utilities/index"
import type { WritingFull } from "../writing-types"
import {
  updateWritingContent,
  updateWritingTitle,
} from "../writing-crud-operations"
import {
  writingForbidden,
  writingNotFound,
  writingValidationFailed,
  type WritingModuleError,
} from "../writing-error"

export type AutosaveWritingInput = {
  readonly content?: WritingContent
  readonly title?: string
}

export type AutosaveWritingUseCaseOutput =
  | { kind: "success"; writing: WritingDetail }
  | WritingModuleError

export type AutosaveWritingUseCaseDependencies = {
  readonly writingRepository: WritingRepository
  readonly getNow: () => string
}

function toWriting(detail: WritingDetail): WritingFull {
  const metrics = extractWritingTextMetrics(detail.content)

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
 * Autosaves WritingFull with content and/or title.
 * At least one field must be provided.
 */
export function makeAutosaveWritingUseCase(
  dependencies: AutosaveWritingUseCaseDependencies
) {
  return async (
    userId: UserId,
    writingId: WritingId,
    input: AutosaveWritingInput
  ): Promise<AutosaveWritingUseCaseOutput> => {
    if (input.title === undefined && input.content === undefined) {
      return writingValidationFailed("변경할 제목 또는 본문이 필요합니다.")
    }

    const existing = await dependencies.writingRepository.getById(
      userId,
      writingId
    )

    if (existing.kind === "not-found") {
      return writingNotFound("글을 찾을 수 없습니다.", writingId)
    }

    if (existing.kind === "forbidden") {
      return writingForbidden(
        "다른 사용자의 글에는 접근할 수 없습니다.",
        existing.ownerId
      )
    }

    const nextTitle = input.title ?? existing.writing.title
    const nextContent = input.content ?? existing.writing.content
    const now = dependencies.getNow()

    let updated = updateWritingTitle(
      toWriting(existing.writing),
      nextTitle,
      now
    )
    if (input.content !== undefined) {
      updated = updateWritingContent(updated, nextContent, now)
    }

    const persisted = await dependencies.writingRepository.replace(
      userId,
      writingId,
      {
        characterCount: updated.characterCount,
        content: updated.content,
        plainText: updated.plainText,
        sourcePromptId: updated.sourcePromptId,
        title: updated.title,
        wordCount: updated.wordCount,
      }
    )

    if (persisted.kind === "not-found") {
      return writingNotFound("글을 찾을 수 없습니다.", writingId)
    }

    if (persisted.kind === "forbidden") {
      return writingForbidden(
        "다른 사용자의 글에는 접근할 수 없습니다.",
        persisted.ownerId
      )
    }

    return { writing: persisted.writing, kind: "success" }
  }
}

export async function AutosaveWritingUseCase(
  userId: UserId,
  writingId: WritingId,
  input: AutosaveWritingInput,
  writingRepository: WritingRepository,
  getNow: () => string
): Promise<AutosaveWritingUseCaseOutput> {
  return makeAutosaveWritingUseCase({
    writingRepository,
    getNow,
  })(userId, writingId, input)
}
