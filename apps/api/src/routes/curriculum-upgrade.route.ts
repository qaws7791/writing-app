import type { Context, Hono } from "hono"
import { describeRoute, resolver } from "hono-openapi"
import { z } from "zod"

import {
  courseId,
  courseNotFoundErrorDtoSchema,
  invalidContentSeedErrorDtoSchema,
} from "@workspace/core/content"
import {
  curriculumUpgradeApplicationDtoSchema,
  curriculumUpgradeNoticeDtoSchema,
  dismissCurriculumUpgradeDtoSchema,
  learningDatabaseUnavailableErrorDtoSchema,
  learningInvalidRequestErrorDtoSchema,
  learningNotFoundErrorDtoSchema,
  userId,
} from "@workspace/core/learning"

import { unauthorizedError } from "@/auth/session"
import type { ApiAppDependencies } from "@/app"
import { jsonErrorResponse } from "@/routes/error-response"

const unauthorizedErrorDtoSchema = z.object({
  code: z.literal("unauthorized"),
  message: z.string(),
})

const curriculumUpgradeNotFoundErrorDtoSchema = z.union([
  courseNotFoundErrorDtoSchema,
  learningNotFoundErrorDtoSchema,
])

export function registerCurriculumUpgradeRoute(
  app: Hono,
  {
    auth,
    learningService,
  }: Pick<ApiAppDependencies, "auth" | "learningService">
) {
  app.get(
    "/courses/:courseId/curriculum-upgrade",
    describeRoute({
      responses: {
        200: {
          description: "Current learner curriculum upgrade notice.",
          content: {
            "application/json": {
              schema: resolver(curriculumUpgradeNoticeDtoSchema),
            },
          },
        },
        401: {
          description: "Authentication is required.",
          content: jsonErrorResponse(unauthorizedErrorDtoSchema),
        },
        404: {
          description: "Course was not found.",
          content: jsonErrorResponse(courseNotFoundErrorDtoSchema),
        },
        500: {
          description: "Content seed is invalid.",
          content: jsonErrorResponse(invalidContentSeedErrorDtoSchema),
        },
        503: {
          description: "Database is unavailable.",
          content: jsonErrorResponse(learningDatabaseUnavailableErrorDtoSchema),
        },
      },
    }),
    async (context) => {
      const session = await auth.getSession(context.req.raw.headers)

      if (!session) {
        return context.json(unauthorizedError, 401)
      }

      const result = await learningService.getCurriculumUpgrade(
        userId(session.user.id),
        courseId(context.req.param("courseId"))
      )

      return jsonLearningResult(context, result)
    }
  )

  app.post(
    "/courses/:courseId/curriculum-upgrade",
    describeRoute({
      responses: {
        200: {
          description: "Applied current learner curriculum upgrade.",
          content: {
            "application/json": {
              schema: resolver(curriculumUpgradeApplicationDtoSchema),
            },
          },
        },
        400: {
          description: "Invalid upgrade request.",
          content: jsonErrorResponse(learningInvalidRequestErrorDtoSchema),
        },
        401: {
          description: "Authentication is required.",
          content: jsonErrorResponse(unauthorizedErrorDtoSchema),
        },
        404: {
          description: "Course or curriculum upgrade was not found.",
          content: jsonErrorResponse(curriculumUpgradeNotFoundErrorDtoSchema),
        },
        500: {
          description: "Content seed is invalid.",
          content: jsonErrorResponse(invalidContentSeedErrorDtoSchema),
        },
        503: {
          description: "Database is unavailable.",
          content: jsonErrorResponse(learningDatabaseUnavailableErrorDtoSchema),
        },
      },
    }),
    async (context) => {
      const session = await auth.getSession(context.req.raw.headers)

      if (!session) {
        return context.json(unauthorizedError, 401)
      }

      const result = await learningService.applyCurriculumUpgrade(
        userId(session.user.id),
        courseId(context.req.param("courseId"))
      )

      return jsonLearningResult(context, result)
    }
  )

  app.post(
    "/courses/:courseId/curriculum-upgrade/dismiss",
    describeRoute({
      responses: {
        200: {
          description: "Dismissed current learner curriculum upgrade notice.",
          content: {
            "application/json": {
              schema: resolver(dismissCurriculumUpgradeDtoSchema),
            },
          },
        },
        401: {
          description: "Authentication is required.",
          content: jsonErrorResponse(unauthorizedErrorDtoSchema),
        },
        404: {
          description: "Course or curriculum upgrade was not found.",
          content: jsonErrorResponse(curriculumUpgradeNotFoundErrorDtoSchema),
        },
        500: {
          description: "Content seed is invalid.",
          content: jsonErrorResponse(invalidContentSeedErrorDtoSchema),
        },
        503: {
          description: "Database is unavailable.",
          content: jsonErrorResponse(learningDatabaseUnavailableErrorDtoSchema),
        },
      },
    }),
    async (context) => {
      const session = await auth.getSession(context.req.raw.headers)

      if (!session) {
        return context.json(unauthorizedError, 401)
      }

      const result = await learningService.dismissCurriculumUpgrade(
        userId(session.user.id),
        courseId(context.req.param("courseId"))
      )

      return jsonLearningResult(context, result)
    }
  )
}

function jsonLearningResult(
  context: Context,
  result: {
    status:
      | "ok"
      | "invalid-request"
      | "not-found"
      | "invalid-content"
      | "unavailable"
    value?: unknown
    error?: unknown
  }
) {
  switch (result.status) {
    case "ok":
      return context.json(result.value)
    case "invalid-request":
      return context.json(result.error, 400)
    case "not-found":
      return context.json(result.error, 404)
    case "invalid-content":
      return context.json(result.error, 500)
    case "unavailable":
      return context.json(result.error, 503)
  }
}
