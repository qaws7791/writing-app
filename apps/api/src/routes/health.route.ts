import type { Hono } from "hono"
import { describeRoute, resolver } from "hono-openapi"
import { z } from "zod"

import type { ApiAppDependencies } from "@/app"

const healthDtoSchema = z.object({
  database: z.literal("ok"),
  status: z.literal("ok"),
})

const databaseUnavailableDtoSchema = z.object({
  code: z.literal("database-unavailable"),
  message: z.literal("데이터베이스를 사용할 수 없습니다."),
})

export function registerHealthRoute(
  app: Hono,
  {
    checkDatabase,
    logger,
  }: Pick<ApiAppDependencies, "checkDatabase" | "logger">
) {
  app.get(
    "/health",
    describeRoute({
      responses: {
        200: {
          description: "데이터베이스 연결이 가능합니다.",
          content: {
            "application/json": {
              schema: resolver(healthDtoSchema),
            },
          },
        },
        503: {
          description: "데이터베이스 연결을 사용할 수 없습니다.",
          content: {
            "application/json": {
              schema: resolver(databaseUnavailableDtoSchema),
            },
          },
        },
      },
    }),
    async (context) => {
      let databaseAvailable = false

      try {
        databaseAvailable = await checkDatabase()
      } catch (error) {
        logger.error({ error }, "Database health check failed")
      }

      if (!databaseAvailable) {
        return context.json(
          {
            code: "database-unavailable",
            message: "데이터베이스를 사용할 수 없습니다.",
          },
          503
        )
      }

      return context.json({
        database: "ok",
        status: "ok",
      })
    }
  )
}
