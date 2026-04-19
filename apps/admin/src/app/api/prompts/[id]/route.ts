import { NextResponse } from "next/server"
import { z } from "zod"

import { promptTypeSchema, toPromptId, toHttpStatus } from "@workspace/core"

import { withAdminAuth } from "@/lib/auth/require-admin"
import { getUseCases } from "@/lib/use-cases"

const updatePromptSchema = z.object({
  title: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  promptType: promptTypeSchema.optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
})

export const GET = withAdminAuth(async (_req, context) => {
  const { id } = await context.params
  const promptId = Number(id)
  if (Number.isNaN(promptId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const { getPrompt } = getUseCases()
  const result = await getPrompt(toPromptId(promptId), null)
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
  const promptId = Number(id)
  if (Number.isNaN(promptId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const parsed = updatePromptSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { updatePrompt } = getUseCases()
  const result = await updatePrompt(toPromptId(promptId), parsed.data)
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
  const promptId = Number(id)
  if (Number.isNaN(promptId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const { deletePrompt } = getUseCases()
  await deletePrompt(toPromptId(promptId))
  return NextResponse.json({ ok: true })
})
