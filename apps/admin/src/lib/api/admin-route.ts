import { NextResponse } from "next/server"
import type { Result } from "neverthrow"
import { toHttpStatus, type DomainError } from "@workspace/core/shared"
import type { z } from "zod"

export function invalidAdminRequest(message = "Invalid id") {
  return NextResponse.json({ error: message }, { status: 400 })
}

export function parseAdminRouteParam<TSchema extends z.ZodType>(
  value: string | undefined,
  schema: TSchema,
  message = "Invalid id"
) {
  if (value === undefined) {
    return invalidAdminRequest(message)
  }

  const parsed = schema.safeParse(value)
  if (!parsed.success) {
    return invalidAdminRequest(message)
  }

  return parsed.data
}

export async function parseAdminJsonBody<TSchema extends z.ZodType>(
  request: Request,
  schema: TSchema
) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return invalidAdminRequest("Invalid request body")
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  return parsed.data
}

export function toAdminResultResponse<TData>(
  result: Result<TData, DomainError>,
  options?: {
    mapData?: (data: TData) => unknown
    successResponse?: (data: TData) => NextResponse
    status?: number
  }
) {
  return result.match(
    (value) => {
      if (options?.successResponse) {
        return options.successResponse(value)
      }

      return NextResponse.json(
        options?.mapData ? options.mapData(value) : value,
        {
          status: options?.status ?? 200,
        }
      )
    },
    (error) =>
      NextResponse.json(
        { error: error.message },
        { status: toHttpStatus(error) }
      )
  )
}
