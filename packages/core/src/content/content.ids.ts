export type Brand<TValue, TBrand extends string> = TValue & {
  readonly __brand: TBrand
}

export type CourseId = Brand<string, "course-id">
export type CourseCategoryId = Brand<string, "course-category-id">
export type CourseChapterId = Brand<string, "course-chapter-id">
export type LessonId = Brand<string, "lesson-id">
export type LessonStepId = Brand<string, "lesson-step-id">

export function courseId(value: string): CourseId {
  return value as CourseId
}

export function courseCategoryId(value: string): CourseCategoryId {
  return value as CourseCategoryId
}

export function courseChapterId(value: string): CourseChapterId {
  return value as CourseChapterId
}

export function lessonId(value: string): LessonId {
  return value as LessonId
}

export function lessonStepId(value: string): LessonStepId {
  return value as LessonStepId
}
