import { Hono } from "hono"
import { type toUserId } from "@workspace/core"

import type { ApiLogger } from "./logger.js"

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

export type ApiVariables = {
  authSession: AuthenticatedSession | null
  authUser: AuthenticatedUser | null
  requestId: string
  requestLogger: ApiLogger
  userId: ReturnType<typeof toUserId> | null
}

export type ApiRouter = Hono<{
  Variables: ApiVariables
}>

export function createApiRouter(): ApiRouter {
  return new Hono<{ Variables: ApiVariables }>()
}
