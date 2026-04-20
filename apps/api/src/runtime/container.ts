import { createContainer, InjectionMode, type AwilixContainer } from "awilix"
import {
  createJourneyRepository,
  createProgressRepository,
  createWritingPromptRepository,
  createWritingRepository,
  openDb,
} from "@workspace/database"
import type { AiCoachingGateway } from "@workspace/core/modules/ai-feedback"
import type { RepositoryTransactionManager } from "@workspace/core/shared"
import type Redis from "ioredis"

import { createAuth } from "../auth/auth"
import { createDevEmailInbox, type EmailSender } from "../auth/auth-email"
import type { ApiLogger } from "../observability/logger"
import type { RateLimitBackend } from "../rate-limit/rate-limit-backend"
import type { ApiEnvironment } from "./bootstrap"
import { registerInfrastructure } from "./modules/infrastructure"
import { registerAuth } from "./modules/auth"
import { registerRepositories } from "./modules/repositories"
import {
  AI_USE_CASE_KEYS,
  HOME_USE_CASE_KEYS,
  JOURNEY_USE_CASE_KEYS,
  PROMPT_USE_CASE_KEYS,
  SESSION_USE_CASE_KEYS,
  WRITING_USE_CASE_KEYS,
  registerUseCases,
  type AutosaveWritingUseCase,
  type BookmarkPromptUseCase,
  type CompareRevisionsUseCase,
  type CompleteSessionUseCase,
  type CreateWritingUseCase,
  type DeleteWritingUseCase,
  type EnrollJourneyUseCase,
  type GenerateFeedbackUseCase,
  type GetHomeUseCase,
  type HealthCheckUseCase,
  type GetJourneyUseCase,
  type GetPromptUseCase,
  type GetSessionDetailUseCase,
  type GetWritingUseCase,
  type ListCompletedJourneysUseCase,
  type ListJourneysUseCase,
  type ListUserJourneysUseCase,
  type ListPromptWritingsUseCase,
  type ListPromptsUseCase,
  type ListWritingsUseCase,
  type RetrySessionStepAiUseCase,
  type StartSessionUseCase,
  type SubmitStepUseCase,
  type UnbookmarkPromptUseCase,
} from "./modules/use-cases"

export type ApiCradle = {
  // --- Configuration ---
  environment: ApiEnvironment
  isProduction: boolean

  // --- Infrastructure ---
  logger: ApiLogger
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

export const USE_CASE_KEYS = [
  ...WRITING_USE_CASE_KEYS,
  ...PROMPT_USE_CASE_KEYS,
  ...HOME_USE_CASE_KEYS,
  ...JOURNEY_USE_CASE_KEYS,
  ...SESSION_USE_CASE_KEYS,
  ...AI_USE_CASE_KEYS,
] as const satisfies readonly (keyof ApiCradle)[]

export type ApiCradleUseCases = Pick<ApiCradle, (typeof USE_CASE_KEYS)[number]>

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
  registerUseCases(container)

  return container
}
