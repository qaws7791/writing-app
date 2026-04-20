import { createContainer, InjectionMode, type AwilixContainer } from "awilix"
import {
  createJourneyRepository,
  createProgressRepository,
  createWritingPromptRepository,
  createWritingRepository,
  openDb,
} from "@workspace/database"
import type { AiCoachingGateway } from "@workspace/core/modules/ai-feedback"
import type { AppLogger } from "@workspace/logging"
import type { RepositoryTransactionManager } from "@workspace/core/shared"
import type Redis from "ioredis"

import { createAuth } from "../auth/auth"
import { createDevEmailInbox, type EmailSender } from "../auth/auth-email"
import type { RateLimitBackend } from "../rate-limit/rate-limit-backend"
import type { ApiEnvironment } from "./bootstrap"
import {
  registerAiModule,
  type CompareRevisionsUseCase,
  type GenerateFeedbackUseCase,
} from "./modules/ai"
import { registerAuth } from "./modules/auth"
import {
  registerHomeModule,
  type GetHomeUseCase,
  type HealthCheckUseCase,
} from "./modules/home"
import { registerInfrastructure } from "./modules/infrastructure"
import {
  registerJourneyModule,
  type EnrollJourneyUseCase,
  type GetJourneyUseCase,
  type ListCompletedJourneysUseCase,
  type ListJourneysUseCase,
  type ListUserJourneysUseCase,
} from "./modules/journeys"
import {
  registerPromptModule,
  type BookmarkPromptUseCase,
  type GetPromptUseCase,
  type ListPromptWritingsUseCase,
  type ListPromptsUseCase,
  type UnbookmarkPromptUseCase,
} from "./modules/prompts"
import { registerRepositories } from "./modules/repositories"
import {
  registerSessionModule,
  type CompleteSessionUseCase,
  type GetSessionDetailUseCase,
  type RetrySessionStepAiUseCase,
  type StartSessionUseCase,
  type SubmitStepUseCase,
} from "./modules/sessions"
import {
  registerWritingModule,
  type AutosaveWritingUseCase,
  type CountWritingsUseCase,
  type CreateWritingUseCase,
  type DeleteWritingUseCase,
  type GetWritingUseCase,
  type ListWritingsUseCase,
} from "./modules/writings"
import { USE_CASE_KEYS, type UseCaseKey } from "./use-case-keys"

export type ApiCradle = {
  // --- Configuration ---
  environment: ApiEnvironment
  isProduction: boolean

  // --- Infrastructure ---
  logger: AppLogger
  database: ReturnType<typeof openDb>
  redisClient: Redis
  rateLimitBackend: RateLimitBackend
  sqliteVersion: string

  // --- Auth & Email ---
  devEmailInbox: ReturnType<typeof createDevEmailInbox> | null
  emailSender: EmailSender
  auth: ReturnType<typeof createAuth>

  // --- Repositories ---
  promptRepository: ReturnType<typeof createWritingPromptRepository>
  writingRepository: ReturnType<typeof createWritingRepository>
  journeyRepository: ReturnType<typeof createJourneyRepository>
  progressRepository: ReturnType<typeof createProgressRepository>
  transactionManager: RepositoryTransactionManager

  // --- AI ---
  aiCoachingGateway: AiCoachingGateway

  // --- Use Cases ---
  autosaveWritingUseCase: AutosaveWritingUseCase
  countWritingsUseCase: CountWritingsUseCase
  createWritingUseCase: CreateWritingUseCase
  deleteWritingUseCase: DeleteWritingUseCase
  getWritingUseCase: GetWritingUseCase
  listCompletedJourneysUseCase: ListCompletedJourneysUseCase
  listWritingsUseCase: ListWritingsUseCase

  getPromptUseCase: GetPromptUseCase
  listPromptsUseCase: ListPromptsUseCase
  listPromptWritingsUseCase: ListPromptWritingsUseCase
  bookmarkPromptUseCase: BookmarkPromptUseCase
  unbookmarkPromptUseCase: UnbookmarkPromptUseCase

  getHomeUseCase: GetHomeUseCase
  healthCheckUseCase: HealthCheckUseCase

  listJourneysUseCase: ListJourneysUseCase
  listUserJourneysUseCase: ListUserJourneysUseCase
  getJourneyUseCase: GetJourneyUseCase
  getSessionDetailUseCase: GetSessionDetailUseCase

  enrollJourneyUseCase: EnrollJourneyUseCase
  startSessionUseCase: StartSessionUseCase
  submitStepUseCase: SubmitStepUseCase
  retrySessionStepAiUseCase: RetrySessionStepAiUseCase
  completeSessionUseCase: CompleteSessionUseCase

  generateFeedbackUseCase: GenerateFeedbackUseCase
  compareRevisionsUseCase: CompareRevisionsUseCase
}

export type ApiCradleUseCases = Pick<ApiCradle, UseCaseKey>

export function extractUseCases(cradle: ApiCradle): ApiCradleUseCases {
  return Object.fromEntries(
    USE_CASE_KEYS.map((key) => [key, cradle[key]])
  ) as ApiCradleUseCases
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
  registerWritingModule(container)
  registerPromptModule(container)
  registerHomeModule(container)
  registerJourneyModule(container)
  registerSessionModule(container)
  registerAiModule(container)

  return container
}
