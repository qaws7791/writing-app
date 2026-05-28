import type { Hono } from "hono"
import { describeRoute, resolver } from "hono-openapi"

import {
  adminConflictErrorDtoSchema,
  adminCourseDetailDtoSchema,
  adminCurriculumVersionListDtoSchema,
  adminCurriculumVersionSummaryDtoSchema,
  adminDatabaseUnavailableErrorDtoSchema,
  adminEditorCurriculumVersionDetailDtoSchema,
  adminEditorLessonDetailDtoSchema,
  adminInvalidRequestErrorDtoSchema,
  adminNotFoundErrorDtoSchema,
  adminRestoreCurriculumDraftRequestDtoSchema,
  adminSaveCurriculumVersionContentRequestDtoSchema,
} from "@workspace/core/admin"

import type { AdminApiAppDependencies } from "@/app"
import { requireAdminSession } from "@/auth/admin-session"
import { jsonErrorResponse } from "@/routes/error-response"

export function registerCurriculumEditorRoute(
  app: Hono,
  { adminService, auth }: Pick<AdminApiAppDependencies, "adminService" | "auth">
) {
  app.get(
    "/courses/:courseId",
    requireAdminSession(auth),
    describeRoute({
      responses: {
        200: {
          description: "Admin course detail for the editor.",
          content: {
            "application/json": {
              schema: resolver(adminCourseDetailDtoSchema),
            },
          },
        },
        401: {
          description: "Admin authentication is required.",
        },
        404: {
          description: "Course was not found.",
          content: jsonErrorResponse(adminNotFoundErrorDtoSchema),
        },
        503: {
          description: "Database is unavailable.",
          content: jsonErrorResponse(adminDatabaseUnavailableErrorDtoSchema),
        },
      },
    }),
    async (context) => {
      const result = await adminService.getCourseDetail(
        context.req.param("courseId")
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

  app.get(
    "/courses/:courseId/curriculum/versions",
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
    "/courses/:courseId/curriculum/drafts",
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

  app.post(
    "/courses/:courseId/curriculum/restores",
    requireAdminSession(auth),
    describeRoute({
      responses: {
        201: {
          description: "Restored admin curriculum draft.",
          content: {
            "application/json": {
              schema: resolver(adminCurriculumVersionSummaryDtoSchema),
            },
          },
        },
        400: {
          description: "Restore request is invalid.",
          content: jsonErrorResponse(adminInvalidRequestErrorDtoSchema),
        },
        401: {
          description: "Admin authentication is required.",
        },
        404: {
          description: "Source curriculum version was not found.",
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
      const input = adminRestoreCurriculumDraftRequestDtoSchema.safeParse(body)

      if (!input.success) {
        return context.json(
          {
            code: "invalid-request",
            message: "Curriculum restore request body is invalid.",
          },
          400
        )
      }

      const result = await adminService.restoreCurriculumDraft(
        context.req.param("courseId"),
        input.data
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
    "/courses/:courseId/curriculum/versions/:versionId",
    requireAdminSession(auth),
    describeRoute({
      responses: {
        200: {
          description: "Admin course curriculum version detail for the editor.",
          content: {
            "application/json": {
              schema: resolver(adminEditorCurriculumVersionDetailDtoSchema),
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
      const result = await adminService.getCourseCurriculumVersionDetail(
        context.req.param("courseId"),
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

  app.put(
    "/courses/:courseId/curriculum/versions/:versionId/content",
    requireAdminSession(auth),
    describeRoute({
      responses: {
        200: {
          description: "Saved admin curriculum version content.",
          content: {
            "application/json": {
              schema: resolver(adminEditorCurriculumVersionDetailDtoSchema),
            },
          },
        },
        400: {
          description: "Save request is invalid.",
          content: jsonErrorResponse(adminInvalidRequestErrorDtoSchema),
        },
        401: {
          description: "Admin authentication is required.",
        },
        404: {
          description: "Curriculum version was not found.",
          content: jsonErrorResponse(adminNotFoundErrorDtoSchema),
        },
        409: {
          description: "Curriculum version was changed by another edit.",
          content: jsonErrorResponse(adminConflictErrorDtoSchema),
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
        adminSaveCurriculumVersionContentRequestDtoSchema.safeParse(body)

      if (!input.success) {
        return context.json(
          {
            code: "invalid-request",
            message: "Curriculum save request body is invalid.",
          },
          400
        )
      }

      if (
        input.data.courseId !== context.req.param("courseId") ||
        input.data.versionId !== context.req.param("versionId")
      ) {
        return context.json(
          {
            code: "invalid-request",
            message: "Route params must match request body.",
          },
          400
        )
      }

      const result = await adminService.saveCurriculumVersionContent(input.data)

      switch (result.status) {
        case "ok":
          return context.json(result.value)
        case "invalid-request":
          return context.json(result.error, 400)
        case "not-found":
          return context.json(result.error, 404)
        case "conflict":
          return context.json(result.error, 409)
        case "unavailable":
          return context.json(result.error, 503)
      }
    }
  )

  app.post(
    "/courses/:courseId/curriculum/versions/:versionId/publish",
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

  app.post(
    "/courses/:courseId/curriculum/versions/:versionId/discard",
    requireAdminSession(auth),
    describeRoute({
      responses: {
        200: {
          description: "Discarded admin curriculum draft.",
        },
        400: {
          description: "Discard request is invalid.",
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
      const result = await adminService.discardCurriculumVersion(
        context.req.param("courseId"),
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

  app.get(
    "/courses/:courseId/lessons/:lessonId",
    requireAdminSession(auth),
    describeRoute({
      responses: {
        200: {
          description: "Admin lesson detail for a selected curriculum version.",
          content: {
            "application/json": {
              schema: resolver(adminEditorLessonDetailDtoSchema),
            },
          },
        },
        400: {
          description: "Lesson detail request is invalid.",
          content: jsonErrorResponse(adminInvalidRequestErrorDtoSchema),
        },
        401: {
          description: "Admin authentication is required.",
        },
        404: {
          description: "Lesson was not found.",
          content: jsonErrorResponse(adminNotFoundErrorDtoSchema),
        },
        503: {
          description: "Database is unavailable.",
          content: jsonErrorResponse(adminDatabaseUnavailableErrorDtoSchema),
        },
      },
    }),
    async (context) => {
      const versionId = context.req.query("version")?.trim()

      if (!versionId) {
        return context.json(
          {
            code: "invalid-request",
            message: "version query is required.",
          },
          400
        )
      }

      const result = await adminService.getCourseLessonDetail(
        context.req.param("courseId"),
        versionId,
        context.req.param("lessonId")
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

async function readJsonBody(request: Request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}
