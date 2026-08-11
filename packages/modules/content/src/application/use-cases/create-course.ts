import type { Result } from "@workspace/kernel/result"
import type { AdminId } from "@workspace/types/ids"
import type { CourseCategory } from "@workspace/contracts/content/category"

import type { ContentError } from "#content/domain/content-error"
import type { CourseEditorDocument } from "#content/application/ports/content-ports"
import type { ContentApplicationDependencies } from "#content/application/ports/content-ports"

type CreateCourseInput = Readonly<{
  category: CourseCategory
  description: string
  title: string
}>

export type CreateCourseUseCase = (
  adminId: AdminId,
  input: CreateCourseInput
) => Promise<Result<CourseEditorDocument, ContentError>>

export function createCreateCourseUseCase(
  dependencies: ContentApplicationDependencies
): CreateCourseUseCase {
  return async (_adminId, input) => {
    return dependencies.repository.createCourse({
      category: input.category,
      courseId: dependencies.courseIdGenerator.next(),
      description: input.description,
      now: dependencies.clock.now(),
      title: input.title,
    })
  }
}
