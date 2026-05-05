import { migrateDatabase, seedDatabase } from "@workspace/database"
import type { AppLogLevel } from "@workspace/logging"
import { apiReference } from "@scalar/hono-api-reference"
import { OpenAPIHono } from "@hono/zod-openapi"
import { cors } from "hono/cors"

import type { AppEnv, AppUseCases } from "../app-env"
import {
  createUseCaseMiddleware,
  createTimeoutMiddleware,
  handleRequestError,
} from "../app"
import { apiEnv } from "../config/env"
import { createApp } from "../lib/hono/create-app"
import { createRequestLoggerMiddleware } from "../middleware/request-logger"
import { createResolveSessionMiddleware } from "../middleware/resolve-session"
import getAuthEmails from "../routes/dev/get-auth-emails"
import { allRoutes } from "../routes"
import { createApiContainer, extractUseCases } from "./container"

export type ApiEnvironment = {
  apiBaseUrl: string
  authBaseUrl: string
  authDebugEnabled: boolean
  authSecret: string
  databasePath: string
  logLevel: AppLogLevel
  port: number
  rateLimitRedisPrefix: string
  redisUrl: string
  seedOnStartup: boolean
  webBaseUrl: string
}

export type AppDependencies = {
  app: OpenAPIHono<AppEnv>
  close: () => void
  sqliteVersion: string
}

export function readApiEnvironment(): ApiEnvironment {
  const isProduction = process.env.NODE_ENV === "production"
  return {
    apiBaseUrl: apiEnv.API_BASE_URL,
    authBaseUrl: apiEnv.API_AUTH_BASE_URL,
    authDebugEnabled: !isProduction,
    authSecret: apiEnv.API_AUTH_SECRET,
    databasePath: apiEnv.API_DATABASE_PATH,
    logLevel: apiEnv.API_LOG_LEVEL,
    port: apiEnv.API_PORT,
    rateLimitRedisPrefix: apiEnv.API_RATE_LIMIT_REDIS_PREFIX,
    redisUrl: apiEnv.API_REDIS_URL,
    seedOnStartup: !isProduction,
    webBaseUrl: apiEnv.API_WEB_BASE_URL,
  }
}

export async function createApiDependencies(
  environment: ApiEnvironment
): Promise<AppDependencies> {
  const container = createApiContainer(environment)
  const { auth, database, devEmailInbox, logger, redisClient, sqliteVersion } =
    container.cradle

  await redisClient.ping()
  await migrateDatabase(database.db)
  if (environment.seedOnStartup) {
    await seedDatabase(database.db)
  }

  const useCases: AppUseCases = {
    ...extractUseCases(container.cradle),
    authHandler: auth.handler,
    readLatestAuthEmail: devEmailInbox?.readLatestMessage,
  }

  logger.info(
    {
      databasePath: environment.databasePath,
      port: environment.port,
      rateLimitRedisPrefix: environment.rateLimitRedisPrefix,
      sqliteVersion,
    },
    "api dependencies ready"
  )

  const allowedOrigins = new Set([
    environment.webBaseUrl,
    ...(apiEnv.API_ALLOWED_ORIGINS ?? []),
  ])

  const app = createApp<AppEnv>({
    globalMiddleware: [
      cors({
        allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
        credentials: true,
        origin: (origin) => {
          if (!origin) return undefined
          return allowedOrigins.has(origin) ? origin : undefined
        },
      }),
      createRequestLoggerMiddleware(logger),
      createResolveSessionMiddleware((request) =>
        auth.api.getSession({ headers: request.headers })
      ),
      createUseCaseMiddleware(useCases),
      createTimeoutMiddleware(),
    ],
    errorHandler: (error, c) =>
      handleRequestError(c, error, logger, "request failed"),
    routes: [
      ...allRoutes(),
      ...(environment.authDebugEnabled ? [getAuthEmails] : []),
    ],
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
    openapi: {
      description:
        "글숨 Labs API입니다. 첫 문장 루프와 문체 정원 중심 워크플로우를 지원합니다.",
      servers: [{ description: "API 서버", url: environment.apiBaseUrl }],
      title: "Geulsoom Labs API",
      version: "1.0.0",
    },
  })

  app.openAPIRegistry.registerComponent("securitySchemes", "cookieAuth", {
    description:
      "better-auth가 관리하는 세션 쿠키입니다. /api/auth/sign-in/email 로그인 후 자동으로 설정됩니다.",
    in: "cookie",
    name: "better-auth.session_token",
    type: "apiKey",
  })

  app.get(
    "/docs",
    apiReference({
      pageTitle: "Geulsoom Labs API",
      url: "/openapi.json",
      theme: "kepler",
    })
  )

  return {
    app,
    close: () => {
      void container.dispose()
    },
    sqliteVersion,
  }
}
