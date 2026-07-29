import type { ContentApplication } from "@workspace/content/ports"

import type { LearningContentQueryPort } from "#learning/application/ports/learning-ports"
import { mapPublishedLearningCurriculum } from "#learning/infrastructure/persistence/published-curriculum-mapper"

type PublishedCurriculum = NonNullable<
  Awaited<ReturnType<ContentApplication["readCurriculum"]>>
>

/** content 모듈의 발행 커리큘럼을 learning 어휘로 옮기는 어댑터. */
export function createLearningContentQueryPort(
  content: ContentApplication
): LearningContentQueryPort {
  return {
    async findCurriculumByLesson(query) {
      const reference = await content.findCurriculumByLesson(query)
      if (reference === null) return null
      const curriculum = await content.readCurriculum({
        courseId: reference.courseId,
        curriculumVersionId: reference.curriculumVersionId,
      })
      return curriculum === null
        ? null
        : mapPublishedCurriculum(content, curriculum)
    },
    async listPublishedCourses() {
      const courses = await content.listPublishedCourses()
      return courses.map((course) => ({ ...course }))
    },
    resolveAssetReferences: (assetIds) =>
      content.resolveAssetReferences(assetIds),
    async readCurriculum(query) {
      const curriculum = await content.readCurriculum(query)
      return curriculum === null
        ? null
        : mapPublishedCurriculum(content, curriculum)
    },
  }
}

async function mapPublishedCurriculum(
  content: ContentApplication,
  curriculum: PublishedCurriculum
) {
  const publishedCourses = await content.listPublishedCourses()
  const contentStatus = publishedCourses.some(
    (course) =>
      course.courseId === curriculum.courseId &&
      course.versionId === curriculum.curriculumVersionId
  )
    ? ("active" as const)
    : ("archived" as const)

  return mapPublishedLearningCurriculum(curriculum, contentStatus)
}
