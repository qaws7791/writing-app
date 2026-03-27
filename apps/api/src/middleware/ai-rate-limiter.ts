import type { Context } from "hono"
import { rateLimiter } from "hono-rate-limiter"

import type { AppEnv } from "../app-env"

function resolveKey(c: Context): string {
  const userId = (c as Context<AppEnv>).get("userId")
  if (userId) return `ai:${userId}`

  const ip =
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    c.req.header("x-real-ip")

  return `ai:ip:${ip ?? "unknown"}`
}

/**
 * AI 엔드포인트용 Rate Limiter 미들웨어를 생성합니다.
 * 인증된 사용자는 userId 기준으로, 미인증 요청은 IP 기준으로 제한합니다.
 */
export function createAiRateLimiter(options: {
  /** 허용 요청 횟수 */
  limit: number
  /** 시간 창 (밀리초) */
  windowMs: number
}) {
  return rateLimiter({
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
    keyGenerator: resolveKey,
    limit: options.limit,
    windowMs: options.windowMs,
  })
}
