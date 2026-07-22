import type {
  CourseId,
  CurriculumVersionId,
  LessonId,
} from "@workspace/types/ids"

import type {
  PublishedCourseSummary,
  PublishedCurriculumRevision,
  PublishedLessonReference,
} from "#content/domain/content-model"
import type { ContentRepository } from "#content/application/ports/content-ports"

export type ContentLearningQuery = Readonly<{
  findCurriculumByLesson: (input: {
    readonly curriculumVersionId?: CurriculumVersionId
    readonly lessonId: LessonId
  }) => Promise<PublishedLessonReference | null>
  listPublishedCourses: () => Promise<readonly PublishedCourseSummary[]>
  readCurriculum: (input: {
    readonly courseId: CourseId
    readonly curriculumVersionId?: CurriculumVersionId
  }) => Promise<PublishedCurriculumRevision | null>
}>

export type OperationsContentLessonSnapshot = Readonly<{
  courseId: CourseId
  courseTitle: string
  lessonId: LessonId
  lessonTitle: string
}>

export type OperationsContentReport = Readonly<{
  activeCourses: number
  activeLessons: number
  lessons: readonly OperationsContentLessonSnapshot[]
}>

export type OperationsContentReportingQuery = Readonly<{
  readContentReport: () => Promise<OperationsContentReport>
}>

export function createContentLearningQuery(
  repository: ContentRepository
): ContentLearningQuery {
  return Object.freeze({
    findCurriculumByLesson: (input) => repository.findCurriculumByLesson(input),
    listPublishedCourses: () => repository.listPublishedCourseSummaries(),
    readCurriculum: (input) => repository.readCurriculum(input),
  })
}

export function createOperationsContentReportingQuery(
  repository: ContentRepository
): OperationsContentReportingQuery {
  return Object.freeze({
    async readContentReport() {
      const courses = await repository.listPublishedCourseSummaries()
      const curricula = await Promise.all(
        courses.map((course) =>
          repository.readCurriculum({
            courseId: course.courseId,
            curriculumVersionId: course.versionId,
          })
        )
      )
      const lessons = curricula.flatMap((curriculum) =>
        curriculum === null
          ? []
          : curriculum.units.flatMap((unit) =>
              unit.lessons.map((lesson) => ({
                courseId: curriculum.courseId,
                courseTitle: curriculum.title,
                lessonId: lesson.id,
                lessonTitle: lesson.title,
              }))
            )
      )

      return Object.freeze({
        activeCourses: courses.length,
        activeLessons: lessons.length,
        lessons: Object.freeze(lessons),
      })
    },
  })
}
