import { asFunction, type AwilixContainer } from "awilix"
import {
  makeAutosaveWritingUseCase,
  makeCountWritingsUseCase,
  makeCreateWritingUseCase,
  makeDeleteWritingUseCase,
  makeGetWritingUseCase,
  makeListWritingsUseCase,
} from "@workspace/core/modules/writings"

import type { AppVariables } from "../../app-env"
import { createToken } from "../../lib/injection-token"
import type { ApiCradle } from "../container"

export const AutosaveWritingUseCase = createToken<
  AppVariables["autosaveWritingUseCase"]
>("autosaveWritingUseCase")
export const CountWritingsUseCase = createToken<
  AppVariables["countWritingsUseCase"]
>("countWritingsUseCase")
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

export type AutosaveWritingUseCase = ReturnType<
  typeof makeAutosaveWritingUseCase
>
export type CountWritingsUseCase = ReturnType<typeof makeCountWritingsUseCase>
export type CreateWritingUseCase = ReturnType<typeof makeCreateWritingUseCase>
export type DeleteWritingUseCase = ReturnType<typeof makeDeleteWritingUseCase>
export type GetWritingUseCase = ReturnType<typeof makeGetWritingUseCase>
export type ListWritingsUseCase = ReturnType<typeof makeListWritingsUseCase>

export const WRITING_USE_CASE_KEYS = [
  "autosaveWritingUseCase",
  "countWritingsUseCase",
  "createWritingUseCase",
  "deleteWritingUseCase",
  "getWritingUseCase",
  "listWritingsUseCase",
] as const satisfies readonly (keyof ApiCradle)[]

export function registerWritingModule(container: AwilixContainer<ApiCradle>) {
  container.register({
    countWritingsUseCase: asFunction(({ writingRepository }: ApiCradle) =>
      makeCountWritingsUseCase({ writingRepository })
    ).singleton(),

    createWritingUseCase: asFunction(
      ({ writingRepository, transactionManager }: ApiCradle) =>
        makeCreateWritingUseCase({ writingRepository, transactionManager })
    ).singleton(),

    autosaveWritingUseCase: asFunction(({ writingRepository }: ApiCradle) =>
      makeAutosaveWritingUseCase({ writingRepository })
    ).singleton(),

    deleteWritingUseCase: asFunction(({ writingRepository }: ApiCradle) =>
      makeDeleteWritingUseCase({ writingRepository })
    ).singleton(),

    getWritingUseCase: asFunction(({ writingRepository }: ApiCradle) =>
      makeGetWritingUseCase({ writingRepository })
    ).singleton(),

    listWritingsUseCase: asFunction(({ writingRepository }: ApiCradle) =>
      makeListWritingsUseCase({ writingRepository })
    ).singleton(),
  })
}
