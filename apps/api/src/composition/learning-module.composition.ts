import type { Database } from "bun:sqlite"

import type { AiFeedbackApplication } from "@workspace/ai-feedback/application"
import { userIdSchema } from "@workspace/contracts/identity/admin-ids"
import type { ContentModule } from "@workspace/content/module"
import type { WritingAppDatabase } from "@workspace/db/client"
import type { InMemoryEventBus } from "@workspace/event-bus/in-memory-event-bus"
import type { WorkspaceEventMap } from "@workspace/event-contracts/workspace-event"
import type { IdentityModule } from "@workspace/identity/module"
import {
  createLearningModule,
  type LearningModule,
} from "@workspace/learning/module"
import { mapPublishedLearningCurriculum } from "@workspace/learning/mapping"
import type {
  LearningContentQueryPort,
  LearningEventFailureObserver,
  LearningIdentityQueryPort,
} from "@workspace/learning/ports"
import type { AppLogger } from "@workspace/observability/logger"
import type { Clock, IdGenerator } from "@workspace/kernel/clock"

export function composeLearningModule(input: {
  readonly aiFeedback: AiFeedbackApplication
  readonly clock: Clock
  readonly content: ContentModule
  readonly cursorSigningSecret: string
  readonly database: WritingAppDatabase
  readonly eventBus: InMemoryEventBus<WorkspaceEventMap>
  readonly eventIdGenerator: IdGenerator<string>
  readonly identity: IdentityModule
  readonly logger: AppLogger
  readonly sqlite: Database
}): LearningModule {
  return createLearningModule({
    aiFeedback: input.aiFeedback,
    clock: input.clock,
    content: createLearningContentQueryPort(input.content),
    cursorSigningSecret: input.cursorSigningSecret,
    database: input.database,
    eventFailureObserver(event: Parameters<LearningEventFailureObserver>[0]) {
      input.logger.warn(event, "learning.event.publish_failed")
    },
    eventIdGenerator: input.eventIdGenerator,
    eventPublisher: {
      async publishLessonCompleted(
        event: WorkspaceEventMap["learning.lesson-completed"]
      ) {
        const published = await input.eventBus.publish(event.type, event)
        return published.mapErr(() => ({
          kind: "learning-event-publish-failed" as const,
        }))
      },
    },
    identity: createLearningIdentityQueryPort(input.identity),
    presentationSecret: input.cursorSigningSecret,
    sqlite: input.sqlite,
  })
}

export function createLearningContentQueryPort(
  content: ContentModule
): LearningContentQueryPort {
  return Object.freeze({
    async findCurriculumByLesson(query) {
      const reference =
        await content.learningQuery.findCurriculumByLesson(query)
      if (reference === null) return null
      const curriculum = await content.learningQuery.readCurriculum({
        courseId: reference.courseId,
        curriculumVersionId: reference.curriculumVersionId,
      })
      return curriculum === null
        ? null
        : mapPublishedCurriculum(content, curriculum)
    },
    async listPublishedCourses() {
      const courses = await content.learningQuery.listPublishedCourses()
      return courses.map((course) => Object.freeze({ ...course }))
    },
    async readCurriculum(query) {
      const curriculum = await content.learningQuery.readCurriculum(query)
      return curriculum === null
        ? null
        : mapPublishedCurriculum(content, curriculum)
    },
  })
}

function createLearningIdentityQueryPort(
  identity: IdentityModule
): LearningIdentityQueryPort {
  return Object.freeze({
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
  })
}

type PublishedCurriculum = NonNullable<
  Awaited<ReturnType<ContentModule["learningQuery"]["readCurriculum"]>>
>

async function mapPublishedCurriculum(
  content: ContentModule,
  curriculum: PublishedCurriculum
) {
  const publishedCourses = await content.learningQuery.listPublishedCourses()
  const contentStatus = publishedCourses.some(
    (course) =>
      course.courseId === curriculum.courseId &&
      course.versionId === curriculum.curriculumVersionId
  )
    ? ("active" as const)
    : ("archived" as const)

  return mapPublishedLearningCurriculum(curriculum, contentStatus)
}
