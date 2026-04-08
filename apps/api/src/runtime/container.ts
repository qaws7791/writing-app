import { createContainer, InjectionMode, type AwilixContainer } from "awilix"
import {
  createJourneyRepository,
  createProgressRepository,
  createWritingPromptRepository,
  createWritingRepository,
  openDb,
} from "@workspace/database"
import type { AiCoachingGateway } from "@workspace/core"

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
  type BookmarkPromptUseCase,
  type CompareRevisionsUseCase,
  type CompleteSessionUseCase,
  type CreateWritingUseCase,
  type DeleteWritingUseCase,
  type EnrollJourneyUseCase,
  type GenerateFeedbackUseCase,
  type GetHomeUseCase,
  type GetJourneyUseCase,
  type GetPromptUseCase,
  type GetSessionDetailUseCase,
  type GetWritingUseCase,
  type ListJourneysUseCase,
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

  // --- AI ---
  aiCoachingGateway: AiCoachingGateway

  // --- Use Cases ---
  autosaveWritingUseCase: AutosaveWritingUseCase
  createWritingUseCase: CreateWritingUseCase
  deleteWritingUseCase: DeleteWritingUseCase
  getWritingUseCase: GetWritingUseCase
  listWritingsUseCase: ListWritingsUseCase

  getPromptUseCase: GetPromptUseCase
  listPromptsUseCase: ListPromptsUseCase
  listPromptWritingsUseCase: ListPromptWritingsUseCase
  bookmarkPromptUseCase: BookmarkPromptUseCase
  unbookmarkPromptUseCase: UnbookmarkPromptUseCase

  getHomeUseCase: GetHomeUseCase

  listJourneysUseCase: ListJourneysUseCase
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

export type ApiCradleUseCases = Pick<
  ApiCradle,
  | "autosaveWritingUseCase"
  | "bookmarkPromptUseCase"
  | "compareRevisionsUseCase"
  | "completeSessionUseCase"
  | "createWritingUseCase"
  | "deleteWritingUseCase"
  | "enrollJourneyUseCase"
  | "generateFeedbackUseCase"
  | "getHomeUseCase"
  | "getJourneyUseCase"
  | "getPromptUseCase"
  | "getSessionDetailUseCase"
  | "getWritingUseCase"
  | "listJourneysUseCase"
  | "listPromptWritingsUseCase"
  | "listPromptsUseCase"
  | "listWritingsUseCase"
  | "retrySessionStepAiUseCase"
  | "sqliteVersion"
  | "startSessionUseCase"
  | "submitStepUseCase"
  | "unbookmarkPromptUseCase"
>

export function extractUseCases(cradle: ApiCradle): ApiCradleUseCases {
  const {
    autosaveWritingUseCase,
    bookmarkPromptUseCase,
    compareRevisionsUseCase,
    completeSessionUseCase,
    createWritingUseCase,
    deleteWritingUseCase,
    enrollJourneyUseCase,
    generateFeedbackUseCase,
    getHomeUseCase,
    getJourneyUseCase,
    getPromptUseCase,
    getSessionDetailUseCase,
    getWritingUseCase,
    listJourneysUseCase,
    listPromptWritingsUseCase,
    listPromptsUseCase,
    listWritingsUseCase,
    retrySessionStepAiUseCase,
    sqliteVersion,
    startSessionUseCase,
    submitStepUseCase,
    unbookmarkPromptUseCase,
  } = cradle

  return {
    autosaveWritingUseCase,
    bookmarkPromptUseCase,
    compareRevisionsUseCase,
    completeSessionUseCase,
    createWritingUseCase,
    deleteWritingUseCase,
    enrollJourneyUseCase,
    generateFeedbackUseCase,
    getHomeUseCase,
    getJourneyUseCase,
    getPromptUseCase,
    getSessionDetailUseCase,
    getWritingUseCase,
    listJourneysUseCase,
    listPromptWritingsUseCase,
    listPromptsUseCase,
    listWritingsUseCase,
    retrySessionStepAiUseCase,
    sqliteVersion,
    startSessionUseCase,
    submitStepUseCase,
    unbookmarkPromptUseCase,
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
