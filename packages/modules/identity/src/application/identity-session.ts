import type { AdminId } from "@workspace/types/ids"

import type { UserStatus } from "#identity/domain/user-status"

export const adminSessionExpiresAt = Symbol("admin-session-expires-at")

export type AuthenticatedSession = Readonly<{
  user: Readonly<{
    email: string
    id: string
    image: string | null
    joinedAt: string
    name: string
    status: UserStatus
  }>
}>

export type SessionResolver = Readonly<{
  resolveSession: (headers: Headers) => Promise<AuthenticatedSession | null>
}>

export type AdminAuthenticatedSession = Readonly<{
  admin: Readonly<{
    email: string
    id: AdminId
    name: string
  }>
  [adminSessionExpiresAt]: Date
}>

export type AdminSessionResolver = Readonly<{
  resolveSession: (
    headers: Headers
  ) => Promise<AdminAuthenticatedSession | null>
}>
