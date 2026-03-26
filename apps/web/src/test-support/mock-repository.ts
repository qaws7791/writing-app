import { vi, type Mock } from "vitest"

import type { DraftContent } from "@/domain/draft"
import type { PromptFilters } from "@/domain/prompt"
import type {
  AutosaveDraftResult,
  CreateDraftInput,
  DraftRepository,
} from "@/features/writing/repositories/draft-repository"
import type { HomeRepository } from "@/features/home/repositories/home-repository"
import type { PromptRepository } from "@/features/prompt/repositories/prompt-repository"

type MockedDraftRepository = {
  [TKey in keyof DraftRepository]: Mock<DraftRepository[TKey]>
}

type MockedHomeRepository = {
  [TKey in keyof HomeRepository]: Mock<HomeRepository[TKey]>
}

type MockedPromptRepository = {
  [TKey in keyof PromptRepository]: Mock<PromptRepository[TKey]>
}

export function createMockDraftRepository(): MockedDraftRepository {
  return {
    autosaveDraft:
      vi.fn<
        (
          draftId: number,
          input: { content?: DraftContent; title?: string }
        ) => Promise<AutosaveDraftResult>
      >(),
    createDraft:
      vi.fn<
        (input: CreateDraftInput) => ReturnType<DraftRepository["createDraft"]>
      >(),
    deleteDraft: vi.fn<(draftId: number) => Promise<void>>(),
    getDraft:
      vi.fn<(draftId: number) => ReturnType<DraftRepository["getDraft"]>>(),
    getPrompt:
      vi.fn<(promptId: number) => ReturnType<DraftRepository["getPrompt"]>>(),
    listDrafts: vi.fn<() => ReturnType<DraftRepository["listDrafts"]>>(),
  }
}

export function createMockHomeRepository(): MockedHomeRepository {
  return {
    getHome: vi.fn<() => ReturnType<HomeRepository["getHome"]>>(),
  }
}

export function createMockPromptRepository(): MockedPromptRepository {
  return {
    createDraft:
      vi.fn<
        (input: CreateDraftInput) => ReturnType<PromptRepository["createDraft"]>
      >(),
    getPrompt:
      vi.fn<(promptId: number) => ReturnType<PromptRepository["getPrompt"]>>(),
    listPrompts:
      vi.fn<
        (filters?: PromptFilters) => ReturnType<PromptRepository["listPrompts"]>
      >(),
    savePrompt:
      vi.fn<(promptId: number) => ReturnType<PromptRepository["savePrompt"]>>(),
    unsavePrompt: vi.fn<(promptId: number) => Promise<void>>(),
  }
}
