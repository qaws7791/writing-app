import type { ContentAssetId, LearnerId } from "@workspace/types/ids"

import type {
  CourseLearningState,
  LearnerStepDraft,
  LearningCurriculum,
  LessonLearningState,
} from "#learning/domain/learning-types"

export type LearnerContentAssetReference = Readonly<{
  altText: string
  id: ContentAssetId
  kind: "course-cover" | "reading-illustration"
  url: string
}>

export type LearnerCursorEndpoint = "courses" | "progress"

export type LearnerCursorPosition = Readonly<{
  courseId: string
  primary: number | string
}>

export type LearnerCursorCodec = Readonly<{
  createFingerprint: (value: unknown) => string
  createLearnerScope: (learnerId: string) => string
  decode: (
    cursor: string,
    expectation: Readonly<{
      endpoint: LearnerCursorEndpoint
      fingerprint: string
      learnerScope?: string
    }>
  ) => LearnerCursorPosition | null
  encode: (
    input: Readonly<{
      endpoint: LearnerCursorEndpoint
      fingerprint: string
      learnerScope?: string
      position: LearnerCursorPosition
    }>
  ) => string
}>

export type LearnerCourseSummary = Readonly<{
  category: string
  contentStatus: "active" | "archived"
  cover: LearnerContentAssetReference | null
  description: string
  id: string
  lessonCount: number
  title: string
  version: Readonly<{
    curriculumVersionId: string
    revision: number
  }>
  visualKey: LearningCurriculum["visualKey"]
}>

export type LearnerCourseDetail = LearnerCourseSummary &
  Readonly<{
    learning: CourseLearningState
    units: readonly Readonly<{
      id: string
      lessons: readonly Readonly<{
        category: string | null
        contentStatus: "active" | "archived"
        description: string | null
        estimatedMinutes: number
        id: string
        learning: LessonLearningState
        sortOrder: number
        title: string
      }>[]
      sortOrder: number
      title: string
    }>[]
  }>

import type { LearnerLessonStep } from "@workspace/contracts/learning/learner-content"

export type { LearnerLessonStep }

export type LearnerLesson = Readonly<{
  category: string | null
  courseId: string
  description: string | null
  drafts: readonly LearnerStepDraft[]
  estimatedMinutes: number
  id: string
  learning: LessonLearningState
  steps: readonly LearnerLessonStep[]
  summary: readonly string[]
  title: string
  unitId: string
  version: Readonly<{
    curriculumVersionId: string
    revision: number
  }>
}>

export type LearnerProgressCourse = Readonly<{
  cover: LearnerContentAssetReference | null
  id: string
  learning: CourseLearningState
  title: string
  visualKey: LearningCurriculum["visualKey"]
}>

export type LearnerCourseReadQuery = Readonly<{
  after?: LearnerCursorPosition
  category?: string
  limit: number
}>

export type LearnerProgressReadQuery = Readonly<{
  after?: LearnerCursorPosition
  limit: number
  status?: "completed" | "in_progress"
  userId: LearnerId
}>

export type LearnerReadModelPage<TItem> = Readonly<{
  items: readonly TItem[]
  nextPosition: LearnerCursorPosition | null
}>
