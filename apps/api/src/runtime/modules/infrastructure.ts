import { asFunction, asValue, type AwilixContainer } from "awilix"
import { openDb } from "@workspace/database"

import { createApiLogger } from "../../observability/logger"
import type { ApiCradle } from "../container"

export function registerInfrastructure(
  container: AwilixContainer<ApiCradle>,
  environment: ApiCradle["environment"]
) {
  container.register({
    environment: asValue(environment),
    isProduction: asValue(process.env.NODE_ENV === "production"),

    logger: asFunction(({ environment }: ApiCradle) =>
      createApiLogger({ level: environment.logLevel })
    ).singleton(),

    database: asFunction(({ environment }: ApiCradle) =>
      openDb(environment.databasePath)
    )
      .singleton()
      .disposer((database) => database.close()),

    sqliteVersion: asFunction(async ({ database }: ApiCradle) => {
      const rows = await database.sql`SELECT version()`
      const row = rows[0] as { version?: string } | undefined
      return row?.version ?? "unknown"
    }).singleton(),
  })
}
