import type { AppVariables } from "../../app-env"
import { createToken } from "../../lib/injection-token"

export const HealthCheckUseCase =
  createToken<AppVariables["healthCheckUseCase"]>("healthCheckUseCase")
export const GetHomeUseCase =
  createToken<AppVariables["getHomeUseCase"]>("getHomeUseCase")
export const SqliteVersion =
  createToken<AppVariables["sqliteVersion"]>("sqliteVersion")
