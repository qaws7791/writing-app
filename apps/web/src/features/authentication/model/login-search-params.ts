import { z } from "zod"

const loginSearchParamsSchema = z.object({
  next: z.union([z.string(), z.array(z.string())]).optional(),
})

export function parseLoginSearchParams(value: unknown): {
  readonly next: readonly string[] | string | undefined
} {
  const result = loginSearchParamsSchema.safeParse(value)
  return { next: result.success ? result.data.next : undefined }
}
