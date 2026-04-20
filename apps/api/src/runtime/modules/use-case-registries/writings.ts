import { asFunction, type AwilixContainer } from "awilix"
import {
  makeAutosaveWritingUseCase,
  makeCreateWritingUseCase,
  makeDeleteWritingUseCase,
  makeGetWritingUseCase,
  makeListWritingsUseCase,
} from "@workspace/core/modules/writings"

import type { ApiCradle } from "../../container"

export type AutosaveWritingUseCase = ReturnType<
  typeof makeAutosaveWritingUseCase
>
export type CreateWritingUseCase = ReturnType<typeof makeCreateWritingUseCase>
export type DeleteWritingUseCase = ReturnType<typeof makeDeleteWritingUseCase>
export type GetWritingUseCase = ReturnType<typeof makeGetWritingUseCase>
export type ListWritingsUseCase = ReturnType<typeof makeListWritingsUseCase>

export const WRITING_USE_CASE_KEYS = [
  "autosaveWritingUseCase",
  "createWritingUseCase",
  "deleteWritingUseCase",
  "getWritingUseCase",
  "listWritingsUseCase",
] as const satisfies readonly (keyof ApiCradle)[]

export function registerWritingUseCases(container: AwilixContainer<ApiCradle>) {
  container.register({
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
