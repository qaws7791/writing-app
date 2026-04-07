import { asFunction, asValue, type AwilixContainer } from "awilix"
import {
  makeAutosaveWritingUseCase,
  makeCreateWritingUseCase,
  makeDeleteWritingUseCase,
  makeGetWritingUseCase,
  makeListWritingsUseCase,
  makeGetPromptUseCase,
  makeListPromptsUseCase,
  makeBookmarkPromptUseCase,
  makeUnbookmarkPromptUseCase,
  makeGetHomeUseCase,
  makeListJourneysUseCase,
  makeGetJourneyUseCase,
  makeGetSessionDetailUseCase,
  makeEnrollJourneyUseCase,
  makeStartSessionUseCase,
  makeSubmitStepUseCase,
  makeCompleteSessionUseCase,
  makeGenerateFeedbackUseCase,
  makeCompareRevisionsUseCase,
} from "@workspace/core"

import { createAiCoachingGateway } from "../../services/ai-services"
import type { ApiCradle } from "../container"

export type AutosaveWritingUseCase = ReturnType<
  typeof makeAutosaveWritingUseCase
>
export type CreateWritingUseCase = ReturnType<typeof makeCreateWritingUseCase>
export type DeleteWritingUseCase = ReturnType<typeof makeDeleteWritingUseCase>
export type GetWritingUseCase = ReturnType<typeof makeGetWritingUseCase>
export type ListWritingsUseCase = ReturnType<typeof makeListWritingsUseCase>

export type GetPromptUseCase = ReturnType<typeof makeGetPromptUseCase>
export type ListPromptsUseCase = ReturnType<typeof makeListPromptsUseCase>
export type BookmarkPromptUseCase = ReturnType<typeof makeBookmarkPromptUseCase>
export type UnbookmarkPromptUseCase = ReturnType<
  typeof makeUnbookmarkPromptUseCase
>

export type GetHomeUseCase = ReturnType<typeof makeGetHomeUseCase>

export type ListJourneysUseCase = ReturnType<typeof makeListJourneysUseCase>
export type GetJourneyUseCase = ReturnType<typeof makeGetJourneyUseCase>
export type GetSessionDetailUseCase = ReturnType<
  typeof makeGetSessionDetailUseCase
>

export type EnrollJourneyUseCase = ReturnType<typeof makeEnrollJourneyUseCase>
export type StartSessionUseCase = ReturnType<typeof makeStartSessionUseCase>
export type SubmitStepUseCase = ReturnType<typeof makeSubmitStepUseCase>
export type CompleteSessionUseCase = ReturnType<
  typeof makeCompleteSessionUseCase
>

export type GenerateFeedbackUseCase = ReturnType<
  typeof makeGenerateFeedbackUseCase
>
export type CompareRevisionsUseCase = ReturnType<
  typeof makeCompareRevisionsUseCase
>

export function registerUseCases(container: AwilixContainer<ApiCradle>) {
  container.register({
    // --- AI Coaching Gateway ---

    aiCoachingGateway: asValue(createAiCoachingGateway()),

    // --- Writing ---

    createWritingUseCase: asFunction(({ writingRepository }: ApiCradle) =>
      makeCreateWritingUseCase({ writingRepository })
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

    // --- Prompt ---

    getPromptUseCase: asFunction(({ promptRepository }: ApiCradle) =>
      makeGetPromptUseCase({ promptRepository })
    ).singleton(),

    listPromptsUseCase: asFunction(({ promptRepository }: ApiCradle) =>
      makeListPromptsUseCase({ promptRepository })
    ).singleton(),

    bookmarkPromptUseCase: asFunction(({ promptRepository }: ApiCradle) =>
      makeBookmarkPromptUseCase({ promptRepository })
    ).singleton(),

    unbookmarkPromptUseCase: asFunction(({ promptRepository }: ApiCradle) =>
      makeUnbookmarkPromptUseCase({ promptRepository })
    ).singleton(),

    // --- Home ---

    getHomeUseCase: asFunction(
      ({
        promptRepository,
        progressRepository,
        journeyRepository,
      }: ApiCradle) =>
        makeGetHomeUseCase({
          promptRepository,
          progressRepository,
          journeyRepository,
        })
    ).singleton(),

    // --- Journeys ---

    listJourneysUseCase: asFunction(({ journeyRepository }: ApiCradle) =>
      makeListJourneysUseCase({ journeyRepository })
    ).singleton(),

    getJourneyUseCase: asFunction(({ journeyRepository }: ApiCradle) =>
      makeGetJourneyUseCase({ journeyRepository })
    ).singleton(),

    getSessionDetailUseCase: asFunction(({ journeyRepository }: ApiCradle) =>
      makeGetSessionDetailUseCase({ journeyRepository })
    ).singleton(),

    // --- Progress ---

    enrollJourneyUseCase: asFunction(({ progressRepository }: ApiCradle) =>
      makeEnrollJourneyUseCase({ progressRepository })
    ).singleton(),

    startSessionUseCase: asFunction(({ progressRepository }: ApiCradle) =>
      makeStartSessionUseCase({ progressRepository })
    ).singleton(),

    submitStepUseCase: asFunction(({ progressRepository }: ApiCradle) =>
      makeSubmitStepUseCase({ progressRepository })
    ).singleton(),

    completeSessionUseCase: asFunction(({ progressRepository }: ApiCradle) =>
      makeCompleteSessionUseCase({ progressRepository })
    ).singleton(),

    // --- AI Feedback ---

    generateFeedbackUseCase: asFunction(({ aiCoachingGateway }: ApiCradle) =>
      makeGenerateFeedbackUseCase({ aiCoachingGateway })
    ).singleton(),

    compareRevisionsUseCase: asFunction(({ aiCoachingGateway }: ApiCradle) =>
      makeCompareRevisionsUseCase({ aiCoachingGateway })
    ).singleton(),
  })
}
