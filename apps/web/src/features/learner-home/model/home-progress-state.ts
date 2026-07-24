import type { LearnerProgressCourseDto } from "@/shared/http/learner-api-client"

export type CompletedCoursesState =
  | { readonly message: string; readonly status: "error" }
  | { readonly status: "idle" }
  | {
      readonly courses: readonly LearnerProgressCourseDto[]
      readonly loadMoreError: string | null
      readonly loadMoreStatus: "error" | "idle" | "loading"
      readonly nextCursor: string | null
      readonly status: "loaded"
    }
  | { readonly status: "loading" }

export type ProgressCourseState = {
  readonly courses: readonly LearnerProgressCourseDto[]
  readonly loadMoreError: string | null
  readonly loadMoreStatus: "error" | "idle" | "loading"
  readonly nextCursor: string | null
}

export function appendUniqueProgressCourses(
  current: readonly LearnerProgressCourseDto[],
  next: readonly LearnerProgressCourseDto[]
): readonly LearnerProgressCourseDto[] {
  const currentIds = new Set(current.map((course) => course.id))
  return [...current, ...next.filter((course) => !currentIds.has(course.id))]
}
