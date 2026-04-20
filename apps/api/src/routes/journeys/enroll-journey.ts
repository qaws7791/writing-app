import { z } from "@hono/zod-openapi"
import { userJourneyProgressSchema } from "@workspace/core/modules/progress"
import { journeyIdParamSchema } from "@workspace/core/modules/journeys"
import { parseJourneyId } from "@workspace/core"

import {
  cookieSecurity,
  defaultErrorResponse,
} from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { route } from "../../http/route"
import { EnrollJourneyUseCase } from "../../runtime/modules/journeys"

export default route({
  method: "post",
  path: "/journeys/{journeyId}/enroll",
  inject: { enrollJourney: EnrollJourneyUseCase },
  request: { params: z.object({ journeyId: journeyIdParamSchema }) },
  response: { 201: userJourneyProgressSchema, default: defaultErrorResponse },
  meta: {
    description: "여정에 등록합니다.",
    summary: "여정 등록",
    tags: ["여정"],
    security: cookieSecurity,
  },
  handler: async ({ enrollJourney, params, context }) => {
    const userId = requireUserId(context)
    return enrollJourney(userId, parseJourneyId(params.journeyId))
  },
})
