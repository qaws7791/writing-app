import { asFunction, asValue, type AwilixContainer } from "awilix"
import {
  makeCompareRevisionsUseCase,
  makeGenerateFeedbackUseCase,
} from "@workspace/core"

import { createAiCoachingGateway } from "../../../services/ai-services"
import type { ApiCradle } from "../../container"

export type GenerateFeedbackUseCase = ReturnType<
  typeof makeGenerateFeedbackUseCase
>
export type CompareRevisionsUseCase = ReturnType<
  typeof makeCompareRevisionsUseCase
>

export const AI_USE_CASE_KEYS = [
  "generateFeedbackUseCase",
  "compareRevisionsUseCase",
] as const satisfies readonly (keyof ApiCradle)[]

export function registerAiUseCases(container: AwilixContainer<ApiCradle>) {
  container.register({
    aiCoachingGateway: asValue(createAiCoachingGateway()),

    generateFeedbackUseCase: asFunction(({ aiCoachingGateway }: ApiCradle) =>
      makeGenerateFeedbackUseCase({ aiCoachingGateway })
    ).singleton(),

    compareRevisionsUseCase: asFunction(({ aiCoachingGateway }: ApiCradle) =>
      makeCompareRevisionsUseCase({ aiCoachingGateway })
    ).singleton(),
  })
}
