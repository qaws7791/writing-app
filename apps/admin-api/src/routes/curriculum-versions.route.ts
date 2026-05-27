import type { Hono } from "hono"
import { describeRoute, resolver } from "hono-openapi"

import {
  adminCurriculumVersionDetailDtoSchema,
  adminCurriculumVersionListDtoSchema,
  adminCurriculumVersionSummaryDtoSchema,
  adminDatabaseUnavailableErrorDtoSchema,
  adminInvalidRequestErrorDtoSchema,
  adminNotFoundErrorDtoSchema,
} from "@workspace/core/admin"

import type { AdminApiAppDependencies } from "@/app"
import { requireAdminSession } from "@/auth/admin-session"
import { jsonErrorResponse } from "@/routes/error-response"

export function registerCurriculumVersionsRoute(
  app: Hono,
  { adminService, auth }: Pick<AdminApiAppDependencies, "adminService" | "auth">
) {
  app.get(
    "/courses/:courseId/curriculum-versions",
    requireAdminSession(auth),
    describeRoute({
      responses: {
        200: {
          description: "Admin curriculum versions for a course.",
          content: {
            "application/json": {
              schema: resolver(adminCurriculumVersionListDtoSchema),
            },
          },
        },
        401: {
          description: "Admin authentication is required.",
        },
        503: {
          description: "Database is unavailable.",
          content: jsonErrorResponse(adminDatabaseUnavailableErrorDtoSchema),
        },
      },
    }),
    async (context) => {
      const result = await adminService.listCurriculumVersions(
        context.req.param("courseId")
      )

      switch (result.status) {
        case "ok":
          return context.json(result.value)
        case "unavailable":
          return context.json(result.error, 503)
      }
    }
  )

  app.post(
    "/courses/:courseId/curriculum-versions",
    requireAdminSession(auth),
    describeRoute({
      responses: {
        201: {
          description: "Created admin curriculum draft.",
          content: {
            "application/json": {
              schema: resolver(adminCurriculumVersionSummaryDtoSchema),
            },
          },
        },
        400: {
          description: "Draft creation request is invalid.",
          content: jsonErrorResponse(adminInvalidRequestErrorDtoSchema),
        },
        401: {
          description: "Admin authentication is required.",
        },
        404: {
          description: "Published curriculum version was not found.",
          content: jsonErrorResponse(adminNotFoundErrorDtoSchema),
        },
        503: {
          description: "Database is unavailable.",
          content: jsonErrorResponse(adminDatabaseUnavailableErrorDtoSchema),
        },
      },
    }),
    async (context) => {
      const result = await adminService.createCurriculumDraft(
        context.req.param("courseId")
      )

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
    "/curriculum-versions/:versionId",
    requireAdminSession(auth),
    describeRoute({
      responses: {
        200: {
          description: "Admin curriculum version detail.",
          content: {
            "application/json": {
              schema: resolver(adminCurriculumVersionDetailDtoSchema),
            },
          },
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
      const result = await adminService.getCurriculumVersionDetail(
        context.req.param("versionId")
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
    "/curriculum-versions/:versionId/publish",
    requireAdminSession(auth),
    describeRoute({
      responses: {
        200: {
          description: "Published admin curriculum draft.",
          content: {
            "application/json": {
              schema: resolver(adminCurriculumVersionSummaryDtoSchema),
            },
          },
        },
        400: {
          description: "Publish request is invalid.",
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
      const result = await adminService.publishCurriculumVersion(
        context.req.param("versionId")
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
}
