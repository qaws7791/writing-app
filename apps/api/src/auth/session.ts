export interface AuthUser {
  email: string
  id: string
  image: string | null
  name: string
}

export interface AuthSession {
  id: string
}

export interface CurrentAuthSession {
  session: AuthSession
  user: AuthUser
}

export interface AuthRuntime {
  getSession(headers: Headers): Promise<CurrentAuthSession | null>
  handler(request: Request): Promise<Response>
}

export const unauthorizedError = {
  code: "unauthorized",
  message: "Authentication is required.",
} as const
