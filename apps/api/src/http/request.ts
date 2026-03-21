import type { Context } from "hono"
import { z } from "zod"

import { ValidationError } from "@workspace/backend-core"

export async function parseJsonBody<TSchema extends z.ZodTypeAny>(
  context: Context,
  schema: TSchema
): Promise<z.infer<TSchema>> {
  const body = (await context.req.json()) as unknown

  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.issues[0]?.message ?? "잘못된 요청입니다."
    )
  }

  return parsed.data
}

export function parseValue<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  value: unknown
): z.infer<TSchema> {
  const parsed = schema.safeParse(value)

  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.issues[0]?.message ?? "잘못된 요청입니다."
    )
  }

  return parsed.data
}
