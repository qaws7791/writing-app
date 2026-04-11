import { asFunction, asValue, type AwilixContainer } from "awilix"
import {
  makeAutosaveWritingUseCase,
  makeGetSessionRuntimeUseCase,
  makeCreateWritingUseCase,
  makeDeleteWritingUseCase,
  makeGetWritingUseCase,
  makeListWritingsUseCase,
  makeListPromptWritingsUseCase,
  makeGetPromptUseCase,
  makeListPromptsUseCase,
  makeBookmarkPromptUseCase,
  makeUnbookmarkPromptUseCase,
  makeGetHomeUseCase,
  makeListJourneysUseCase,
  makeGetJourneyUseCase,
  makeEnrollJourneyUseCase,
  makeStartSessionUseCase,
  makeSubmitStepUseCase,
  makeRetrySessionStepAiUseCase,
  makeCompleteSessionUseCase,
  makeGenerateFeedbackUseCase,
  makeCompareRevisionsUseCase,
  makeListCompletedJourneysUseCase,
  makeListUserJourneysUseCase,
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

export type ListPromptWritingsUseCase = ReturnType<
  typeof makeListPromptWritingsUseCase
>

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
  typeof makeGetSessionRuntimeUseCase
>

export type EnrollJourneyUseCase = ReturnType<typeof makeEnrollJourneyUseCase>
export type StartSessionUseCase = ReturnType<typeof makeStartSessionUseCase>
export type SubmitStepUseCase = ReturnType<typeof makeSubmitStepUseCase>
export type RetrySessionStepAiUseCase = ReturnType<
  typeof makeRetrySessionStepAiUseCase
>
export type CompleteSessionUseCase = ReturnType<
  typeof makeCompleteSessionUseCase
>

export type GenerateFeedbackUseCase = ReturnType<
  typeof makeGenerateFeedbackUseCase
>
export type CompareRevisionsUseCase = ReturnType<
  typeof makeCompareRevisionsUseCase
>

export type ListCompletedJourneysUseCase = ReturnType<
  typeof makeListCompletedJourneysUseCase
>

export type ListUserJourneysUseCase = ReturnType<
  typeof makeListUserJourneysUseCase
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

    listPromptWritingsUseCase: asFunction(({ writingRepository }: ApiCradle) =>
      makeListPromptWritingsUseCase({ writingRepository })
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
      ({ progressRepository, journeyRepository }: ApiCradle) =>
        makeGetHomeUseCase({
          progressRepository,
          journeyRepository,
        })
    ).singleton(),

    // --- Journeys ---

    listJourneysUseCase: asFunction(({ journeyRepository }: ApiCradle) =>
      makeListJourneysUseCase({ journeyRepository })
    ).singleton(),

    getJourneyUseCase: asFunction(
      ({ journeyRepository, progressRepository }: ApiCradle) =>
        makeGetJourneyUseCase({ journeyRepository, progressRepository })
    ).singleton(),

    getSessionDetailUseCase: asFunction(
      ({ journeyRepository, progressRepository }: ApiCradle) =>
        makeGetSessionRuntimeUseCase({
          journeyRepository,
          progressRepository,
        })
    ).singleton(),

    // --- Progress ---

    enrollJourneyUseCase: asFunction(({ progressRepository }: ApiCradle) =>
      makeEnrollJourneyUseCase({ progressRepository })
    ).singleton(),

    startSessionUseCase: asFunction(
      ({ progressRepository, journeyRepository }: ApiCradle) =>
        makeStartSessionUseCase({
          progressRepository,
          journeyRepository,
        })
    ).singleton(),

    submitStepUseCase: asFunction(
      ({ progressRepository, journeyRepository }: ApiCradle) =>
        makeSubmitStepUseCase({
          progressRepository,
          journeyRepository,
        })
    ).singleton(),

    retrySessionStepAiUseCase: asFunction(
      ({ progressRepository, journeyRepository }: ApiCradle) =>
        makeRetrySessionStepAiUseCase({
          progressRepository,
          journeyRepository,
        })
    ).singleton(),

    completeSessionUseCase: asFunction(({ progressRepository }: ApiCradle) =>
      makeCompleteSessionUseCase({ progressRepository })
    ).singleton(),

    listCompletedJourneysUseCase: asFunction(
      ({ progressRepository, journeyRepository }: ApiCradle) =>
        makeListCompletedJourneysUseCase({
          progressRepository,
          journeyRepository,
        })
    ).singleton(),

    listUserJourneysUseCase: asFunction(
      ({ progressRepository, journeyRepository }: ApiCradle) =>
        makeListUserJourneysUseCase({
          progressRepository,
          journeyRepository,
        })
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
