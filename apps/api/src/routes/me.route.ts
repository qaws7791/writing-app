import type { Hono } from "hono"
import { describeRoute, resolver } from "hono-openapi"
import { z } from "zod"

import type { AuthRuntime } from "@/auth/session"
import { unauthorizedError } from "@/auth/session"
import { jsonErrorResponse } from "@/routes/error-response"

const currentUserDtoSchema = z.object({
  email: z.string().email(),
  id: z.string().min(1),
  image: z.string().nullable(),
  name: z.string().min(1),
})

const unauthorizedErrorDtoSchema = z.object({
  code: z.literal("unauthorized"),
  message: z.string(),
})

export function registerMeRoute(app: Hono, auth: AuthRuntime) {
  app.get(
    "/me",
    describeRoute({
      responses: {
        200: {
          description: "현재 인증된 사용자입니다.",
          content: {
            "application/json": {
              schema: resolver(currentUserDtoSchema),
            },
          },
        },
        401: {
          description: "로그인이 필요합니다.",
          content: jsonErrorResponse(unauthorizedErrorDtoSchema),
        },
      },
    }),
    async (context) => {
      const session = await auth.getSession(context.req.raw.headers)

      if (!session) {
        return context.json(unauthorizedError, 401)
      }

      return context.json(session.user)
    }
  )
}
