import { z } from "zod"

const passwordResetSearchParamsSchema = z.object({
  error: z.union([z.string(), z.array(z.string())]).optional(),
  token: z.union([z.string(), z.array(z.string())]).optional(),
})

export function parsePasswordResetSearchParams(value: unknown): {
  readonly token: string | undefined
} {
  const result = passwordResetSearchParamsSchema.safeParse(value)
  if (!result.success || readFirst(result.data.error) !== undefined) {
    return { token: undefined }
  }

  const token = readFirst(result.data.token)?.trim()
  return { token: token === "" ? undefined : token }
}

function readFirst(
  value: readonly string[] | string | undefined
): string | undefined {
  return typeof value === "string" ? value : value?.[0]
}
