import { asFunction, type AwilixContainer } from "awilix"
import { makeGetHomeUseCase } from "@workspace/core/modules/home"

import type { AppVariables } from "../../app-env"
import { createToken } from "../../lib/injection-token"
import type { ApiCradle } from "../container"

export const HealthCheckUseCase =
  createToken<AppVariables["healthCheckUseCase"]>("healthCheckUseCase")
export const GetHomeUseCase =
  createToken<AppVariables["getHomeUseCase"]>("getHomeUseCase")
export const SqliteVersion =
  createToken<AppVariables["sqliteVersion"]>("sqliteVersion")

export type GetHomeUseCase = ReturnType<typeof makeGetHomeUseCase>

function createHealthCheckUseCase({ database, sqliteVersion }: ApiCradle) {
  return () => {
    const startedAt = performance.now()

    try {
      database.sql.query("SELECT 1").get()

      return {
        ai: {
          reason: "probe_not_configured" as const,
          status: "degraded" as const,
        },
        db: {
          latencyMs: Math.round(performance.now() - startedAt),
          status: "ok" as const,
        },
        sqliteVersion,
        status: "ok" as const,
      }
    } catch {
      return {
        ai: {
          reason: "probe_not_configured" as const,
          status: "degraded" as const,
        },
        db: {
          latencyMs: null,
          status: "degraded" as const,
        },
        sqliteVersion,
        status: "degraded" as const,
      }
    }
  }
}

export type HealthCheckUseCase = ReturnType<typeof createHealthCheckUseCase>

export const HOME_USE_CASE_KEYS = [
  "getHomeUseCase",
  "healthCheckUseCase",
  "sqliteVersion",
] as const satisfies readonly (keyof ApiCradle)[]

export function registerHomeModule(container: AwilixContainer<ApiCradle>) {
  container.register({
    getHomeUseCase: asFunction(({ progressRepository }: ApiCradle) =>
      makeGetHomeUseCase({
        progressRepository,
      })
    ).singleton(),

    healthCheckUseCase: asFunction(createHealthCheckUseCase).singleton(),
  })
}
