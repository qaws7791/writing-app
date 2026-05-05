import { userProfileSchema } from "@workspace/core/modules/users"

import {
  cookieSecurity,
  defaultErrorResponse,
} from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { route } from "../../http/route"
import { AuthUser } from "../../runtime/modules/auth-tokens"

export default route({
  method: "get",
  path: "/users/profile",
  inject: {
    authUser: AuthUser,
  },
  response: { 200: userProfileSchema, default: defaultErrorResponse },
  meta: {
    description: "현재 로그인한 사용자의 프로필과 기본 통계를 조회합니다.",
    summary: "프로필 조회",
    tags: ["사용자"],
    security: cookieSecurity,
  },
  handler: async ({ authUser, context }) => {
    requireUserId(context)
    return {
      email: authUser?.email ?? "",
      emailVerified: authUser?.emailVerified ?? false,
      gardenCardCount: 0,
      image: authUser?.image ?? null,
      name: authUser?.name ?? "",
      sentenceCount: 0,
    }
  },
})
