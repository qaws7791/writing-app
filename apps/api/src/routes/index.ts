import type { RateLimitBackend } from "../rate-limit/rate-limit-backend"
import { aiRoutes } from "./ai"
import { authRoutes } from "./auth"
import { healthRoutes } from "./health"
import { homeRoutes } from "./home"
import { journeyRoutes } from "./journeys"
import { meRoutes } from "./me"
import { promptRoutes } from "./prompts"
import { sessionRoutes } from "./sessions"
import { userRoutes } from "./users"
import { writingRoutes } from "./writings"

type RouteDependencies = {
  rateLimitBackend: RateLimitBackend
}

export function allRoutes({ rateLimitBackend }: RouteDependencies) {
  return [
    ...healthRoutes(),
    ...authRoutes(),
    ...meRoutes(),
    ...homeRoutes(),
    ...promptRoutes(),
    ...journeyRoutes(),
    ...sessionRoutes(),
    ...userRoutes(),
    ...writingRoutes(),
    ...aiRoutes({ rateLimitBackend }),
  ] as const
}
