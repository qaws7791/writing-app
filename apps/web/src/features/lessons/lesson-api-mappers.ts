import { lessonId, lessonStepId } from "@/features/lessons/lesson-data"
import type { Lesson, LessonStep } from "@/features/lessons/lesson-types"

interface LessonDto {
  id: string
  title: string
  categoryId: string
  courseId: string
  unitNumber: number
  nextLessonId?: string
  steps: readonly LessonStepDto[]
}

type LessonStepDto = Omit<LessonStep, "id"> & {
  id: string
}

export function mapLessonDto(dto: LessonDto): Lesson {
  return {
    id: lessonId(dto.id),
    title: dto.title,
    categoryId: dto.categoryId,
    courseId: dto.courseId,
    unitNumber: dto.unitNumber,
    nextLessonId: dto.nextLessonId ? lessonId(dto.nextLessonId) : undefined,
    steps: dto.steps.map((step) => ({
      ...step,
      id: lessonStepId(step.id),
    })) as Lesson["steps"],
  }
}
