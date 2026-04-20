import { asFunction, type AwilixContainer } from "awilix"
import {
  makeGetJourneyUseCase,
  makeListJourneysUseCase,
} from "@workspace/core/modules/journeys"
import {
  makeEnrollJourneyUseCase,
  makeListCompletedJourneysUseCase,
  makeListUserJourneysUseCase,
} from "@workspace/core/modules/progress"

import type { ApiCradle } from "../../container"

export type ListJourneysUseCase = ReturnType<typeof makeListJourneysUseCase>
export type GetJourneyUseCase = ReturnType<typeof makeGetJourneyUseCase>
export type EnrollJourneyUseCase = ReturnType<typeof makeEnrollJourneyUseCase>
export type ListCompletedJourneysUseCase = ReturnType<
  typeof makeListCompletedJourneysUseCase
>
export type ListUserJourneysUseCase = ReturnType<
  typeof makeListUserJourneysUseCase
>

export const JOURNEY_USE_CASE_KEYS = [
  "listJourneysUseCase",
  "listUserJourneysUseCase",
  "getJourneyUseCase",
  "enrollJourneyUseCase",
  "listCompletedJourneysUseCase",
] as const satisfies readonly (keyof ApiCradle)[]

export function registerJourneyUseCases(container: AwilixContainer<ApiCradle>) {
  container.register({
    listJourneysUseCase: asFunction(({ journeyRepository }: ApiCradle) =>
      makeListJourneysUseCase({ journeyRepository })
    ).singleton(),

    getJourneyUseCase: asFunction(
      ({ journeyRepository, progressRepository }: ApiCradle) =>
        makeGetJourneyUseCase({ journeyRepository, progressRepository })
    ).singleton(),

    enrollJourneyUseCase: asFunction(
      ({ progressRepository, transactionManager }: ApiCradle) =>
        makeEnrollJourneyUseCase({ progressRepository, transactionManager })
    ).singleton(),

    listCompletedJourneysUseCase: asFunction(
      ({ progressRepository }: ApiCradle) =>
        makeListCompletedJourneysUseCase({
          progressRepository,
        })
    ).singleton(),

    listUserJourneysUseCase: asFunction(({ progressRepository }: ApiCradle) =>
      makeListUserJourneysUseCase({
        progressRepository,
      })
    ).singleton(),
  })
}
