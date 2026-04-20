import { NextResponse } from "next/server"

import {
  parsePromptId,
  promptIdParamSchema,
  toHttpStatus,
  updatePromptBodySchema,
} from "@workspace/core"

import { withAdminAuth } from "@/lib/auth/require-admin"
import { getAdminRuntime } from "@/lib/runtime/admin-composition"

export const GET = withAdminAuth(async (_req, context) => {
  const { id } = await context.params
  const parsedPromptId = promptIdParamSchema.safeParse(id)
  if (!parsedPromptId.success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const { getPrompt } = getAdminRuntime().useCases
  const result = await getPrompt(parsePromptId(parsedPromptId.data), null)
  if (result.isErr()) {
    return NextResponse.json(
      { error: result.error.message },
      { status: toHttpStatus(result.error) }
    )
  }
  return NextResponse.json(result.value)
})

export const PUT = withAdminAuth(async (req, context) => {
  const { id } = await context.params
  const parsedPromptId = promptIdParamSchema.safeParse(id)
  if (!parsedPromptId.success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const parsed = updatePromptBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { updatePrompt } = getAdminRuntime().useCases
  const result = await updatePrompt(
    parsePromptId(parsedPromptId.data),
    parsed.data
  )
  if (result.isErr()) {
    return NextResponse.json(
      { error: result.error.message },
      { status: toHttpStatus(result.error) }
    )
  }
  return NextResponse.json(result.value)
})

export const DELETE = withAdminAuth(async (_req, context) => {
  const { id } = await context.params
  const parsedPromptId = promptIdParamSchema.safeParse(id)
  if (!parsedPromptId.success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const { deletePrompt } = getAdminRuntime().useCases
  await deletePrompt(parsePromptId(parsedPromptId.data))
  return NextResponse.json({ ok: true })
})
