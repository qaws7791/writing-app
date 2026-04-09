import type { UserId } from "@workspace/core"

import type { DevEmailInbox } from "./auth/auth-email"
import type { ApiLogger } from "./observability/logger"
import type {
  AutosaveWritingUseCase,
  BookmarkPromptUseCase,
  CompareRevisionsUseCase,
  CompleteSessionUseCase,
  CreateWritingUseCase,
  DeleteWritingUseCase,
  EnrollJourneyUseCase,
  GenerateFeedbackUseCase,
  GetHomeUseCase,
  GetJourneyUseCase,
  GetPromptUseCase,
  GetSessionDetailUseCase,
  GetWritingUseCase,
  ListCompletedJourneysUseCase,
  ListJourneysUseCase,
  ListUserJourneysUseCase,
  ListPromptWritingsUseCase,
  ListPromptsUseCase,
  ListWritingsUseCase,
  RetrySessionStepAiUseCase,
  StartSessionUseCase,
  SubmitStepUseCase,
  UnbookmarkPromptUseCase,
} from "./runtime/modules/use-cases"

export type AuthenticatedSession = {
  createdAt: Date | string
  expiresAt: Date | string
  id: string
  ipAddress?: string | null
  token: string
  updatedAt: Date | string
  userAgent?: string | null
  userId: string
}

export type AuthenticatedUser = {
  email: string
  emailVerified: boolean
  id: string
  image?: string | null
  name: string
}

export type AuthSession = {
  session: AuthenticatedSession
  user: AuthenticatedUser
}

export type GetSession = (request: Request) => Promise<AuthSession | null>

export type AppUseCases = {
  authHandler: (request: Request) => Promise<Response>
  autosaveWritingUseCase: AutosaveWritingUseCase
  bookmarkPromptUseCase: BookmarkPromptUseCase
  compareRevisionsUseCase: CompareRevisionsUseCase
  completeSessionUseCase: CompleteSessionUseCase
  createWritingUseCase: CreateWritingUseCase
  deleteWritingUseCase: DeleteWritingUseCase
  enrollJourneyUseCase: EnrollJourneyUseCase
  generateFeedbackUseCase: GenerateFeedbackUseCase
  getHomeUseCase: GetHomeUseCase
  getJourneyUseCase: GetJourneyUseCase
  getPromptUseCase: GetPromptUseCase
  getSessionDetailUseCase: GetSessionDetailUseCase
  getWritingUseCase: GetWritingUseCase
  listCompletedJourneysUseCase: ListCompletedJourneysUseCase
  listJourneysUseCase: ListJourneysUseCase
  listUserJourneysUseCase: ListUserJourneysUseCase
  listPromptWritingsUseCase: ListPromptWritingsUseCase
  listPromptsUseCase: ListPromptsUseCase
  listWritingsUseCase: ListWritingsUseCase
  readLatestAuthEmail?: DevEmailInbox["readLatestMessage"]
  retrySessionStepAiUseCase: RetrySessionStepAiUseCase
  sqliteVersion: string
  startSessionUseCase: StartSessionUseCase
  submitStepUseCase: SubmitStepUseCase
  unbookmarkPromptUseCase: UnbookmarkPromptUseCase
}

export type AppVariables = AppUseCases & {
  authSession: AuthenticatedSession | null
  authUser: AuthenticatedUser | null
  requestId: string
  requestLogger: ApiLogger
  userId: UserId | null
}

export type AppEnv = {
  Variables: AppVariables
}
