import type { CourseId } from "@workspace/types/ids"

import type {
  ContentRepository,
  CourseEditorDocument,
} from "#content/application/ports/content-ports"

export type ReadCourseEditorUseCase = (
  courseId: CourseId
) => Promise<CourseEditorDocument | null>

export function createReadCourseEditorUseCase(
  repository: ContentRepository
): ReadCourseEditorUseCase {
  return (courseId) => repository.readCourseEditor(courseId)
}
