import { okAsync } from "neverthrow"
import { cors } from "hono/cors"
import { toUserId } from "@workspace/core/shared"
import { createSilentLogger, type AppLogger } from "@workspace/logging"

import {
  createUseCaseMiddleware,
  createTimeoutMiddleware,
  handleRequestError,
} from "../app.js"
import { createApp } from "../lib/hono/create-app.js"
import { createRequestLoggerMiddleware } from "../middleware/request-logger.js"
import { createResolveSessionMiddleware } from "../middleware/resolve-session.js"
import { API_SERVICE_NAME } from "../observability/service-name.js"
import { allRoutes } from "../routes/index.js"
import type { AppEnv } from "../app-env.js"

function createTestSession(userId: string) {
  return {
    session: {
      createdAt: "2026-03-20T00:00:00.000Z",
      expiresAt: "2026-03-27T00:00:00.000Z",
      id: `session-${userId}`,
      ipAddress: null,
      token: `token-${userId}`,
      updatedAt: "2026-03-20T00:00:00.000Z",
      userAgent: "vitest",
      userId,
    },
    user: {
      email: `${userId}@example.com`,
      emailVerified: true,
      id: userId,
      image: null,
      name: "테스트 사용자",
    },
  }
}

export function createTestApi(input?: {
  homeError?: Error
  logger?: AppLogger
}) {
  const allowedOrigins = new Set([
    "http://127.0.0.1:3000",
    "http://localhost:3000",
  ])
  const logger =
    input?.logger ?? createSilentLogger({ service: API_SERVICE_NAME })

  const app = createApp<AppEnv>({
    globalMiddleware: [
      cors({
        allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
        credentials: true,
        origin: (origin) => {
          if (!origin) return null
          return allowedOrigins.has(origin) ? origin : null
        },
      }),
      createRequestLoggerMiddleware(logger),
      createResolveSessionMiddleware(async (request) => {
        if (request.headers.get("x-test-auth") === "none") {
          return null
        }
        const userId = request.headers.get("x-test-user-id") ?? "dev-user"
        return createTestSession(userId)
      }),
      createUseCaseMiddleware({
        authHandler: async () =>
          new Response(
            JSON.stringify({
              error: {
                code: "not_found",
                message: "테스트 인증 핸들러가 구성되지 않았습니다.",
              },
            }),
            {
              headers: { "content-type": "application/json" },
              status: 404,
            }
          ),
        getHomeUseCase(userId) {
          if (input?.homeError) {
            throw input.homeError
          }
          void toUserId(String(userId))
          return okAsync({
            startActions: [
              {
                id: "photo" as const,
                title: "사진으로 시작",
                description: "한 장면에서 표현 재료를 찾습니다.",
                href: "/photo",
              },
              {
                id: "manual" as const,
                title: "직접 재료 쓰기",
                description: "떠오른 감각과 단어로 시작합니다.",
                href: "/photo",
              },
              {
                id: "garden" as const,
                title: "문체 정원 보기",
                description: "저장한 표현 카드를 다시 살펴봅니다.",
                href: "/garden",
              },
            ],
            recentWork: null,
            garden: {
              cardCount: 0,
              sentenceCount: 0,
            },
          })
        },
        healthCheckUseCase() {
          return {
            ai: {
              reason: "probe_not_configured" as const,
              status: "degraded" as const,
            },
            db: {
              latencyMs: 1,
              status: "ok" as const,
            },
            sqliteVersion: "3.46.0",
            status: "ok" as const,
          }
        },
        readLatestAuthEmail: () => null,
        sqliteVersion: "3.46.0",
      }),
      createTimeoutMiddleware(),
    ],
    errorHandler: (error, c) => {
      if (error instanceof Error && error.name === "TimeoutError") {
        return c.json(
          { error: { code: "request_timeout", message: error.message } },
          408
        )
      }
      return handleRequestError(c, error, logger, "request failed")
    },
    openapi: {
      description: "테스트용 OpenAPI 문서",
      title: "geulsoom-labs test api",
      version: "0.0.0-test",
    },
    routes: [...allRoutes()],
    notFound: (c) =>
      c.json(
        {
          error: {
            code: "not_found",
            message: "요청한 경로를 찾을 수 없습니다.",
          },
        },
        404
      ),
  })

  return {
    app,
    close: () => undefined,
  }
}
