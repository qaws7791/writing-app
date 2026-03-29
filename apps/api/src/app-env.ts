import type { UserId } from "@workspace/core"

import type { AIApiService } from "./services/ai-services"
import type { DevEmailInbox } from "./auth/auth-email"
import type { ApiLogger } from "./observability/logger"
import type {
  AutosaveWritingUseCase,
  CreateWritingUseCase,
  DeleteWritingUseCase,
  GetHomeUseCase,
  GetPromptUseCase,
  GetVersionUseCase,
  GetWritingUseCase,
  ListPromptsUseCase,
  ListVersionsUseCase,
  ListWritingsUseCase,
  PullDocumentUseCase,
  PushTransactionsUseCase,
  SavePromptUseCase,
  UnsavePromptUseCase,
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
  aiUseCases: AIApiService
  authHandler: (request: Request) => Promise<Response>
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
  readLatestAuthEmail?: DevEmailInbox["readLatestMessage"]
  savePromptUseCase: SavePromptUseCase
  sqliteVersion: string
  unsavePromptUseCase: UnsavePromptUseCase
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
