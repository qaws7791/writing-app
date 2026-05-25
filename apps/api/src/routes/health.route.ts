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
  message: z.literal("Database is unavailable."),
})

export function registerHealthRoute(
  app: Hono,
  { checkDatabase }: Pick<ApiAppDependencies, "checkDatabase">
) {
  app.get(
    "/health",
    describeRoute({
      responses: {
        200: {
          description: "Database connection is available.",
          content: {
            "application/json": {
              schema: resolver(healthDtoSchema),
            },
          },
        },
        503: {
          description: "Database connection is unavailable.",
          content: {
            "application/json": {
              schema: resolver(databaseUnavailableDtoSchema),
            },
          },
        },
      },
    }),
    async (context) => {
      const databaseAvailable = await checkDatabase()

      if (!databaseAvailable) {
        return context.json(
          {
            code: "database-unavailable",
            message: "Database is unavailable.",
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
