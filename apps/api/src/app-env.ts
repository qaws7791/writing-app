import type { toUserId } from "@workspace/core"

import type {
  WritingApiService,
  HomeApiService,
  PromptApiService,
} from "./application-services"
import type { AIApiService } from "./ai-services"
import type { WritingSyncApiService } from "./writing-services"
import type { DevEmailInbox } from "./auth/auth-email"
import type { ApiLogger } from "./observability/logger"

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

export type AppServices = {
  aiUseCases: AIApiService
  authHandler: (request: Request) => Promise<Response>
  writingUseCases: WritingApiService
  homeUseCases: HomeApiService
  promptUseCases: PromptApiService
  writingSyncUseCases: WritingSyncApiService
  readLatestAuthEmail?: DevEmailInbox["readLatestMessage"]
  sqliteVersion: string
}

export type AppVariables = {
  authSession: AuthenticatedSession | null
  authUser: AuthenticatedUser | null
  requestId: string
  requestLogger: ApiLogger
  services: AppServices
  userId: ReturnType<typeof toUserId> | null
}

export type AppEnv = {
  Variables: AppVariables
}
