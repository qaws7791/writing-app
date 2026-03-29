import { asFunction, asValue, type AwilixContainer } from "awilix"
import { openDb, readSqliteVersion } from "@workspace/database"

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

    sqliteVersion: asFunction(({ database }: ApiCradle) =>
      readSqliteVersion(database.sqlite)
    ).singleton(),
  })
}
