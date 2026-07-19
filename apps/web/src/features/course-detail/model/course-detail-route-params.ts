import { z } from "zod"

const courseDetailRouteParamsSchema = z.object({
  id: z.string().min(1),
})

export function parseCourseDetailRouteParams(
  value: unknown
): { readonly id: string } | null {
  const result = courseDetailRouteParamsSchema.safeParse(value)
  return result.success ? result.data : null
}
