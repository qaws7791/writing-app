import { z } from "@hono/zod-openapi"
import {
  autosaveWritingBodySchema,
  autosaveWritingResponseSchema,
  writingIdParamSchema,
  toWritingId,
} from "@workspace/core"

import { BODY_LIMITS, withBodyLimit } from "../../http/body-limit-middleware"
import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { route } from "../../http/route"
import { unwrapOrThrow } from "../../http/unwrap-or-throw"
import { AutosaveWritingUseCase } from "../../runtime/tokens"

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
    security: [{ cookieAuth: [] }],
  },
  handler: async ({ autosaveWriting, body, params, context }) => {
    const userId = requireUserId(context)
    const result = await autosaveWriting(
      userId,
      toWritingId(params.writingId),
      body
    )
    const writing = unwrapOrThrow(result)
    return { writing, kind: "autosaved" as const }
  },
})
