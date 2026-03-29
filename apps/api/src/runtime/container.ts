import { createContainer, InjectionMode, type AwilixContainer } from "awilix"
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

import type { AIApiService } from "../services/ai-services"
import { createAuth } from "../auth/auth"
import { createDevEmailInbox, type EmailSender } from "../auth/auth-email"
import type { ApiLogger } from "../observability/logger"
import type { ApiEnvironment } from "./bootstrap"
import { registerInfrastructure } from "./modules/infrastructure"
import { registerAuth } from "./modules/auth"
import { registerRepositories } from "./modules/repositories"
import {
  registerUseCases,
  type AutosaveWritingUseCase,
  type CreateWritingUseCase,
  type DeleteWritingUseCase,
  type GetHomeUseCase,
  type GetPromptUseCase,
  type GetVersionUseCase,
  type GetWritingUseCase,
  type ListPromptsUseCase,
  type ListVersionsUseCase,
  type ListWritingsUseCase,
  type PullDocumentUseCase,
  type PushTransactionsUseCase,
  type SavePromptUseCase,
  type UnsavePromptUseCase,
} from "./modules/use-cases"

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

  // --- Use Cases ---
  aiUseCases: AIApiService
  autosaveWritingUseCase: AutosaveWritingUseCase
  createWritingUseCase: CreateWritingUseCase
  deleteWritingUseCase: DeleteWritingUseCase
  getHomeUseCase: GetHomeUseCase
  getPromptUseCase: GetPromptUseCase
  getVersionUseCase: GetVersionUseCase
  getWritingUseCase: GetWritingUseCase
  listPromptsUseCase: ListPromptsUseCase
  listVersionsUseCase: ListVersionsUseCase
  listWritingsUseCase: ListWritingsUseCase
  pullDocumentUseCase: PullDocumentUseCase
  pushTransactionsUseCase: PushTransactionsUseCase
  savePromptUseCase: SavePromptUseCase
  unsavePromptUseCase: UnsavePromptUseCase
}

export type ApiCradleUseCases = Pick<
  ApiCradle,
  | "aiUseCases"
  | "autosaveWritingUseCase"
  | "createWritingUseCase"
  | "deleteWritingUseCase"
  | "getHomeUseCase"
  | "getPromptUseCase"
  | "getVersionUseCase"
  | "getWritingUseCase"
  | "listPromptsUseCase"
  | "listVersionsUseCase"
  | "listWritingsUseCase"
  | "pullDocumentUseCase"
  | "pushTransactionsUseCase"
  | "savePromptUseCase"
  | "sqliteVersion"
  | "unsavePromptUseCase"
>

export function extractUseCases(cradle: ApiCradle): ApiCradleUseCases {
  const {
    aiUseCases,
    autosaveWritingUseCase,
    createWritingUseCase,
    deleteWritingUseCase,
    getHomeUseCase,
    getPromptUseCase,
    getVersionUseCase,
    getWritingUseCase,
    listPromptsUseCase,
    listVersionsUseCase,
    listWritingsUseCase,
    pullDocumentUseCase,
    pushTransactionsUseCase,
    savePromptUseCase,
    sqliteVersion,
    unsavePromptUseCase,
  } = cradle

  return {
    aiUseCases,
    autosaveWritingUseCase,
    createWritingUseCase,
    deleteWritingUseCase,
    getHomeUseCase,
    getPromptUseCase,
    getVersionUseCase,
    getWritingUseCase,
    listPromptsUseCase,
    listVersionsUseCase,
    listWritingsUseCase,
    pullDocumentUseCase,
    pushTransactionsUseCase,
    savePromptUseCase,
    sqliteVersion,
    unsavePromptUseCase,
  }
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
  registerUseCases(container)

  return container
}
