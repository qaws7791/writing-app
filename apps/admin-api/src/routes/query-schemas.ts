import { z } from "@workspace/hono/zod"

export function positiveIntegerQuery(input: {
  readonly fallback: number
  readonly max?: number
}) {
  const schema = z.coerce.number().int().positive()

  return (input.max === undefined ? schema : schema.max(input.max))
    .optional()
    .default(input.fallback)
}
