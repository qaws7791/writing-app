import { NextResponse } from "next/server"
import { z } from "zod"

import { journeyCategorySchema } from "@workspace/core"

import { withAdminAuth } from "@/lib/auth/require-admin"
import { getUseCases } from "@/lib/use-cases"

const createJourneySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: journeyCategorySchema,
  thumbnailUrl: z.string().url().nullable().optional(),
})

export const GET = withAdminAuth(async (req) => {
  const { searchParams } = req.nextUrl
  const category = searchParams.get("category")
  const { listJourneys } = getUseCases()

  const filters =
    category && journeyCategorySchema.safeParse(category).success
      ? { category: journeyCategorySchema.parse(category) }
      : undefined

  const items = (await listJourneys(filters))._unsafeUnwrap()
  return NextResponse.json({ items })
})

export const POST = withAdminAuth(async (req) => {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const parsed = createJourneySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { createJourney } = getUseCases()
  const journey = (await createJourney(parsed.data))._unsafeUnwrap()
  return NextResponse.json(journey, { status: 201 })
})
