import { z } from "@hono/zod-openapi"
import {
  syncPushBodySchema,
  syncPushResponseSchema,
  writingIdParamSchema,
} from "@workspace/core/modules/writings"
import { toWritingId } from "@workspace/core"

import { BODY_LIMITS, withBodyLimit } from "../../http/body-limit-middleware"
import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { route } from "../../http/route"
import { unwrapOrThrow } from "../../http/unwrap-or-throw"
import { PushTransactionsUseCase } from "../../runtime/tokens"

export default route({
  method: "post",
  path: "/writings/{writingId}/sync/push",
  inject: { pushTransactions: PushTransactionsUseCase },
  middleware: [withBodyLimit(BODY_LIMITS.syncPush)],
  request: {
    body: syncPushBodySchema,
    params: z.object({ writingId: writingIdParamSchema }),
  },
  response: { 200: syncPushResponseSchema, default: defaultErrorResponse },
  meta: {
    description: "에디터 트랜잭션을 서버에 푸시하여 동기화합니다.",
    summary: "트랜잭션 푸시",
    tags: ["동기화"],
    security: [{ cookieAuth: [] }],
  },
  handler: async ({ pushTransactions, body, params, context }) => {
    const userId = requireUserId(context)
    const result = await pushTransactions(
      userId,
      toWritingId(params.writingId),
      body
    )
    return unwrapOrThrow(result)
  },
})
