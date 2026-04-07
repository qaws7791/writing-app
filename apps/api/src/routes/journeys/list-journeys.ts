import {
  journeyFiltersQuerySchema,
  journeyListResponseSchema,
} from "@workspace/core"

import { defaultErrorResponse } from "../../http/openapi-helpers"
import { route } from "../../http/route"
import { unwrapOrThrow } from "../../http/unwrap-or-throw"
import { ListJourneysUseCase } from "../../runtime/tokens"

export default route({
  method: "get",
  path: "/journeys",
  inject: { listJourneys: ListJourneysUseCase },
  request: { query: journeyFiltersQuerySchema },
  response: { 200: journeyListResponseSchema, default: defaultErrorResponse },
  meta: {
    description: "여정 목록을 조회합니다.",
    summary: "여정 목록 조회",
    tags: ["여정"],
  },
  handler: async ({ listJourneys, query }) => {
    const result = await listJourneys(query)
    const journeys = unwrapOrThrow(result)
    return { items: journeys }
  },
})
