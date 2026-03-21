import { vi, type Mock } from "vitest"

import type { DraftContent } from "@/lib/phase-one-types"
import type {
  AutosaveDraftResult,
  CreateDraftInput,
  PhaseOneRepository,
} from "@/lib/phase-one-repository"

type MockedPhaseOneRepository = {
  [TKey in keyof PhaseOneRepository]: Mock<PhaseOneRepository[TKey]>
}

export function createMockPhaseOneRepository(): MockedPhaseOneRepository {
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
        (
          input: CreateDraftInput
        ) => ReturnType<PhaseOneRepository["createDraft"]>
      >(),
    deleteDraft: vi.fn<(draftId: number) => Promise<void>>(),
    getDraft:
      vi.fn<(draftId: number) => ReturnType<PhaseOneRepository["getDraft"]>>(),
    getHome: vi.fn<() => ReturnType<PhaseOneRepository["getHome"]>>(),
    getPrompt:
      vi.fn<
        (promptId: number) => ReturnType<PhaseOneRepository["getPrompt"]>
      >(),
    listDrafts: vi.fn<() => ReturnType<PhaseOneRepository["listDrafts"]>>(),
    listPrompts:
      vi.fn<
        (
          filters?: Parameters<PhaseOneRepository["listPrompts"]>[0]
        ) => ReturnType<PhaseOneRepository["listPrompts"]>
      >(),
    savePrompt:
      vi.fn<
        (promptId: number) => ReturnType<PhaseOneRepository["savePrompt"]>
      >(),
    unsavePrompt: vi.fn<(promptId: number) => Promise<void>>(),
  }
}
