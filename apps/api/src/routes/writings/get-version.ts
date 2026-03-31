import { z } from "@hono/zod-openapi"
import {
  writingVersionDetailSchema,
  writingIdParamSchema,
  versionParamSchema,
} from "@workspace/core/modules/writings"
import { toWritingId } from "@workspace/core"

import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { route } from "../../http/route"
import { unwrapOrThrow } from "../../http/unwrap-or-throw"
import { GetVersionUseCase } from "../../runtime/tokens"

export default route({
  method: "get",
  path: "/writings/{writingId}/versions/{version}",
  inject: { getVersion: GetVersionUseCase },
  request: {
    params: z.object({
      writingId: writingIdParamSchema,
      version: versionParamSchema,
    }),
  },
  response: {
    200: writingVersionDetailSchema,
    default: defaultErrorResponse,
  },
  meta: {
    description: "특정 버전의 문서 스냅샷을 조회합니다.",
    summary: "버전 상세 조회",
    tags: ["동기화"],
    security: [{ cookieAuth: [] }],
  },
  handler: async ({ getVersion, params, context }) => {
    const userId = requireUserId(context)
    const result = await getVersion(
      userId,
      toWritingId(params.writingId),
      params.version
    )
    return unwrapOrThrow(result)
  },
})
