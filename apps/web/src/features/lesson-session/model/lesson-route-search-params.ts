import { z } from "zod"

const lessonIdSchema = z.preprocess(
  (value) => (Array.isArray(value) ? value[0] : value),
  z.string().trim().min(1).optional()
)

const lessonRouteSearchParamsSchema = z.object({
  lesson_id: lessonIdSchema,
})

export function parseLessonRouteSearchParams(value: unknown): {
  readonly lessonId: string | undefined
} {
  const result = lessonRouteSearchParamsSchema.parse(value)
  return { lessonId: result.lesson_id }
}
