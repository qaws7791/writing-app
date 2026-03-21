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
  const sourcePromptId = input.sourcePromptId ?? null

  if (sourcePromptId !== null) {
    const exists = await promptExists(sourcePromptId)
    if (!exists) {
      return promptNotFound("글감을 찾을 수 없습니다.")
    }
  }

  const content = input.content ?? createEmptyDraftContent()
  const id = createId()
  const now = getNow()
  const draft = buildDraft(id, input.title ?? "", content, sourcePromptId, now)

  const persisted = await draftRepository.create(userId, {
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
