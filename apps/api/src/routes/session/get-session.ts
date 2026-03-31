import { z } from "@hono/zod-openapi"

import { defaultErrorResponse } from "../../http/openapi-helpers"
import { route } from "../../http/route"
import { UnauthorizedError } from "../../http/unauthorized-error"
import { AuthSession, AuthUser } from "../../runtime/tokens"

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

export default route({
  method: "get",
  path: "/session",
  inject: { authUser: AuthUser, authSession: AuthSession },
  response: { 200: sessionResponseSchema, default: defaultErrorResponse },
  meta: {
    description: "현재 인증된 사용자의 세션 정보를 반환합니다.",
    summary: "세션 조회",
    tags: ["인증"],
    security: [{ cookieAuth: [] }],
  },
  handler: ({ authUser, authSession }) => {
    if (!authUser || !authSession) {
      throw new UnauthorizedError("로그인이 필요합니다.")
    }
    return { session: authSession, user: authUser }
  },
})
