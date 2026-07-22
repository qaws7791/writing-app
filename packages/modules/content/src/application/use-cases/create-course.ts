import { err, type Result } from "@workspace/kernel/result"

import {
  authorizeContentMutation,
  type ContentActor,
} from "#content/domain/content-admin-policy"
import type { ContentError } from "#content/domain/content-error"
import type { CourseEditorDocument } from "#content/application/ports/content-ports"
import type { ContentApplicationDependencies } from "#content/application/ports/content-ports"

export type CreateCourseUseCase = (
  actor: ContentActor
) => Promise<Result<CourseEditorDocument, ContentError>>

export function createCreateCourseUseCase(
  dependencies: ContentApplicationDependencies
): CreateCourseUseCase {
  return async (actor) => {
    const authorization = authorizeContentMutation(actor)
    if (authorization.isErr()) return err(authorization.error)

    return dependencies.repository.createCourse({
      courseId: dependencies.courseIdGenerator.next(),
      now: dependencies.clock.now(),
    })
  }
}
