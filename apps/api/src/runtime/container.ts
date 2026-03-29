import {
  createContainer,
  asFunction,
  InjectionMode,
  type AwilixContainer,
} from "awilix"
import {
  createAIRequestRepository,
  createDailyRecommendationRepository,
  createWritingRepository,
  createPromptRepository,
  createWritingSyncRepository,
  createWritingSyncWriter,
  createWritingTransactionRepository,
  createWritingVersionRepository,
  openDb,
} from "@workspace/database"

import { createAIApiService, type AIApiService } from "../services/ai-services"
import {
  createWritingApiService,
  createWritingSyncApiService,
  type WritingApiService,
  type WritingSyncApiService,
} from "../services/writing-services"
import {
  createHomeApiService,
  createPromptApiService,
  type HomeApiService,
  type PromptApiService,
} from "../services/prompt-services"
import { createAuth } from "../auth/auth"
import { createDevEmailInbox, type EmailSender } from "../auth/auth-email"
import type { ApiLogger } from "../observability/logger"
import type { ApiEnvironment } from "./bootstrap"
import { registerInfrastructure } from "./modules/infrastructure"
import { registerAuth } from "./modules/auth"
import { registerRepositories } from "./modules/repositories"

export type ApiCradle = {
  // --- Configuration ---
  environment: ApiEnvironment
  isProduction: boolean

  // --- Infrastructure ---
  logger: ApiLogger
  database: ReturnType<typeof openDb>
  sqliteVersion: string

  // --- Auth & Email ---
  devEmailInbox: ReturnType<typeof createDevEmailInbox> | null
  emailSender: EmailSender
  auth: ReturnType<typeof createAuth>

  // --- Repositories ---
  aiRequestRepository: ReturnType<typeof createAIRequestRepository>
  dailyRecommendationRepository: ReturnType<
    typeof createDailyRecommendationRepository
  >
  promptRepository: ReturnType<typeof createPromptRepository>
  writingRepository: ReturnType<typeof createWritingRepository>
  writingSyncRepository: ReturnType<typeof createWritingSyncRepository>
  writingSyncWriter: ReturnType<typeof createWritingSyncWriter>
  writingTransactionRepository: ReturnType<
    typeof createWritingTransactionRepository
  >
  writingVersionRepository: ReturnType<typeof createWritingVersionRepository>

  // --- API Services ---
  aiUseCases: AIApiService
  homeUseCases: HomeApiService
  promptUseCases: PromptApiService
  writingUseCases: WritingApiService
  writingSyncUseCases: WritingSyncApiService
}

export function createApiContainer(
  environment: ApiEnvironment
): AwilixContainer<ApiCradle> {
  const container = createContainer<ApiCradle>({
    injectionMode: InjectionMode.PROXY,
    strict: true,
  })

  registerInfrastructure(container, environment)
  registerAuth(container)
  registerRepositories(container)

  container.register({
    // --- API Services ---

    aiUseCases: asFunction(({ aiRequestRepository, logger }: ApiCradle) =>
      createAIApiService({
        aiRequestRepository,
        logger: logger.child({ scope: "ai-services" }),
      })
    ).singleton(),

    promptUseCases: asFunction(({ promptRepository }: ApiCradle) =>
      createPromptApiService(promptRepository)
    ).singleton(),

    homeUseCases: asFunction(
      ({
        dailyRecommendationRepository,
        writingRepository,
        promptRepository,
      }: ApiCradle) =>
        createHomeApiService({
          dailyRecommendationRepository,
          writingRepository,
          promptRepository,
        })
    ).singleton(),

    writingUseCases: asFunction(
      ({ writingRepository, promptRepository }: ApiCradle) =>
        createWritingApiService({
          writingRepository,
          promptRepository,
        })
    ).singleton(),

    writingSyncUseCases: asFunction(
      ({
        writingSyncRepository,
        writingSyncWriter,
        writingTransactionRepository,
        writingVersionRepository,
      }: ApiCradle) =>
        createWritingSyncApiService({
          writingRepository: writingSyncRepository,
          syncWriter: writingSyncWriter,
          transactionRepository: writingTransactionRepository,
          versionRepository: writingVersionRepository,
        })
    ).singleton(),
  })

  return container
}
