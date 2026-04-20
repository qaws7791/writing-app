import type { AppEnv } from "../app-env"
import { createOpenApiApp } from "./create-openapi-app"

export function createRouter() {
  return createOpenApiApp<AppEnv>()
}
