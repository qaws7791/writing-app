import type { Hono } from "hono"
import { describeRoute, resolver } from "hono-openapi"
import { z } from "zod"

import {
  learningDatabaseUnavailableErrorDtoSchema,
  profileDtoSchema,
  userId,
} from "@workspace/core/learning"

import { unauthorizedError } from "@/auth/session"
import type { ApiAppDependencies } from "@/app"
import { jsonErrorResponse } from "@/routes/error-response"

const unauthorizedErrorDtoSchema = z.object({
  code: z.literal("unauthorized"),
  message: z.string(),
})

export function registerProfileRoute(
  app: Hono,
  {
    auth,
    learningService,
  }: Pick<ApiAppDependencies, "auth" | "learningService">
) {
  app.get(
    "/profile",
    describeRoute({
      responses: {
        200: {
          description: "Current learner profile summary.",
          content: {
            "application/json": {
              schema: resolver(profileDtoSchema),
            },
          },
        },
        401: {
          description: "Authentication is required.",
          content: jsonErrorResponse(unauthorizedErrorDtoSchema),
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

      const result = await learningService.getProfile(userId(session.user.id))

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
  )
}
