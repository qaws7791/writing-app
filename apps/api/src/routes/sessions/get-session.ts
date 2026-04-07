import { z } from "@hono/zod-openapi"
import {
  journeySessionDetailSchema,
  sessionIdParamSchema,
  toSessionId,
} from "@workspace/core"

import { defaultErrorResponse } from "../../http/openapi-helpers"
import { route } from "../../http/route"
import { unwrapOrThrow } from "../../http/unwrap-or-throw"
import { GetSessionDetailUseCase } from "../../runtime/tokens"

export default route({
  method: "get",
  path: "/sessions/{sessionId}",
  inject: { getSessionDetail: GetSessionDetailUseCase },
  request: { params: z.object({ sessionId: sessionIdParamSchema }) },
  response: {
    200: journeySessionDetailSchema,
    default: defaultErrorResponse,
  },
  meta: {
    description: "특정 세션의 상세 정보(스텝 목록 포함)를 조회합니다.",
    summary: "세션 상세 조회",
    tags: ["세션"],
  },
  handler: async ({ getSessionDetail, params }) => {
    const result = await getSessionDetail(toSessionId(params.sessionId))
    return unwrapOrThrow(result)
  },
})
