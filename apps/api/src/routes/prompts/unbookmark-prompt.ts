import { z } from "@hono/zod-openapi"
import { promptIdParamSchema, toPromptId } from "@workspace/core"

import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { route } from "../../http/route"
import { UnbookmarkPromptUseCase } from "../../runtime/tokens"

export default route({
  method: "delete",
  path: "/prompts/{promptId}/bookmark",
  inject: { unbookmarkPrompt: UnbookmarkPromptUseCase },
  request: { params: z.object({ promptId: promptIdParamSchema }) },
  response: { 204: "북마크 해제 완료", default: defaultErrorResponse },
  meta: {
    description: "글감 북마크를 해제합니다.",
    summary: "글감 북마크 해제",
    tags: ["글감"],
    security: [{ cookieAuth: [] }],
  },
  handler: async ({ unbookmarkPrompt, params, context }) => {
    const userId = requireUserId(context)
    await unbookmarkPrompt(userId, toPromptId(params.promptId))
  },
})
