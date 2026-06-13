import type { Lesson } from "@/features/lessons/lesson-types"
import type { ApiLessonResponse } from "@/lib/api/writing-app-api"

export function mapLesson(response: ApiLessonResponse): Lesson {
  return {
    category: response.category,
    courseId: response.courseId,
    description: response.description,
    estimatedMinutes: response.estimatedMinutes,
    id: response.id,
    steps: response.steps.map((step) => ({
      id: step.id,
      order: step.sortOrder,
      type: step.type,
    })),
    summary: response.summary,
    title: response.title,
    unitId: response.unitId,
  }
}
