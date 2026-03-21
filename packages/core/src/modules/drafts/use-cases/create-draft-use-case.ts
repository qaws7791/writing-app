import type { DraftContent } from "../../../shared/schema/index"
import { createEmptyDraftContent } from "../../../shared/utilities/index"
import type { DraftId, PromptId, UserId } from "../../../shared/brand/index"
import type { DraftDetail, DraftRepository } from "../../../shared/ports/index"
import { buildDraft } from "../operations/index"
import { promptNotFound, type DraftModuleError } from "../errors/index"

export type CreateDraftInput = {
  readonly content?: DraftContent
  readonly sourcePromptId?: PromptId
  readonly title?: string
}

export type CreateDraftUseCaseOutput =
  | { kind: "success"; draft: DraftDetail }
  | DraftModuleError

export type CreateDraftUseCaseDependencies = {
  readonly createDraftId: () => DraftId
  readonly draftRepository: DraftRepository
  readonly getNow: () => string
  readonly promptExists: (id: PromptId) => Promise<boolean>
}

export function makeCreateDraftUseCase(
  dependencies: CreateDraftUseCaseDependencies
) {
  return async (
    userId: UserId,
    input: CreateDraftInput
  ): Promise<CreateDraftUseCaseOutput> => {
    const sourcePromptId = input.sourcePromptId ?? null

    if (sourcePromptId !== null) {
      const exists = await dependencies.promptExists(sourcePromptId)
      if (!exists) {
        return promptNotFound("글감을 찾을 수 없습니다.", sourcePromptId)
      }
    }

    const content = input.content ?? createEmptyDraftContent()
    const draft = buildDraft(
      dependencies.createDraftId(),
      input.title ?? "",
      content,
      sourcePromptId,
      dependencies.getNow()
    )

    const persisted = await dependencies.draftRepository.create(userId, {
      characterCount: draft.characterCount,
      content: draft.content,
      plainText: draft.plainText,
      sourcePromptId: draft.sourcePromptId,
      title: draft.title,
      wordCount: draft.wordCount,
    })

    return {
      draft: persisted,
      kind: "success",
    }
  }
}

/**
 * Creates a new draft.
 * Validates source prompt exists if provided.
 */
export async function createDraftUseCase(
  userId: UserId,
  input: CreateDraftInput,
  draftRepository: DraftRepository,
  promptExists: (id: PromptId) => Promise<boolean>,
  createId: () => DraftId,
  getNow: () => string
): Promise<CreateDraftUseCaseOutput> {
  return makeCreateDraftUseCase({
    createDraftId: createId,
    draftRepository,
    getNow,
    promptExists,
  })(userId, input)
}
