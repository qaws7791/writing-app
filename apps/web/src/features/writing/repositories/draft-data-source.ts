import type { DraftContent, DraftDetail } from "@/domain/draft"
import type { PromptDetail } from "@/domain/prompt"
import {
  createAppRepository,
  type AutosaveDraftResult,
} from "@/features/writing/repositories/app-repository"

export type DraftDataSource = {
  autosaveDraft: (
    draftId: number,
    input: { content?: DraftContent; title?: string }
  ) => Promise<AutosaveDraftResult>
  deleteDraft: (draftId: number) => Promise<void>
  getDraft: (draftId: number) => Promise<DraftDetail>
  getPrompt: (promptId: number) => Promise<PromptDetail>
}

export function createDraftDataSource(): DraftDataSource {
  const repository = createAppRepository()
  return {
    autosaveDraft: (draftId, input) => repository.autosaveDraft(draftId, input),
    deleteDraft: (draftId) => repository.deleteDraft(draftId),
    getDraft: (draftId) => repository.getDraft(draftId),
    getPrompt: (promptId) => repository.getPrompt(promptId),
  }
}
