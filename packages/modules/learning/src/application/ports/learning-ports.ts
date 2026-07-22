import type { WorkspaceEventMap } from "@workspace/event-contracts/workspace-event"
import type { Clock, IdGenerator } from "@workspace/kernel/clock"
import type { Result } from "@workspace/kernel/result"
import type {
  CourseId,
  CurriculumVersionId,
  LearnerId,
  LessonId,
  LessonStepId,
  UserId,
} from "@workspace/types/ids"

import type {
  CompleteLearnerAiFeedbackCommand,
  CompleteLearnerStepCommand,
  CompleteLearnerStepTransitionResult,
  LearnerAiFeedbackContext,
  LearnerTransitionError,
  PrepareLearnerAiFeedbackCommand,
  StartLearnerLessonCommand,
  StartLearnerLessonResult,
} from "#learning/domain/learner-transition"
import type {
  LearningCourseSummary,
  LearningCurriculum,
} from "#learning/domain/learning-types"

export type LearningContentQueryPort = Readonly<{
  findCurriculumByLesson: (input: {
    readonly curriculumVersionId?: CurriculumVersionId
    readonly lessonId: LessonId
  }) => Promise<LearningCurriculum | null>
  listPublishedCourses: () => Promise<readonly LearningCourseSummary[]>
  readCurriculum: (input: {
    readonly courseId: CourseId
    readonly curriculumVersionId?: CurriculumVersionId
  }) => Promise<LearningCurriculum | null>
}>

export type LearningIdentityQueryError = Readonly<{
  kind:
    | "identity-conflict"
    | "identity-not-found"
    | "identity-validation-failed"
}>

export type LearningIdentityQueryPort = Readonly<{
  readLearnerStatus: (
    learnerId: LearnerId
  ) => Promise<
    Result<"active" | "deleted" | "suspended", LearningIdentityQueryError>
  >
}>

export type LearningAiFeedbackResult = Readonly<{
  improvements: readonly string[]
  nextAction: string
  remainingAttempts: number
  score: number
  scoreRange: readonly [0, 100]
  showScore: boolean
  strengths: readonly string[]
  summary: string
}>

export type LearningAiFeedbackError =
  | Readonly<{ kind: "attempt-limit-exceeded"; remainingAttempts: 0 }>
  | Readonly<{
      kind: "attempt-in-progress"
      remainingAttempts: number
      retryAfterSeconds: number
    }>
  | Readonly<{
      kind:
        | "provider-response-invalid"
        | "provider-timeout"
        | "provider-unavailable"
        | "request-aborted"
      remainingAttempts: number
    }>
  | Readonly<{
      kind: "persistence-failed"
      operation: "fail-attempt" | "reserve-attempt" | "succeed-attempt"
    }>

export type LearningAiFeedbackApplicationPort = Readonly<{
  requestFeedback: (
    input: Readonly<{
      answer: string
      courseId: CourseId
      curriculumVersionId: CurriculumVersionId
      focus: string
      idempotencyKey: string
      learnerId: LearnerId
      lessonId: LessonId
      lessonTitle: string
      showScore: boolean
      stepId: LessonStepId
    }>,
    options: Readonly<{ signal?: AbortSignal }>
  ) => Promise<Result<LearningAiFeedbackResult, LearningAiFeedbackError>>
}>

export type LearningEventIntent = Readonly<{
  learnerId: LearnerId
  lessonId: LessonId
  occurredAt: Date
  type: "learning.lesson-completed"
}>

export type CommittedLearningTransition<TValue> = Readonly<{
  events: readonly LearningEventIntent[]
  value: TValue
}>

export type LearnerPinnedScope = Readonly<{
  courseId: CourseId
  curriculumVersionId: CurriculumVersionId
  lessonId: LessonId
}>

export type LearningTransitionRepository = Readonly<{
  completeAiFeedbackStep: (
    command: CompleteLearnerAiFeedbackCommand,
    curriculum: LearningCurriculum
  ) => Promise<
    Result<
      CommittedLearningTransition<CompleteLearnerStepTransitionResult>,
      LearnerTransitionError
    >
  >
  completeStep: (
    command: CompleteLearnerStepCommand,
    curriculum: LearningCurriculum
  ) => Promise<
    Result<
      CommittedLearningTransition<CompleteLearnerStepTransitionResult>,
      LearnerTransitionError
    >
  >
  findPinnedScope: (input: {
    readonly learnerId: LearnerId
    readonly lessonId: LessonId
  }) => Promise<LearnerPinnedScope | null>
  prepareAiFeedback: (
    command: PrepareLearnerAiFeedbackCommand,
    curriculum: LearningCurriculum
  ) => Promise<Result<LearnerAiFeedbackContext, LearnerTransitionError>>
  startLesson: (
    command: StartLearnerLessonCommand,
    curriculum: LearningCurriculum
  ) => Promise<
    Result<
      CommittedLearningTransition<StartLearnerLessonResult>,
      LearnerTransitionError
    >
  >
}>

export type LearningEventPublishError = Readonly<{
  kind: "learning-event-publish-failed"
}>

export type LearningEventPublisher = Readonly<{
  publishLessonCompleted: (
    event: WorkspaceEventMap["learning.lesson-completed"]
  ) => Promise<Result<void, LearningEventPublishError>>
}>

export type LearningEventFailureObserver = (
  event: Readonly<{
    eventId: string
    eventName: "learning.lesson-completed"
    kind: "learning-event-publish-failed"
  }>
) => void

export type LearningApplicationDependencies = Readonly<{
  aiFeedback: LearningAiFeedbackApplicationPort
  clock: Clock
  content: LearningContentQueryPort
  eventFailureObserver: LearningEventFailureObserver
  eventIdGenerator: IdGenerator<string>
  eventPublisher: LearningEventPublisher
  identity: LearningIdentityQueryPort
  transitionRepository: LearningTransitionRepository
}>

export type LearningReportItem = Readonly<{
  completedLessons: number
  currentStreakDays: number
  lastActive: string | null
  userId: UserId
}>
