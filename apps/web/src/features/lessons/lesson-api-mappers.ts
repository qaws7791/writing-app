import { lessonId, lessonStepId } from "@/features/lessons/lesson-ids"
import type {
  AiFeedbackContent,
  Lesson,
  LessonStep,
} from "@/features/lessons/lesson-types"

interface LessonDto {
  id: string
  title: string
  categoryId: string
  courseId: string
  unitNumber: number
  nextLessonId?: string
  steps: readonly LessonStepDto[]
}

interface LessonStepDto {
  id: string
  type: LessonStep["type"]
  order: number
  points: number
  required: boolean
  content: unknown
}

export function mapLessonDto(dto: LessonDto): Lesson {
  return {
    id: lessonId(dto.id),
    title: dto.title,
    categoryId: dto.categoryId,
    courseId: dto.courseId,
    unitNumber: dto.unitNumber,
    nextLessonId: dto.nextLessonId ? lessonId(dto.nextLessonId) : undefined,
    steps: dto.steps.map(mapLessonStep),
  }
}

function mapLessonStep(dto: LessonStepDto): LessonStep {
  const step = {
    id: lessonStepId(dto.id),
    type: dto.type,
    order: dto.order,
    points: dto.points,
    required: dto.required,
    content:
      dto.type === "AI_FEEDBACK"
        ? mapAiFeedbackContent(dto.content)
        : dto.content,
  }

  return step as LessonStep
}

function mapAiFeedbackContent(content: unknown): AiFeedbackContent {
  if (!isObject(content)) {
    return content as AiFeedbackContent
  }

  return {
    ...content,
    sourceStepId: lessonStepId(String(content["sourceStepId"])),
  } as AiFeedbackContent
}

function isObject(
  value: unknown
): value is { readonly [key: string]: unknown } {
  return typeof value === "object" && value !== null
}
