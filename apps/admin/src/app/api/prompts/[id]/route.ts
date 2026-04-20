import { NextResponse } from "next/server"

import {
  promptIdParamSchema,
  updatePromptBodySchema,
} from "@workspace/core/modules/prompts"
import { parsePromptId } from "@workspace/core"

import { withAdminAuth } from "@/lib/auth/require-admin"
import {
  parseAdminJsonBody,
  parseAdminRouteParam,
  toAdminResultResponse,
} from "@/lib/api/admin-route"
import { getAdminRuntime } from "@/lib/runtime/admin-composition"

export const GET = withAdminAuth(async (_req, context) => {
  const { id } = await context.params
  const parsedPromptId = parseAdminRouteParam(id, promptIdParamSchema)
  if (parsedPromptId instanceof NextResponse) {
    return parsedPromptId
  }

  const { getPrompt } = getAdminRuntime().useCases
  return toAdminResultResponse(
    await getPrompt(parsePromptId(parsedPromptId), null)
  )
})

export const PUT = withAdminAuth(async (req, context) => {
  const { id } = await context.params
  const parsedPromptId = parseAdminRouteParam(id, promptIdParamSchema)
  if (parsedPromptId instanceof NextResponse) {
    return parsedPromptId
  }

  const parsed = await parseAdminJsonBody(req, updatePromptBodySchema)
  if (parsed instanceof NextResponse) {
    return parsed
  }

  const { updatePrompt } = getAdminRuntime().useCases
  return toAdminResultResponse(
    await updatePrompt(parsePromptId(parsedPromptId), parsed)
  )
})

export const DELETE = withAdminAuth(async (_req, context) => {
  const { id } = await context.params
  const parsedPromptId = parseAdminRouteParam(id, promptIdParamSchema)
  if (parsedPromptId instanceof NextResponse) {
    return parsedPromptId
  }

  const { deletePrompt } = getAdminRuntime().useCases
  await deletePrompt(parsePromptId(parsedPromptId))
  return NextResponse.json({ ok: true })
})
