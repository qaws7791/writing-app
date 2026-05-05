import { createContainer, InjectionMode, type AwilixContainer } from "awilix"
import { openDb } from "@workspace/database"
import type { AppLogger } from "@workspace/logging"
import type Redis from "ioredis"

import { createAuth } from "../auth/auth"
import { createDevEmailInbox, type EmailSender } from "../auth/auth-email"
import type { RateLimitBackend } from "../rate-limit/rate-limit-backend"
import type { ApiEnvironment } from "./bootstrap"
import {
  registerHomeModule,
  type GetHomeUseCase,
  type HealthCheckUseCase,
} from "./modules/home"
import { registerAuth } from "./modules/auth"
import { registerInfrastructure } from "./modules/infrastructure"
import { USE_CASE_KEYS, type UseCaseKey } from "./use-case-keys"

export type ApiCradle = {
  environment: ApiEnvironment
  isProduction: boolean

  logger: AppLogger
  database: ReturnType<typeof openDb>
  redisClient: Redis
  rateLimitBackend: RateLimitBackend
  sqliteVersion: string

  devEmailInbox: ReturnType<typeof createDevEmailInbox> | null
  emailSender: EmailSender
  auth: ReturnType<typeof createAuth>

  getHomeUseCase: GetHomeUseCase
  healthCheckUseCase: HealthCheckUseCase
}

export type ApiCradleUseCases = Pick<ApiCradle, UseCaseKey>

export function extractUseCases(cradle: ApiCradle): ApiCradleUseCases {
  return Object.fromEntries(
    USE_CASE_KEYS.map((key) => [key, cradle[key]])
  ) as ApiCradleUseCases
}

export function createApiContainer(
  environment: ApiEnvironment
): AwilixContainer<ApiCradle> {
  const container = createContainer<ApiCradle>({
    injectionMode: InjectionMode.PROXY,
    strict: true,
  })

  registerInfrastructure(container, environment)
  registerAuth(container)
  registerHomeModule(container)

  return container
}
