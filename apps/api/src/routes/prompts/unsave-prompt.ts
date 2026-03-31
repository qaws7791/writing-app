import { z } from "@hono/zod-openapi"
import { promptIdParamSchema, toPromptId } from "@workspace/core"

import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { route } from "../../http/route"
import { UnsavePromptUseCase } from "../../runtime/tokens"

export default route({
  method: "delete",
  path: "/prompts/{promptId}/save",
  inject: { unsavePrompt: UnsavePromptUseCase },
  request: { params: z.object({ promptId: promptIdParamSchema }) },
  response: { 204: "글감 저장 해제 완료", default: defaultErrorResponse },
  meta: {
    description: "특정 글감을 저장 목록에서 제거합니다.",
    summary: "글감 저장 해제",
    tags: ["글감"],
    security: [{ cookieAuth: [] }],
  },
  handler: async ({ unsavePrompt, params, context }) => {
    const userId = requireUserId(context)
    return unsavePrompt(userId, toPromptId(params.promptId))
  },
})
