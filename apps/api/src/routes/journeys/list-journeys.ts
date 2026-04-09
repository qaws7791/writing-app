import {
  journeyFiltersQuerySchema,
  journeyListResponseSchema,
} from "@workspace/core"

import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { route } from "../../http/route"
import { unwrapOrThrow } from "../../http/unwrap-or-throw"
import {
  ListJourneysUseCase,
  ListUserJourneysUseCase,
} from "../../runtime/tokens"

export default route({
  method: "get",
  path: "/journeys",
  inject: {
    listJourneys: ListJourneysUseCase,
    listUserJourneys: ListUserJourneysUseCase,
  },
  request: { query: journeyFiltersQuerySchema },
  response: { 200: journeyListResponseSchema, default: defaultErrorResponse },
  meta: {
    description:
      "여정 목록을 조회합니다. status 파라미터로 전체/진행중/완료 필터링이 가능합니다.",
    summary: "여정 목록 조회",
    tags: ["여정"],
  },
  handler: async ({ listJourneys, listUserJourneys, query, context }) => {
    if (query.status === "in_progress" || query.status === "completed") {
      const userId = requireUserId(context)
      const journeys = unwrapOrThrow(
        await listUserJourneys(userId, query.status)
      )
      return { items: journeys }
    }
    const result = await listJourneys({ category: query.category })
    const journeys = unwrapOrThrow(result)
    return { items: journeys }
  },
})
