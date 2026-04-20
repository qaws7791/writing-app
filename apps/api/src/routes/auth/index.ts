import authHandler from "./auth-handler"

export function authRoutes() {
  return [authHandler] as const
}
