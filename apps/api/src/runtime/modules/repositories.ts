import { asFunction, type AwilixContainer } from "awilix"
import {
  createJourneyRepository,
  createProgressRepository,
  createWritingPromptRepository,
  createWritingRepository,
} from "@workspace/database"

import type { ApiCradle } from "../container"

export function registerRepositories(container: AwilixContainer<ApiCradle>) {
  container.register({
    promptRepository: asFunction(({ database }: ApiCradle) =>
      createWritingPromptRepository(database.db)
    ).singleton(),

    writingRepository: asFunction(({ database }: ApiCradle) =>
      createWritingRepository(database.db)
    ).singleton(),

    journeyRepository: asFunction(({ database }: ApiCradle) =>
      createJourneyRepository(database.db)
    ).singleton(),

    progressRepository: asFunction(({ database }: ApiCradle) =>
      createProgressRepository(database.db)
    ).singleton(),
  })
}
