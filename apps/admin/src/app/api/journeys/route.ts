import { NextResponse } from "next/server"

import {
  createJourneyBodySchema,
  journeyFiltersQuerySchema,
} from "@workspace/core/modules/journeys"

import { withAdminAuth } from "@/lib/auth/require-admin"
import {
  parseAdminJsonBody,
  toAdminResultResponse,
} from "@/lib/api/admin-route"
import { getAdminRuntime } from "@/lib/runtime/admin-composition"

export const GET = withAdminAuth(async (req) => {
  const parsedFilters = journeyFiltersQuerySchema.safeParse({
    category: req.nextUrl.searchParams.get("category") ?? undefined,
    status: req.nextUrl.searchParams.get("status") ?? undefined,
  })

  if (!parsedFilters.success) {
    return NextResponse.json(
      { error: parsedFilters.error.flatten() },
      { status: 422 }
    )
  }

  const { listJourneys } = getAdminRuntime().useCases
  return toAdminResultResponse(await listJourneys(parsedFilters.data), {
    mapData: (items) => ({ items }),
  })
})

export const POST = withAdminAuth(async (req) => {
  const parsed = await parseAdminJsonBody(req, createJourneyBodySchema)
  if (parsed instanceof NextResponse) {
    return parsed
  }

  const { createJourney } = getAdminRuntime().useCases
  return toAdminResultResponse(await createJourney(parsed), { status: 201 })
})
