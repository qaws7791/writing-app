import { asFunction, type AwilixContainer } from "awilix"
import {
  makeBookmarkPromptUseCase,
  makeGetPromptUseCase,
  makeListPromptsUseCase,
  makeUnbookmarkPromptUseCase,
} from "@workspace/core/modules/prompts"
import { makeListPromptWritingsUseCase } from "@workspace/core/modules/writings"

import type { AppVariables } from "../../app-env"
import { createToken } from "../../lib/injection-token"
import type { ApiCradle } from "../container"

export const BookmarkPromptUseCase = createToken<
  AppVariables["bookmarkPromptUseCase"]
>("bookmarkPromptUseCase")
export const GetPromptUseCase =
  createToken<AppVariables["getPromptUseCase"]>("getPromptUseCase")
export const ListPromptWritingsUseCase = createToken<
  AppVariables["listPromptWritingsUseCase"]
>("listPromptWritingsUseCase")
export const ListPromptsUseCase =
  createToken<AppVariables["listPromptsUseCase"]>("listPromptsUseCase")
export const UnbookmarkPromptUseCase = createToken<
  AppVariables["unbookmarkPromptUseCase"]
>("unbookmarkPromptUseCase")

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

export function registerPromptModule(container: AwilixContainer<ApiCradle>) {
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
