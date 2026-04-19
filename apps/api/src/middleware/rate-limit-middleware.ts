import type { Context, MiddlewareHandler } from "hono"
import { rateLimiter } from "hono-rate-limiter"

import type { AppEnv } from "../app-env"
import type {
  RateLimitBackend,
  RateLimitPolicy,
} from "../rate-limit/rate-limit-backend"

function resolveRateLimitSubjectKey(c: Context<AppEnv>): string {
  const userId = c.get("userId")
  if (userId) {
    return `user:${userId}`
  }

  const ip =
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    c.req.header("x-real-ip")

  return `ip:${ip ?? "unknown"}`
}

export function createRateLimitMiddleware(
  backend: RateLimitBackend,
  policy: RateLimitPolicy
): MiddlewareHandler<AppEnv> {
  return rateLimiter<AppEnv>({
    handler: (c) =>
      c.json(
        {
          error: {
            code: "too_many_requests",
            message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
          },
        },
        429
      ),
    keyGenerator: resolveRateLimitSubjectKey,
    limit: policy.limit,
    store: backend.createStore(policy),
    windowMs: policy.windowMs,
  })
}
