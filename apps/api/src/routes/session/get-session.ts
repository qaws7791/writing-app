import { createRoute, z } from "@hono/zod-openapi"

import { createRouter } from "../../http/create-router"
import { defaultErrorResponse } from "../../http/openapi-helpers"
import { UnauthorizedError } from "../../http/unauthorized-error"

const sessionResponseSchema = z.object({
  session: z.object({
    createdAt: z.union([z.string(), z.date()]),
    expiresAt: z.union([z.string(), z.date()]),
    id: z.string(),
    ipAddress: z.string().nullable().optional(),
    token: z.string(),
    updatedAt: z.union([z.string(), z.date()]),
    userAgent: z.string().nullable().optional(),
    userId: z.string(),
  }),
  user: z.object({
    email: z.string(),
    emailVerified: z.boolean(),
    id: z.string(),
    image: z.string().nullable().optional(),
    name: z.string(),
  }),
})

const route = createRoute({
  description: "현재 인증된 사용자의 세션 정보를 반환합니다.",
  method: "get",
  path: "/session",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: sessionResponseSchema,
        },
      },
      description: "세션 정보",
    },
    default: defaultErrorResponse,
  },
  security: [{ cookieAuth: [] }],
  summary: "세션 조회",
  tags: ["인증"],
})

const app = createRouter()

app.openapi(route, (c) => {
  const user = c.get("authUser")
  const session = c.get("authSession")

  if (!user || !session) {
    throw new UnauthorizedError("로그인이 필요합니다.")
  }

  return c.json({ session, user }, 200)
})

export default app
