import { asFunction, type AwilixContainer } from "awilix"
import {
  makeBookmarkPromptUseCase,
  makeGetPromptUseCase,
  makeListPromptWritingsUseCase,
  makeListPromptsUseCase,
  makeUnbookmarkPromptUseCase,
} from "@workspace/core"

import type { ApiCradle } from "../../container"

export type GetPromptUseCase = ReturnType<typeof makeGetPromptUseCase>
export type ListPromptsUseCase = ReturnType<typeof makeListPromptsUseCase>
export type BookmarkPromptUseCase = ReturnType<typeof makeBookmarkPromptUseCase>
export type UnbookmarkPromptUseCase = ReturnType<
  typeof makeUnbookmarkPromptUseCase
>
export type ListPromptWritingsUseCase = ReturnType<
  typeof makeListPromptWritingsUseCase
>

export const PROMPT_USE_CASE_KEYS = [
  "getPromptUseCase",
  "listPromptsUseCase",
  "listPromptWritingsUseCase",
  "bookmarkPromptUseCase",
  "unbookmarkPromptUseCase",
] as const satisfies readonly (keyof ApiCradle)[]

export function registerPromptUseCases(container: AwilixContainer<ApiCradle>) {
  container.register({
    getPromptUseCase: asFunction(({ promptRepository }: ApiCradle) =>
      makeGetPromptUseCase({ promptRepository })
    ).singleton(),

    listPromptsUseCase: asFunction(({ promptRepository }: ApiCradle) =>
      makeListPromptsUseCase({ promptRepository })
    ).singleton(),

    listPromptWritingsUseCase: asFunction(({ writingRepository }: ApiCradle) =>
      makeListPromptWritingsUseCase({ writingRepository })
    ).singleton(),

    bookmarkPromptUseCase: asFunction(({ promptRepository }: ApiCradle) =>
      makeBookmarkPromptUseCase({ promptRepository })
    ).singleton(),

    unbookmarkPromptUseCase: asFunction(({ promptRepository }: ApiCradle) =>
      makeUnbookmarkPromptUseCase({ promptRepository })
    ).singleton(),
  })
}
