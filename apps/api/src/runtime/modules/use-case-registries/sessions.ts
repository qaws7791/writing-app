import { asFunction, type AwilixContainer } from "awilix"
import {
  makeCompleteSessionUseCase,
  makeGetSessionRuntimeUseCase,
  makeRetrySessionStepAiUseCase,
  makeStartSessionUseCase,
  makeSubmitStepUseCase,
} from "@workspace/core/modules/progress"

import type { ApiCradle } from "../../container"

export type GetSessionDetailUseCase = ReturnType<
  typeof makeGetSessionRuntimeUseCase
>
export type StartSessionUseCase = ReturnType<typeof makeStartSessionUseCase>
export type SubmitStepUseCase = ReturnType<typeof makeSubmitStepUseCase>
export type RetrySessionStepAiUseCase = ReturnType<
  typeof makeRetrySessionStepAiUseCase
>
export type CompleteSessionUseCase = ReturnType<
  typeof makeCompleteSessionUseCase
>

export const SESSION_USE_CASE_KEYS = [
  "getSessionDetailUseCase",
  "startSessionUseCase",
  "submitStepUseCase",
  "retrySessionStepAiUseCase",
  "completeSessionUseCase",
] as const satisfies readonly (keyof ApiCradle)[]

export function registerSessionUseCases(container: AwilixContainer<ApiCradle>) {
  container.register({
    getSessionDetailUseCase: asFunction(
      ({ journeyRepository, progressRepository }: ApiCradle) =>
        makeGetSessionRuntimeUseCase({
          journeyRepository,
          progressRepository,
        })
    ).singleton(),

    startSessionUseCase: asFunction(
      ({ progressRepository, journeyRepository }: ApiCradle) =>
        makeStartSessionUseCase({
          progressRepository,
          journeyRepository,
        })
    ).singleton(),

    submitStepUseCase: asFunction(
      ({
        progressRepository,
        journeyRepository,
        transactionManager,
      }: ApiCradle) =>
        makeSubmitStepUseCase({
          progressRepository,
          journeyRepository,
          transactionManager,
        })
    ).singleton(),

    retrySessionStepAiUseCase: asFunction(
      ({ progressRepository, journeyRepository }: ApiCradle) =>
        makeRetrySessionStepAiUseCase({
          progressRepository,
          journeyRepository,
        })
    ).singleton(),

    completeSessionUseCase: asFunction(
      ({ progressRepository, transactionManager }: ApiCradle) =>
        makeCompleteSessionUseCase({ progressRepository, transactionManager })
    ).singleton(),
  })
}
