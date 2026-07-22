import type { ContentApplicationDependencies } from "#content/application/ports/content-ports"
import {
  createArchiveCourseUseCase,
  type ArchiveCourseUseCase,
} from "#content/application/use-cases/archive-course"
import {
  createCreateCourseUseCase,
  type CreateCourseUseCase,
} from "#content/application/use-cases/create-course"
import {
  createListCoursesUseCase,
  type ListCoursesUseCase,
} from "#content/application/use-cases/list-courses"
import {
  createPublishCourseUseCase,
  type PublishCourseUseCase,
} from "#content/application/use-cases/publish-course"
import {
  createReadCourseEditorUseCase,
  type ReadCourseEditorUseCase,
} from "#content/application/use-cases/read-course-editor"
import {
  createResetContentUseCase,
  type ResetContentUseCase,
} from "#content/application/use-cases/reset-content"
import {
  createSaveCourseEditorUseCase,
  type SaveCourseEditorUseCase,
} from "#content/application/use-cases/save-course-editor"

export type ContentApplication = Readonly<{
  archiveCourse: ArchiveCourseUseCase
  createCourse: CreateCourseUseCase
  getCourseEditor: ReadCourseEditorUseCase
  getCourses: ListCoursesUseCase
  publishCourse: PublishCourseUseCase
  resetContent: ResetContentUseCase
  saveCourseEditor: SaveCourseEditorUseCase
}>

export function createContentApplication(
  dependencies: ContentApplicationDependencies
): ContentApplication {
  return Object.freeze({
    archiveCourse: createArchiveCourseUseCase(dependencies),
    createCourse: createCreateCourseUseCase(dependencies),
    getCourseEditor: createReadCourseEditorUseCase(dependencies.repository),
    getCourses: createListCoursesUseCase(dependencies.repository),
    publishCourse: createPublishCourseUseCase(dependencies),
    resetContent: createResetContentUseCase(dependencies),
    saveCourseEditor: createSaveCourseEditorUseCase(dependencies),
  })
}

export {
  authorizeContentReset,
  type ContentRuntimeEnvironment,
} from "#content/domain/content-admin-policy"
