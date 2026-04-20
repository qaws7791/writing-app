import { meResponseSchema } from "@workspace/core/modules/auth"
import { UnauthorizedError } from "@workspace/core"

import {
  cookieSecurity,
  defaultErrorResponse,
} from "../../http/openapi-helpers"
import { route } from "../../http/route"
import { AuthSession, AuthUser } from "../../runtime/modules/auth"

export default route({
  method: "get",
  path: "/me",
  inject: { authUser: AuthUser, authSession: AuthSession },
  response: { 200: meResponseSchema, default: defaultErrorResponse },
  meta: {
    description: "현재 인증된 사용자의 세션 정보를 반환합니다.",
    summary: "세션 조회",
    tags: ["인증"],
    security: cookieSecurity,
  },
  handler: ({ authUser, authSession }) => {
    if (!authUser || !authSession) {
      throw new UnauthorizedError("로그인이 필요합니다.")
    }
    return { session: authSession, user: authUser }
  },
})
