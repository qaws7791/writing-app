import { z } from "@hono/zod-openapi"
import {
  writingDetailSchema,
  writingIdParamSchema,
  toWritingId,
} from "@workspace/core"

import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { route } from "../../http/route"
import { GetWritingUseCase } from "../../runtime/tokens"

export default route({
  method: "get",
  path: "/writings/{writingId}",
  inject: { getWriting: GetWritingUseCase },
  request: { params: z.object({ writingId: writingIdParamSchema }) },
  response: { 200: writingDetailSchema, default: defaultErrorResponse },
  meta: {
    description: "특정 글의 전체 내용을 조회합니다.",
    summary: "글 상세 조회",
    tags: ["글"],
    security: [{ cookieAuth: [] }],
  },
  handler: async ({ getWriting, params, context }) => {
    const userId = requireUserId(context)
    return getWriting(userId, toWritingId(params.writingId))
  },
})
