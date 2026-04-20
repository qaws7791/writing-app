import { z } from "@hono/zod-openapi"
import {
  journeyDetailWithProgressSchema,
  journeyIdParamSchema,
} from "@workspace/core/modules/journeys"
import { parseJourneyId } from "@workspace/core"

import { defaultErrorResponse } from "../../http/openapi-helpers"
import { route } from "../../http/route"
import { GetJourneyUseCase } from "../../runtime/modules/journeys"

export default route({
  method: "get",
  path: "/journeys/{journeyId}",
  inject: { getJourney: GetJourneyUseCase },
  request: { params: z.object({ journeyId: journeyIdParamSchema }) },
  response: {
    200: journeyDetailWithProgressSchema,
    default: defaultErrorResponse,
  },
  meta: {
    description:
      "특정 여정의 상세 정보(세션 목록 및 진행률 포함)를 조회합니다.",
    summary: "여정 상세 조회",
    tags: ["여정"],
  },
  handler: async ({ getJourney, params, context }) => {
    const userId = context.get("userId")
    return getJourney(parseJourneyId(params.journeyId), userId)
  },
})
