import type { AppVariables } from "../../app-env"
import { createToken } from "../../lib/injection-token"

export const AutosaveWritingUseCase = createToken<
  AppVariables["autosaveWritingUseCase"]
>("autosaveWritingUseCase")
export const CreateWritingUseCase = createToken<
  AppVariables["createWritingUseCase"]
>("createWritingUseCase")
export const DeleteWritingUseCase = createToken<
  AppVariables["deleteWritingUseCase"]
>("deleteWritingUseCase")
export const GetWritingUseCase =
  createToken<AppVariables["getWritingUseCase"]>("getWritingUseCase")
export const ListWritingsUseCase = createToken<
  AppVariables["listWritingsUseCase"]
>("listWritingsUseCase")
