import { z } from "@workspace/http-platform/zod"

export function positiveResourceIntegerQuery(input: {
  readonly fallback: number
  readonly max: number
}) {
  return z
    .string()
    .optional()
    .transform((value, context) => {
      if (value === undefined) return input.fallback
      if (!/^\d+$/u.test(value)) {
        context.addIssue({
          code: "custom",
          message: "Expected a positive integer",
        })
        return z.NEVER
      }
      const parsed = Number(value)
      if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > input.max) {
        context.addIssue({
          code: "custom",
          message: `Expected an integer between 1 and ${input.max}`,
        })
        return z.NEVER
      }
      return parsed
    })
}
