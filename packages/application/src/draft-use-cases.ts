import {
  createEmptyDraftContent,
  extractDraftTextMetrics,
  type DraftContent,
  type DraftId,
  type DraftRepository,
  type PromptId,
  type PromptRepository,
  type UserId,
} from "@workspace/domain"

import { ForbiddenError, NotFoundError, ValidationError } from "./errors.js"

type CreateDraftInput = {
  sourcePromptId?: PromptId
}

type AutosaveDraftInput = {
  content?: DraftContent
  title?: string
}

export function createDraftUseCases(
  draftRepository: DraftRepository,
  promptRepository: PromptRepository
) {
  return {
    async autosaveDraft(
      userId: UserId,
      draftId: DraftId,
      input: AutosaveDraftInput
    ) {
      if (input.title === undefined && input.content === undefined) {
        throw new ValidationError("변경할 제목 또는 본문이 필요합니다.")
      }

      const existing = await draftRepository.getById(userId, draftId)

      if (existing.kind === "not-found") {
        throw new NotFoundError("초안을 찾을 수 없습니다.")
      }

      if (existing.kind === "forbidden") {
        throw new ForbiddenError("다른 사용자의 초안에는 접근할 수 없습니다.")
      }

      const nextTitle = input.title ?? existing.draft.title
      const nextContent = input.content ?? existing.draft.content
      const metrics = extractDraftTextMetrics(nextContent)
      const updated = await draftRepository.replace(userId, draftId, {
        characterCount: metrics.characterCount,
        content: nextContent,
        plainText: metrics.plainText,
        sourcePromptId: existing.draft.sourcePromptId,
        title: nextTitle,
        wordCount: metrics.wordCount,
      })

      if (updated.kind === "not-found") {
        throw new NotFoundError("초안을 찾을 수 없습니다.")
      }

      if (updated.kind === "forbidden") {
        throw new ForbiddenError("다른 사용자의 초안에는 접근할 수 없습니다.")
      }

      return {
        draft: updated.draft,
        kind: "autosaved" as const,
      }
    },

    async createDraft(userId: UserId, input: CreateDraftInput) {
      const sourcePromptId = input.sourcePromptId ?? null

      if (sourcePromptId !== null) {
        const exists = await promptRepository.exists(sourcePromptId)
        if (!exists) {
          throw new NotFoundError("글감을 찾을 수 없습니다.")
        }
      }

      const content = createEmptyDraftContent()
      const metrics = extractDraftTextMetrics(content)

      return draftRepository.create(userId, {
        characterCount: metrics.characterCount,
        content,
        plainText: metrics.plainText,
        sourcePromptId,
        title: "",
        wordCount: metrics.wordCount,
      })
    },

    async deleteDraft(userId: UserId, draftId: DraftId) {
      const result = await draftRepository.delete(userId, draftId)

      if (result.kind === "not-found") {
        throw new NotFoundError("초안을 찾을 수 없습니다.")
      }

      if (result.kind === "forbidden") {
        throw new ForbiddenError("다른 사용자의 초안에는 접근할 수 없습니다.")
      }
    },

    async getDraft(userId: UserId, draftId: DraftId) {
      const result = await draftRepository.getById(userId, draftId)

      if (result.kind === "not-found") {
        throw new NotFoundError("초안을 찾을 수 없습니다.")
      }

      if (result.kind === "forbidden") {
        throw new ForbiddenError("다른 사용자의 초안에는 접근할 수 없습니다.")
      }

      return result.draft
    },

    async listDrafts(userId: UserId, limit?: number) {
      return draftRepository.list(userId, limit)
    },
  }
}
