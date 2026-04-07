import { z } from "@hono/zod-openapi"
import {
  journeyDetailSchema,
  journeyIdParamSchema,
  toJourneyId,
} from "@workspace/core"

import { defaultErrorResponse } from "../../http/openapi-helpers"
import { route } from "../../http/route"
import { unwrapOrThrow } from "../../http/unwrap-or-throw"
import { GetJourneyUseCase } from "../../runtime/tokens"

export default route({
  method: "get",
  path: "/journeys/{journeyId}",
  inject: { getJourney: GetJourneyUseCase },
  request: { params: z.object({ journeyId: journeyIdParamSchema }) },
  response: { 200: journeyDetailSchema, default: defaultErrorResponse },
  meta: {
    description: "특정 여정의 상세 정보(세션 목록 포함)를 조회합니다.",
    summary: "여정 상세 조회",
    tags: ["여정"],
  },
  handler: async ({ getJourney, params }) => {
    const result = await getJourney(toJourneyId(params.journeyId))
    return unwrapOrThrow(result)
  },
})
