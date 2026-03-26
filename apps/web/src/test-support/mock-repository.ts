import { vi, type Mock } from "vitest"

import type { WritingContent } from "@/domain/writing"
import type { PromptFilters } from "@/domain/prompt"
import type {
  AutosaveWritingResult,
  CreateWritingInput,
  WritingRepository,
} from "@/features/writing/repositories/writing-repository"
import type { HomeRepository } from "@/features/home/repositories/home-repository"
import type { PromptRepository } from "@/features/prompt/repositories/prompt-repository"

type MockedWritingRepository = {
  [TKey in keyof WritingRepository]: Mock<WritingRepository[TKey]>
}

type MockedHomeRepository = {
  [TKey in keyof HomeRepository]: Mock<HomeRepository[TKey]>
}

type MockedPromptRepository = {
  [TKey in keyof PromptRepository]: Mock<PromptRepository[TKey]>
}

export function createMockWritingRepository(): MockedWritingRepository {
  return {
    autosaveWriting:
      vi.fn<
        (
          writingId: number,
          input: { content?: WritingContent; title?: string }
        ) => Promise<AutosaveWritingResult>
      >(),
    createWriting:
      vi.fn<
        (
          input: CreateWritingInput
        ) => ReturnType<WritingRepository["createWriting"]>
      >(),
    deleteWriting: vi.fn<(writingId: number) => Promise<void>>(),
    getWriting:
      vi.fn<
        (writingId: number) => ReturnType<WritingRepository["getWriting"]>
      >(),
    getPrompt:
      vi.fn<(promptId: number) => ReturnType<WritingRepository["getPrompt"]>>(),
    listWritings: vi.fn<() => ReturnType<WritingRepository["listWritings"]>>(),
  }
}

export function createMockHomeRepository(): MockedHomeRepository {
  return {
    getHome: vi.fn<() => ReturnType<HomeRepository["getHome"]>>(),
  }
}

export function createMockPromptRepository(): MockedPromptRepository {
  return {
    createWriting:
      vi.fn<
        (
          input: CreateWritingInput
        ) => ReturnType<PromptRepository["createWriting"]>
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
