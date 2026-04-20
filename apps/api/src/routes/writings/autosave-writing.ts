import { z } from "@hono/zod-openapi"
import {
  autosaveWritingBodySchema,
  autosaveWritingResponseSchema,
  writingIdParamSchema,
} from "@workspace/core/modules/writings"
import { parseWritingId } from "@workspace/core"

import { BODY_LIMITS, withBodyLimit } from "../../http/body-limit-middleware"
import {
  cookieSecurity,
  defaultErrorResponse,
} from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { route } from "../../http/route"
import { AutosaveWritingUseCase } from "../../runtime/modules/writings"

export default route({
  method: "patch",
  path: "/writings/{writingId}",
  inject: { autosaveWriting: AutosaveWritingUseCase },
  middleware: [withBodyLimit(BODY_LIMITS.document)],
  request: {
    body: autosaveWritingBodySchema,
    params: z.object({ writingId: writingIdParamSchema }),
  },
  response: {
    200: autosaveWritingResponseSchema,
    default: defaultErrorResponse,
  },
  meta: {
    description: "글의 제목 또는 본문을 자동 저장합니다.",
    summary: "글 자동 저장",
    tags: ["글"],
    security: cookieSecurity,
  },
  handler: async ({ autosaveWriting, body, params, context }) => {
    const userId = requireUserId(context)
    return (
      await autosaveWriting(userId, parseWritingId(params.writingId), body)
    ).map((writing) => ({
      writing,
      kind: "autosaved" as const,
    }))
  },
})
