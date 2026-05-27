import type { Hono } from "hono"
import { describeRoute, resolver } from "hono-openapi"
import { z } from "zod"

import {
  adminCreateCurriculumMigrationRequestDtoSchema,
  adminCurriculumMigrationApplicationDtoSchema,
  adminCurriculumMigrationDetailDtoSchema,
  adminDatabaseUnavailableErrorDtoSchema,
  adminInvalidRequestErrorDtoSchema,
  adminNotFoundErrorDtoSchema,
} from "@workspace/core/admin"

import type { AdminApiAppDependencies } from "@/app"
import { requireAdminSession } from "@/auth/admin-session"
import { jsonErrorResponse } from "@/routes/error-response"

const applyCurriculumMigrationBodySchema = z.object({
  userId: z.string().min(1),
})

export function registerCurriculumMigrationsRoute(
  app: Hono,
  { adminService, auth }: Pick<AdminApiAppDependencies, "adminService" | "auth">
) {
  app.post(
    "/curriculum-migrations",
    requireAdminSession(auth),
    describeRoute({
      responses: {
        201: {
          description: "Created admin curriculum migration map.",
          content: {
            "application/json": {
              schema: resolver(adminCurriculumMigrationDetailDtoSchema),
            },
          },
        },
        400: {
          description: "Migration request is invalid.",
          content: jsonErrorResponse(adminInvalidRequestErrorDtoSchema),
        },
        401: {
          description: "Admin authentication is required.",
        },
        404: {
          description: "Curriculum version was not found.",
          content: jsonErrorResponse(adminNotFoundErrorDtoSchema),
        },
        503: {
          description: "Database is unavailable.",
          content: jsonErrorResponse(adminDatabaseUnavailableErrorDtoSchema),
        },
      },
    }),
    async (context) => {
      const body = await readJsonBody(context.req.raw)
      const input =
        adminCreateCurriculumMigrationRequestDtoSchema.safeParse(body)

      if (!input.success) {
        return context.json(
          {
            code: "invalid-request",
            message: "Migration request body is invalid.",
          },
          400
        )
      }

      const result = await adminService.createCurriculumMigration(input.data)

      switch (result.status) {
        case "ok":
          return context.json(result.value, 201)
        case "invalid-request":
          return context.json(result.error, 400)
        case "not-found":
          return context.json(result.error, 404)
        case "unavailable":
          return context.json(result.error, 503)
      }
    }
  )

  app.get(
    "/curriculum-migrations/:migrationId",
    requireAdminSession(auth),
    describeRoute({
      responses: {
        200: {
          description: "Admin curriculum migration map.",
          content: {
            "application/json": {
              schema: resolver(adminCurriculumMigrationDetailDtoSchema),
            },
          },
        },
        401: {
          description: "Admin authentication is required.",
        },
        404: {
          description: "Curriculum migration was not found.",
          content: jsonErrorResponse(adminNotFoundErrorDtoSchema),
        },
        503: {
          description: "Database is unavailable.",
          content: jsonErrorResponse(adminDatabaseUnavailableErrorDtoSchema),
        },
      },
    }),
    async (context) => {
      const result = await adminService.getCurriculumMigration(
        context.req.param("migrationId")
      )

      switch (result.status) {
        case "ok":
          return context.json(result.value)
        case "invalid-request":
          return context.json(result.error, 400)
        case "not-found":
          return context.json(result.error, 404)
        case "unavailable":
          return context.json(result.error, 503)
      }
    }
  )

  app.post(
    "/curriculum-migrations/:migrationId/apply",
    requireAdminSession(auth),
    describeRoute({
      responses: {
        200: {
          description: "Applied admin curriculum migration map.",
          content: {
            "application/json": {
              schema: resolver(adminCurriculumMigrationApplicationDtoSchema),
            },
          },
        },
        400: {
          description: "Migration apply request is invalid.",
          content: jsonErrorResponse(adminInvalidRequestErrorDtoSchema),
        },
        401: {
          description: "Admin authentication is required.",
        },
        404: {
          description:
            "Curriculum migration or learner progress was not found.",
          content: jsonErrorResponse(adminNotFoundErrorDtoSchema),
        },
        503: {
          description: "Database is unavailable.",
          content: jsonErrorResponse(adminDatabaseUnavailableErrorDtoSchema),
        },
      },
    }),
    async (context) => {
      const body = await readJsonBody(context.req.raw)
      const input = applyCurriculumMigrationBodySchema.safeParse(body)

      if (!input.success) {
        return context.json(
          {
            code: "invalid-request",
            message: "Migration apply request body is invalid.",
          },
          400
        )
      }

      const result = await adminService.applyCurriculumMigration({
        migrationId: context.req.param("migrationId"),
        userId: input.data.userId,
      })

      switch (result.status) {
        case "ok":
          return context.json(result.value)
        case "invalid-request":
          return context.json(result.error, 400)
        case "not-found":
          return context.json(result.error, 404)
        case "unavailable":
          return context.json(result.error, 503)
      }
    }
  )
}

async function readJsonBody(request: Request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}
