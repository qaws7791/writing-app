import { z } from "@hono/zod-openapi"
import { writingIdParamSchema, toWritingId } from "@workspace/core"

import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { route } from "../../http/route"
import { DeleteWritingUseCase } from "../../runtime/tokens"

export default route({
  method: "delete",
  path: "/writings/{writingId}",
  inject: { deleteWriting: DeleteWritingUseCase },
  request: { params: z.object({ writingId: writingIdParamSchema }) },
  response: { 204: "글 삭제 완료", default: defaultErrorResponse },
  meta: {
    description: "특정 글을 영구적으로 삭제합니다.",
    summary: "글 삭제",
    tags: ["글"],
    security: [{ cookieAuth: [] }],
  },
  handler: async ({ deleteWriting, params, context }) => {
    const userId = requireUserId(context)
    return deleteWriting(userId, toWritingId(params.writingId))
  },
})
