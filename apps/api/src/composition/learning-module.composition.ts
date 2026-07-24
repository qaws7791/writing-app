import type { AiFeedbackApplication } from "@workspace/ai-feedback/application"
import { userIdSchema } from "@workspace/contracts/identity/admin-ids"
import type { ContentApplication } from "@workspace/content/application"
import type { WritingAppDatabase } from "@workspace/db/client"
import type { IdentityModule } from "@workspace/identity/module"
import {
  createLearningModule,
  type LearningModule,
} from "@workspace/learning/module"
import { mapPublishedLearningCurriculum } from "@workspace/learning/mapping"
import type {
  LearningContentQueryPort,
  LearningIdentityQueryPort,
} from "@workspace/learning/ports"
import type { Clock } from "@workspace/kernel/clock"

export function composeLearningModule(input: {
  readonly aiFeedback: AiFeedbackApplication
  readonly clock: Clock
  readonly content: ContentApplication
  readonly cursorSigningSecret: string
  readonly database: WritingAppDatabase
  readonly identity: IdentityModule
}): LearningModule {
  return createLearningModule({
    aiFeedback: input.aiFeedback,
    clock: input.clock,
    content: createLearningContentQueryPort(input.content),
    cursorSigningSecret: input.cursorSigningSecret,
    database: input.database,
    identity: createLearningIdentityQueryPort(input.identity),
    presentationSecret: input.cursorSigningSecret,
  })
}

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

function createLearningIdentityQueryPort(
  identity: IdentityModule
): LearningIdentityQueryPort {
  return {
    async readLearnerStatus(learnerId) {
      const result = await identity.learningQuery.readLearnerStatus(
        userIdSchema.parse(learnerId)
      )
      return result.mapErr((error) => ({
        kind:
          error.kind === "identity-not-found" ||
          error.kind === "identity-conflict"
            ? error.kind
            : ("identity-validation-failed" as const),
      }))
    },
  }
}

type PublishedCurriculum = NonNullable<
  Awaited<ReturnType<ContentApplication["readCurriculum"]>>
>

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
