import type { Clock } from "@workspace/kernel/clock"
import type { Result } from "@workspace/kernel/result"
import type {
  ContentAssetId,
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
  SaveLearnerStepDraftCommand,
  SaveLearnerStepDraftResult,
  StartLearnerLessonCommand,
  StartLearnerLessonResult,
} from "#learning/domain/learner-transition"
import type {
  LearningCourseSummary,
  LearningCurriculum,
} from "#learning/domain/learning-types"
import type { LearnerReadModelRepository } from "#learning/application/ports/learner-read-model-repository"
import type { LearnerContentAssetReference } from "#learning/application/learning-read-model"

export type LearningContentQueryPort = Readonly<{
  findCurriculumByLesson: (input: {
    readonly curriculumVersionId?: CurriculumVersionId
    readonly lessonId: LessonId
  }) => Promise<LearningCurriculum | null>
  listPublishedCourses: () => Promise<readonly LearningCourseSummary[]>
  resolveAssetReferences: (
    assetIds: readonly ContentAssetId[]
  ) => Promise<readonly LearnerContentAssetReference[]>
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
  strengths: readonly string[]
  summary: string
}>

export type LearningAiFeedbackError =
  | Readonly<{ kind: "attempt-limit-exceeded"; remainingAttempts: 0 }>
  | Readonly<{
      kind: "daily-quota-exceeded"
      remainingAttempts: number
      retryAfterSeconds: number
    }>
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
      stepId: LessonStepId
    }>,
    options: Readonly<{ signal?: AbortSignal }>
  ) => Promise<Result<LearningAiFeedbackResult, LearningAiFeedbackError>>
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
    Result<CompleteLearnerStepTransitionResult, LearnerTransitionError>
  >
  completeStep: (
    command: CompleteLearnerStepCommand,
    curriculum: LearningCurriculum
  ) => Promise<
    Result<CompleteLearnerStepTransitionResult, LearnerTransitionError>
  >
  findPinnedScope: (input: {
    readonly learnerId: LearnerId
    readonly lessonId: LessonId
  }) => Promise<LearnerPinnedScope | null>
  prepareAiFeedback: (
    command: PrepareLearnerAiFeedbackCommand,
    curriculum: LearningCurriculum
  ) => Promise<Result<LearnerAiFeedbackContext, LearnerTransitionError>>
  saveStepDraft: (
    command: SaveLearnerStepDraftCommand,
    curriculum: LearningCurriculum
  ) => Promise<Result<SaveLearnerStepDraftResult, LearnerTransitionError>>
  startLesson: (
    command: StartLearnerLessonCommand,
    curriculum: LearningCurriculum
  ) => Promise<Result<StartLearnerLessonResult, LearnerTransitionError>>
}>

export type LearningApplicationDependencies = Readonly<{
  aiFeedback: LearningAiFeedbackApplicationPort
  clock: Clock
  content: LearningContentQueryPort
  identity: LearningIdentityQueryPort
  readRepository: LearnerReadModelRepository
  transitionRepository: LearningTransitionRepository
}>

export type LearningReportItem = Readonly<{
  completedLessons: number
  currentStreakDays: number
  lastActive: string | null
  userId: UserId
}>
