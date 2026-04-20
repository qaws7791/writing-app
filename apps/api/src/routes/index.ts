import type { RateLimitBackend } from "../rate-limit/rate-limit-backend"
import { aiRoutes } from "./ai"
import authHandler from "./auth/auth-handler"
import getHealth from "./health/get-health"
import getHome from "./home/get-home"
import { journeyRoutes } from "./journeys"
import getMe from "./me/get-me"
import { promptRoutes } from "./prompts"
import { sessionRoutes } from "./sessions"
import getUserProfile from "./users/get-user-profile"
import { writingRoutes } from "./writings"

type RouteDependencies = {
  rateLimitBackend: RateLimitBackend
}

export function allRoutes({ rateLimitBackend }: RouteDependencies) {
  return [
    getHealth,
    authHandler,
    getMe,
    getHome,
    ...promptRoutes(),
    ...journeyRoutes(),
    ...sessionRoutes(),
    getUserProfile,
    ...writingRoutes(),
    ...aiRoutes({ rateLimitBackend }),
  ] as const
}
