import { asFunction, asValue, type AwilixContainer } from "awilix"
import {
  makeCompareRevisionsUseCase,
  makeGenerateFeedbackUseCase,
} from "@workspace/core/modules/ai-feedback"

import type { AppVariables } from "../../app-env"
import { createToken } from "../../lib/injection-token"
import { createAiCoachingGateway } from "../../services/ai-services"
import type { ApiCradle } from "../container"

export const GenerateFeedbackUseCase = createToken<
  AppVariables["generateFeedbackUseCase"]
>("generateFeedbackUseCase")

export const CompareRevisionsUseCase = createToken<
  AppVariables["compareRevisionsUseCase"]
>("compareRevisionsUseCase")

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

export function registerAiModule(container: AwilixContainer<ApiCradle>) {
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
