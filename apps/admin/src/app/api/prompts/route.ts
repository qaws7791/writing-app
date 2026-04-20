import { NextResponse } from "next/server"

import {
  createPromptBodySchema,
  promptFiltersQuerySchema,
} from "@workspace/core/modules/prompts"
import { parsePromptId } from "@workspace/core"

import { withAdminAuth } from "@/lib/auth/require-admin"
import {
  parseAdminJsonBody,
  toAdminResultResponse,
} from "@/lib/api/admin-route"
import { getAdminRuntime } from "@/lib/runtime/admin-composition"

export const GET = withAdminAuth(async (req) => {
  const parsed = promptFiltersQuerySchema.safeParse({
    promptType: req.nextUrl.searchParams.get("type") ?? undefined,
    cursor: req.nextUrl.searchParams.get("cursor") ?? undefined,
    limit: req.nextUrl.searchParams.get("limit") ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { listPrompts } = getAdminRuntime().useCases
  return toAdminResultResponse(
    await listPrompts(null, {
      promptType: parsed.data.promptType,
      cursor:
        parsed.data.cursor === undefined
          ? undefined
          : parsePromptId(parsed.data.cursor),
      limit: parsed.data.limit,
    })
  )
})

export const POST = withAdminAuth(async (req) => {
  const parsed = await parseAdminJsonBody(req, createPromptBodySchema)
  if (parsed instanceof NextResponse) {
    return parsed
  }

  const { createPrompt } = getAdminRuntime().useCases
  return toAdminResultResponse(await createPrompt(parsed), { status: 201 })
})
