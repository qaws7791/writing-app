import { asFunction, asValue, type AwilixContainer } from "awilix"
import { openDb } from "@workspace/database"
import { createServerLogger } from "@workspace/logging"
import Redis from "ioredis"

import { API_SERVICE_NAME } from "../../observability/service-name"
import { createRedisRateLimitBackend } from "../../rate-limit/rate-limit-backend"
import type { ApiCradle } from "../container"

async function closeRedisClient(client: Redis) {
  if (client.status === "end") return

  try {
    await client.quit()
  } catch {
    client.disconnect()
  }
}

export function registerInfrastructure(
  container: AwilixContainer<ApiCradle>,
  environment: ApiCradle["environment"]
) {
  container.register({
    environment: asValue(environment),
    isProduction: asValue(process.env.NODE_ENV === "production"),

    logger: asFunction(({ environment }: ApiCradle) =>
      createServerLogger({
        level: environment.logLevel,
        service: API_SERVICE_NAME,
      })
    ).singleton(),

    database: asFunction(({ environment }: ApiCradle) =>
      openDb(environment.databasePath)
    )
      .singleton()
      .disposer((database) => database.close()),

    redisClient: asFunction(
      ({ environment }: ApiCradle) =>
        new Redis(environment.redisUrl, {
          enableReadyCheck: true,
          lazyConnect: false,
          maxRetriesPerRequest: 1,
        })
    )
      .singleton()
      .disposer((client) => closeRedisClient(client)),

    rateLimitBackend: asFunction(({ environment, redisClient }: ApiCradle) =>
      createRedisRateLimitBackend({
        client: redisClient,
        prefix: environment.rateLimitRedisPrefix,
      })
    ).singleton(),

    sqliteVersion: asFunction(({ database }: ApiCradle) => {
      const result = database.sql
        .query("SELECT sqlite_version() as version")
        .get() as { version: string } | null
      return result?.version ?? "unknown"
    }).singleton(),
  })
}
