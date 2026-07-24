import type { Result } from "@workspace/kernel/result"
import type { AdminId } from "@workspace/types/ids"

import type { ContentError } from "#content/domain/content-error"
import type { CourseEditorDocument } from "#content/application/ports/content-ports"
import type { ContentApplicationDependencies } from "#content/application/ports/content-ports"

export type CreateCourseUseCase = (
  adminId: AdminId
) => Promise<Result<CourseEditorDocument, ContentError>>

export function createCreateCourseUseCase(
  dependencies: ContentApplicationDependencies
): CreateCourseUseCase {
  return async (_adminId) => {
    return dependencies.repository.createCourse({
      courseId: dependencies.courseIdGenerator.next(),
      now: dependencies.clock.now(),
    })
  }
}
