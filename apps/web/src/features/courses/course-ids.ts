export type Brand<TValue, TBrand extends string> = TValue & {
  readonly __brand: TBrand
}

export type CourseId = Brand<string, "course-id">

export function courseId(value: string): CourseId {
  return value as CourseId
}
