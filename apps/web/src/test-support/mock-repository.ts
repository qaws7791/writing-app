import { vi, type Mock } from "vitest"

import type { DraftContent } from "@/domain/draft"
import type {
  AutosaveDraftResult,
  CreateDraftInput,
  AppRepository,
} from "@/features/writing/repositories/app-repository"

type MockedRepository = {
  [TKey in keyof AppRepository]: Mock<AppRepository[TKey]>
}

export function createMockRepository(): MockedRepository {
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
        (input: CreateDraftInput) => ReturnType<AppRepository["createDraft"]>
      >(),
    deleteDraft: vi.fn<(draftId: number) => Promise<void>>(),
    getDraft:
      vi.fn<(draftId: number) => ReturnType<AppRepository["getDraft"]>>(),
    getHome: vi.fn<() => ReturnType<AppRepository["getHome"]>>(),
    getPrompt:
      vi.fn<(promptId: number) => ReturnType<AppRepository["getPrompt"]>>(),
    listDrafts: vi.fn<() => ReturnType<AppRepository["listDrafts"]>>(),
    listPrompts:
      vi.fn<
        (
          filters?: Parameters<AppRepository["listPrompts"]>[0]
        ) => ReturnType<AppRepository["listPrompts"]>
      >(),
    savePrompt:
      vi.fn<(promptId: number) => ReturnType<AppRepository["savePrompt"]>>(),
    unsavePrompt: vi.fn<(promptId: number) => Promise<void>>(),
  }
}
