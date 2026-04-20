import type { z } from "zod"
import type { UserId } from "@workspace/core"

import type {
  authenticatedSessionSchema,
  authenticatedUserSchema,
} from "./auth/auth-schemas"
import type { DevEmailInbox } from "./auth/auth-email"
import type { ApiLogger } from "./observability/logger"
import type { ApiCradleUseCases } from "./runtime/container"

export type AuthenticatedSession = z.infer<typeof authenticatedSessionSchema>
export type AuthenticatedUser = z.infer<typeof authenticatedUserSchema>

export type AuthSession = {
  session: AuthenticatedSession
  user: AuthenticatedUser
}

export type GetSession = (request: Request) => Promise<AuthSession | null>

/**
 * Hono 컨텍스트로 노출되는 유스케이스 + 특수 핸들러 집합.
 * 공개 키 목록은 도메인별 registry를 합쳐 관리합니다.
 */
export type AppUseCases = ApiCradleUseCases & {
  authHandler: (request: Request) => Promise<Response>
  readLatestAuthEmail?: DevEmailInbox["readLatestMessage"]
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
