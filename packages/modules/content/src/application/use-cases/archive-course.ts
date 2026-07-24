import { err, type Result } from "@workspace/kernel/result"
import type { AdminId, CourseId } from "@workspace/types/ids"

import type { ContentError } from "#content/domain/content-error"
import { decideArchiveCourse } from "#content/domain/curriculum"
import type { ContentApplicationDependencies } from "#content/application/ports/content-ports"

export type ArchiveCourseUseCase = (command: {
  readonly adminId: AdminId
  readonly courseId: CourseId
}) => Promise<Result<void, ContentError>>

export function createArchiveCourseUseCase(
  dependencies: ContentApplicationDependencies
): ArchiveCourseUseCase {
  return async (command) => {
    const course = await dependencies.repository.findCourse(command.courseId)
    if (course === null) return err({ kind: "content-not-found" })

    const decision = decideArchiveCourse(course)
    if (decision.isErr()) return err(decision.error)

    const saved = await dependencies.repository.saveCourse({
      course: decision.value,
      expectedStatus: course.status,
    })
    return saved.map(() => undefined)
  }
}
