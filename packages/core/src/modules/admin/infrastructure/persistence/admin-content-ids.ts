import type {
  CourseId,
  LessonId,
  LessonStepId,
  UnitId,
} from "#core/modules/content/domain/content.ids"

export type NewAdminCourseContentIds = {
  readonly courseId: CourseId
  readonly unitId: UnitId
  readonly lessonId: LessonId
  readonly readingStepId: LessonStepId
  readonly writeStepId: LessonStepId
}

export type CreateAdminCourseContentIds = () => NewAdminCourseContentIds

export function createDefaultAdminCourseContentIds(): NewAdminCourseContentIds {
  const courseId = toCourseId(`course-${crypto.randomUUID()}`)
  const lessonId = toLessonId(`${courseId}-lesson-1`)

  return {
    courseId,
    lessonId,
    readingStepId: toLessonStepId(`${lessonId}-step-reading`),
    unitId: toUnitId(`${courseId}-unit-1`),
    writeStepId: toLessonStepId(`${lessonId}-step-write`),
  }
}

export function toCourseId(value: string): CourseId {
  return value as CourseId
}

export function toLessonId(value: string): LessonId {
  return value as LessonId
}

export function toLessonStepId(value: string): LessonStepId {
  return value as LessonStepId
}

export function toUnitId(value: string): UnitId {
  return value as UnitId
}
