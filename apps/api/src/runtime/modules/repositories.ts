import { asFunction, type AwilixContainer } from "awilix"
import {
  createAIRequestRepository,
  createDailyRecommendationRepository,
  createPromptRepository,
  createWritingRepository,
  createWritingSyncRepository,
  createWritingSyncWriter,
  createWritingTransactionRepository,
  createWritingVersionRepository,
} from "@workspace/database"

import type { ApiCradle } from "../container"

export function registerRepositories(container: AwilixContainer<ApiCradle>) {
  container.register({
    aiRequestRepository: asFunction(({ database }: ApiCradle) =>
      createAIRequestRepository(database.db)
    ).singleton(),

    dailyRecommendationRepository: asFunction(({ database }: ApiCradle) =>
      createDailyRecommendationRepository(database.db)
    ).singleton(),

    promptRepository: asFunction(({ database }: ApiCradle) =>
      createPromptRepository(database.db)
    ).singleton(),

    writingRepository: asFunction(({ database }: ApiCradle) =>
      createWritingRepository(database.db)
    ).singleton(),

    writingSyncRepository: asFunction(({ database }: ApiCradle) =>
      createWritingSyncRepository(database.db)
    ).singleton(),

    writingSyncWriter: asFunction(({ database }: ApiCradle) =>
      createWritingSyncWriter(database.db)
    ).singleton(),

    writingTransactionRepository: asFunction(({ database }: ApiCradle) =>
      createWritingTransactionRepository(database.db)
    ).singleton(),

    writingVersionRepository: asFunction(({ database }: ApiCradle) =>
      createWritingVersionRepository(database.db)
    ).singleton(),
  })
}
