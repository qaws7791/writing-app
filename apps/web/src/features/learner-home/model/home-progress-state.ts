import type { LearnerProgressCourse } from "@workspace/contracts/learning"

export type CompletedCoursesState =
  | { readonly status: "error" }
  | { readonly status: "idle" }
  | {
      readonly status: "loaded"
      readonly courses: readonly LearnerProgressCourse[]
      readonly loadMoreStatus: "error" | "idle" | "loading"
      readonly nextCursor: string | null
    }
  | { readonly status: "loading" }

export type ProgressCourseState = {
  readonly courses: readonly LearnerProgressCourse[]
  readonly loadMoreStatus: "error" | "idle" | "loading"
  readonly nextCursor: string | null
}

export function appendUniqueProgressCourses(
  current: readonly LearnerProgressCourse[],
  next: readonly LearnerProgressCourse[]
): readonly LearnerProgressCourse[] {
  const currentIds = new Set(current.map((course) => course.id))
  return [...current, ...next.filter((course) => !currentIds.has(course.id))]
}
