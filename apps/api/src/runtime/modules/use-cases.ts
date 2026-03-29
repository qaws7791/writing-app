import { asFunction, type AwilixContainer } from "awilix"
import {
  makeAutosaveWritingUseCase,
  makeCreateWritingUseCase,
  makeDeleteWritingUseCase,
  makeGetVersionUseCase,
  makeGetWritingUseCase,
  makeListVersionsUseCase,
  makeListWritingsUseCase,
  makePullDocumentUseCase,
  makePushTransactionsUseCase,
} from "@workspace/core/modules/writings"
import {
  makeGetPromptUseCase,
  makeListPromptsUseCase,
  makeSavePromptUseCase,
  makeUnsavePromptUseCase,
  makeGetHomeUseCase,
} from "@workspace/core"

import { createAIApiService } from "../../services/ai-services"
import type { ApiCradle } from "../container"

export type AutosaveWritingUseCase = ReturnType<
  typeof makeAutosaveWritingUseCase
>
export type CreateWritingUseCase = ReturnType<typeof makeCreateWritingUseCase>
export type DeleteWritingUseCase = ReturnType<typeof makeDeleteWritingUseCase>
export type GetVersionUseCase = ReturnType<typeof makeGetVersionUseCase>
export type GetWritingUseCase = ReturnType<typeof makeGetWritingUseCase>
export type ListVersionsUseCase = ReturnType<typeof makeListVersionsUseCase>
export type ListWritingsUseCase = ReturnType<typeof makeListWritingsUseCase>
export type PullDocumentUseCase = ReturnType<typeof makePullDocumentUseCase>
export type PushTransactionsUseCase = ReturnType<
  typeof makePushTransactionsUseCase
>

export type GetPromptUseCase = ReturnType<typeof makeGetPromptUseCase>
export type ListPromptsUseCase = ReturnType<typeof makeListPromptsUseCase>
export type SavePromptUseCase = ReturnType<typeof makeSavePromptUseCase>
export type UnsavePromptUseCase = ReturnType<typeof makeUnsavePromptUseCase>

export type GetHomeUseCase = ReturnType<typeof makeGetHomeUseCase>

export function registerUseCases(container: AwilixContainer<ApiCradle>) {
  container.register({
    // --- AI ---

    aiUseCases: asFunction(({ aiRequestRepository, logger }: ApiCradle) =>
      createAIApiService({
        aiRequestRepository,
        logger: logger.child({ scope: "ai-services" }),
      })
    ).singleton(),

    // --- Writing ---

    createWritingUseCase: asFunction(
      ({ writingRepository, promptRepository }: ApiCradle) =>
        makeCreateWritingUseCase({
          writingRepository,
          promptExists: (id) => promptRepository.exists(id),
        })
    ).singleton(),

    autosaveWritingUseCase: asFunction(({ writingRepository }: ApiCradle) =>
      makeAutosaveWritingUseCase({
        writingRepository,
        getNow: () => new Date().toISOString(),
      })
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

    // --- Sync ---

    pushTransactionsUseCase: asFunction(
      ({ writingSyncRepository, writingSyncWriter }: ApiCradle) =>
        makePushTransactionsUseCase({
          writingRepository: writingSyncRepository,
          syncWriter: writingSyncWriter,
          getNow: () => new Date().toISOString(),
        })
    ).singleton(),

    pullDocumentUseCase: asFunction(({ writingSyncRepository }: ApiCradle) =>
      makePullDocumentUseCase({ writingRepository: writingSyncRepository })
    ).singleton(),

    listVersionsUseCase: asFunction(
      ({ writingSyncRepository, writingVersionRepository }: ApiCradle) =>
        makeListVersionsUseCase({
          writingRepository: writingSyncRepository,
          versionRepository: writingVersionRepository,
        })
    ).singleton(),

    getVersionUseCase: asFunction(
      ({ writingSyncRepository, writingVersionRepository }: ApiCradle) =>
        makeGetVersionUseCase({
          writingRepository: writingSyncRepository,
          versionRepository: writingVersionRepository,
        })
    ).singleton(),

    // --- Prompt ---

    getPromptUseCase: asFunction(({ promptRepository }: ApiCradle) =>
      makeGetPromptUseCase({ promptRepository })
    ).singleton(),

    listPromptsUseCase: asFunction(({ promptRepository }: ApiCradle) =>
      makeListPromptsUseCase({ promptRepository })
    ).singleton(),

    savePromptUseCase: asFunction(({ promptRepository }: ApiCradle) =>
      makeSavePromptUseCase({ promptRepository })
    ).singleton(),

    unsavePromptUseCase: asFunction(({ promptRepository }: ApiCradle) =>
      makeUnsavePromptUseCase({ promptRepository })
    ).singleton(),

    // --- Home ---

    getHomeUseCase: asFunction(
      ({
        dailyRecommendationRepository,
        writingRepository,
        promptRepository,
      }: ApiCradle) =>
        makeGetHomeUseCase({
          dailyRecommendationRepository,
          writingRepository,
          promptRepository,
        })
    ).singleton(),
  })
}
