import type { DraftDetail } from "@/domain/draft"
import type {
  PromptDetail,
  PromptFilters,
  PromptSummary,
} from "@/domain/prompt"
import {
  createAppRepository,
  type CreateDraftInput,
} from "@/features/writing/repositories/app-repository"

/**
 * 글감 기능이 필요로 하는 데이터 소스 추상화 (Port).
 * 구현체를 교체하면 테스트·로컬 모드 전환이 가능하다.
 */
export type PromptDataSource = {
  getPrompt: (promptId: number) => Promise<PromptDetail>
  listPrompts: (filters?: PromptFilters) => Promise<PromptSummary[]>
  savePrompt: (promptId: number) => Promise<{ kind: "saved"; savedAt: string }>
  unsavePrompt: (promptId: number) => Promise<void>
  createDraft: (input: CreateDraftInput) => Promise<DraftDetail>
}

export function createPromptDataSource(): PromptDataSource {
  const repository = createAppRepository()
  return {
    getPrompt: (promptId) => repository.getPrompt(promptId),
    listPrompts: (filters) => repository.listPrompts(filters),
    savePrompt: (promptId) => repository.savePrompt(promptId),
    unsavePrompt: (promptId) => repository.unsavePrompt(promptId),
    createDraft: (input) => repository.createDraft(input),
  }
}
