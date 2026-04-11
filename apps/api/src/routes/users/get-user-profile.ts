import { z } from "@hono/zod-openapi"

import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { route } from "../../http/route"
import { unwrapOrThrow } from "../../http/unwrap-or-throw"
import {
  AuthUser,
  ListCompletedJourneysUseCase,
  ListWritingsUseCase,
} from "../../runtime/tokens"

const userProfileSchema = z.object({
  completedJourneyCount: z.number().int(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  image: z.string().nullable().optional(),
  name: z.string(),
  writingCount: z.number().int(),
})

export default route({
  method: "get",
  path: "/users/profile",
  inject: {
    authUser: AuthUser,
    listCompletedJourneys: ListCompletedJourneysUseCase,
    listWritings: ListWritingsUseCase,
  },
  response: { 200: userProfileSchema, default: defaultErrorResponse },
  meta: {
    description: "현재 로그인한 사용자의 프로필과 기본 통계를 조회합니다.",
    summary: "프로필 조회",
    tags: ["사용자"],
    security: [{ cookieAuth: [] }],
  },
  handler: async ({
    authUser,
    listCompletedJourneys,
    listWritings,
    context,
  }) => {
    const userId = requireUserId(context)
    const completedJourneys = unwrapOrThrow(await listCompletedJourneys(userId))

    let cursor: string | undefined
    let writingCount = 0

    do {
      const page = unwrapOrThrow(
        await listWritings(userId, {
          cursor,
          limit: 100,
        })
      )
      writingCount += page.items.length
      cursor = page.nextCursor ?? undefined
    } while (cursor)

    return {
      completedJourneyCount: completedJourneys.length,
      email: authUser?.email ?? "",
      emailVerified: authUser?.emailVerified ?? false,
      image: authUser?.image ?? null,
      name: authUser?.name ?? "",
      writingCount,
    }
  },
})
