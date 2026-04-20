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

import type { AppVariables } from "../../app-env"
import { createToken } from "../../lib/injection-token"
import type { ApiCradle } from "../container"

export const EnrollJourneyUseCase = createToken<
  AppVariables["enrollJourneyUseCase"]
>("enrollJourneyUseCase")
export const GetJourneyUseCase =
  createToken<AppVariables["getJourneyUseCase"]>("getJourneyUseCase")
export const ListCompletedJourneysUseCase = createToken<
  AppVariables["listCompletedJourneysUseCase"]
>("listCompletedJourneysUseCase")
export const ListJourneysUseCase = createToken<
  AppVariables["listJourneysUseCase"]
>("listJourneysUseCase")
export const ListUserJourneysUseCase = createToken<
  AppVariables["listUserJourneysUseCase"]
>("listUserJourneysUseCase")

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

export function registerJourneyModule(container: AwilixContainer<ApiCradle>) {
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
