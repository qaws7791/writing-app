export type AuthenticatedSession = {
  createdAt: string
  expiresAt: string
  id: string
  ipAddress?: string | null
  token: string
  updatedAt: string
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

export type SessionSnapshot = {
  session: AuthenticatedSession
  user: AuthenticatedUser
}
