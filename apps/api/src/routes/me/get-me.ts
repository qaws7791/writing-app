import { z } from "@hono/zod-openapi"
import { UnauthorizedError } from "@workspace/core"

import {
  authenticatedSessionSchema,
  authenticatedUserSchema,
} from "../../auth/auth-schemas"
import { defaultErrorResponse } from "../../http/openapi-helpers"
import { route } from "../../http/route"
import { AuthSession, AuthUser } from "../../runtime/tokens"

const meResponseSchema = z.object({
  session: authenticatedSessionSchema,
  user: authenticatedUserSchema,
})

export default route({
  method: "get",
  path: "/me",
  inject: { authUser: AuthUser, authSession: AuthSession },
  response: { 200: meResponseSchema, default: defaultErrorResponse },
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
