import { userProfileSchema } from "@workspace/core/modules/users"
import { ResultAsync } from "neverthrow"

import {
  cookieSecurity,
  defaultErrorResponse,
} from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { route } from "../../http/route"
import { AuthUser } from "../../runtime/modules/auth"
import { ListCompletedJourneysUseCase } from "../../runtime/modules/journeys"
import { CountWritingsUseCase } from "../../runtime/modules/writings"

export default route({
  method: "get",
  path: "/users/profile",
  inject: {
    authUser: AuthUser,
    countWritings: CountWritingsUseCase,
    listCompletedJourneys: ListCompletedJourneysUseCase,
  },
  response: { 200: userProfileSchema, default: defaultErrorResponse },
  meta: {
    description: "현재 로그인한 사용자의 프로필과 기본 통계를 조회합니다.",
    summary: "프로필 조회",
    tags: ["사용자"],
    security: cookieSecurity,
  },
  handler: async ({
    authUser,
    countWritings,
    listCompletedJourneys,
    context,
  }) => {
    const userId = requireUserId(context)
    return ResultAsync.combine([
      listCompletedJourneys(userId),
      countWritings(userId),
    ]).map(([completedJourneys, writingCount]) => ({
      completedJourneyCount: completedJourneys.length,
      email: authUser?.email ?? "",
      emailVerified: authUser?.emailVerified ?? false,
      image: authUser?.image ?? null,
      name: authUser?.name ?? "",
      writingCount,
    }))
  },
})
