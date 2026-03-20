import { vi } from "vitest"

import type {
  DraftContent,
  DraftDetail,
  DraftSummary,
  HomeSnapshot,
  PromptDetail,
  PromptFilters,
  PromptSummary,
} from "@/lib/phase-one-types"

export function createMockPhaseOneRepository() {
  return {
    autosaveDraft:
      vi.fn<
        (
          draftId: number,
          input: { content?: DraftContent; title?: string }
        ) => Promise<{ draft: DraftDetail; kind: "autosaved" }>
      >(),
    createDraft:
      vi.fn<
        (input: {
          content?: DraftContent
          sourcePromptId?: number
          title?: string
        }) => Promise<DraftDetail>
      >(),
    deleteDraft: vi.fn<(draftId: number) => Promise<void>>(),
    getDraft: vi.fn<(draftId: number) => Promise<DraftDetail>>(),
    getHome: vi.fn<() => Promise<HomeSnapshot>>(),
    getPrompt: vi.fn<(promptId: number) => Promise<PromptDetail>>(),
    listDrafts: vi.fn<() => Promise<DraftSummary[]>>(),
    listPrompts: vi.fn<(filters?: PromptFilters) => Promise<PromptSummary[]>>(),
    savePrompt:
      vi.fn<
        (promptId: number) => Promise<{ kind: "saved"; savedAt: string }>
      >(),
    unsavePrompt: vi.fn<(promptId: number) => Promise<void>>(),
  }
}
