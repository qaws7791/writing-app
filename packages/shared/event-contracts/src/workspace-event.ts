import type { DomainEvent } from "@workspace/kernel/domain-event"
import type {
  CourseId,
  LearnerId,
  LessonId,
  ResourceDocumentId,
  UserId,
} from "@workspace/types/ids"

export type WorkspaceEventMap = {
  readonly "ai-feedback.completed": DomainEvent<
    "ai-feedback.completed",
    { readonly learnerId: LearnerId; readonly lessonId: LessonId }
  >
  readonly "content.curriculum-published": DomainEvent<
    "content.curriculum-published",
    { readonly courseId: CourseId; readonly revision: number }
  >
  readonly "identity.user-status-changed": DomainEvent<
    "identity.user-status-changed",
    {
      readonly status: "active" | "deleted" | "suspended"
      readonly userId: UserId
    }
  >
  readonly "learning.lesson-completed": DomainEvent<
    "learning.lesson-completed",
    { readonly learnerId: LearnerId; readonly lessonId: LessonId }
  >
  readonly "resource-library.document-saved": DomainEvent<
    "resource-library.document-saved",
    { readonly documentId: ResourceDocumentId; readonly version: number }
  >
}

export type WorkspaceEventName = keyof WorkspaceEventMap
