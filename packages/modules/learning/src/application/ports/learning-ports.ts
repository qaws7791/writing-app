import type { Clock } from "@workspace/kernel/clock"
import type { Result } from "@workspace/kernel/result"
import type {
  ContentAssetId,
  CourseId,
  CurriculumVersionId,
  LearnerId,
  LessonId,
  UserId,
} from "@workspace/types/ids"

import type {
  CompleteLearnerStepCommand,
  CompleteLearnerStepTransitionResult,
  LearnerTransitionError,
  SaveLearnerStepDraftCommand,
  SaveLearnerStepDraftResult,
  StartLearnerLessonCommand,
  StartLearnerLessonResult,
} from "#learning/domain/learner-transition"
import type {
  LearningCourseSummary,
  LearningCurriculum,
} from "#learning/domain/learning-types"
import type { LearningDateKey } from "#learning/domain/learning-date"
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

type LearningIdentityQueryError = Readonly<{
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

type LearnerPinnedScope = Readonly<{
  courseId: CourseId
  curriculumVersionId: CurriculumVersionId
  lessonId: LessonId
}>

export type LearningTransitionRepository = Readonly<{
  completeStep: (
    command: CompleteLearnerStepCommand,
    curriculum: LearningCurriculum
  ) => Promise<
    Result<CompleteLearnerStepTransitionResult, LearnerTransitionError>
  >
  findPinnedScope: (input: {
    readonly courseId?: CourseId
    readonly learnerId: LearnerId
    readonly lessonId: LessonId
  }) => Promise<LearnerPinnedScope | null>
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
  clock: Clock
  content: LearningContentQueryPort
  identity: LearningIdentityQueryPort
  readRepository: LearnerReadModelRepository
  transitionRepository: LearningTransitionRepository
}>

export type LearningReportItem = Readonly<{
  activityDates: readonly LearningDateKey[]
  completedCourses: number
  completedLessons: number
  currentStreakDays: number
  inProgressCourses: number
  lastActive: string | null
  userId: UserId
}>
