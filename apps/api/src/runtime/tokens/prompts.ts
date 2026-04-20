import type { AppVariables } from "../../app-env"
import { createToken } from "../../lib/injection-token"

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
