import type {
  ContentAssetId,
  CourseId,
  CurriculumVersionId,
  LessonId,
  LessonStepId,
  UnitId,
} from "@workspace/types/ids"

import type { LessonStepDto } from "@workspace/contracts/content/steps"

type LearningCurriculumLesson = Readonly<{
  category: string | null
  description: string | null
  estimatedMinutes: number
  id: LessonId
  sortOrder: number
  status: "active" | "archived"
  steps: readonly LessonStepDto[]
  summary: readonly string[]
  title: string
  unitId: UnitId
  unitSortOrder: number
}>

export type LearningCurriculum = Readonly<{
  category: string
  contentStatus: "active" | "archived"
  courseId: CourseId
  coverAssetId: ContentAssetId | null
  curriculumVersionId: CurriculumVersionId
  description: string
  lessons: readonly LearningCurriculumLesson[]
  revision: number
  title: string
  visualKey:
    | "basic-sentence-writing"
    | "business-email"
    | "business-writing"
    | "creative-writing"
    | "emotion-writing"
    | "essay-writing"
    | "expression"
    | "grammar-complete"
    | "reading-comprehension"
    | "sentence-structure"
    | "vocabulary-basics"
  units: readonly Readonly<{
    id: UnitId
    sortOrder: number
    status: "active" | "archived"
    title: string
  }>[]
}>

export type LearningCourseSummary = Readonly<{
  category: string
  courseId: CourseId
  coverAssetId: ContentAssetId | null
  description: string
  lessonCount: number
  revision: number
  sortOrder: number
  title: string
  versionId: CurriculumVersionId
  visualKey: LearningCurriculum["visualKey"]
}>

import type {
  LearnerStepDraftAnswer,
  LearnerStepSubmission,
} from "@workspace/contracts/learning/learner-transition"

export type { LearnerStepDraftAnswer, LearnerStepSubmission }

export type LearnerStepDraft = Readonly<{
  answer: LearnerStepDraftAnswer
  stepId: LessonStepId
  updatedAt: string
  version: number
}>

export type CurriculumVersionRef = Readonly<{
  curriculumVersionId: CurriculumVersionId
  revision: number
}>

type LessonCompletion = Readonly<{
  completedAt: string
  totalSteps: number
}>

export type LessonLearningState =
  | Readonly<{
      status: "locked"
      version: CurriculumVersionRef
    }>
  | Readonly<{
      status: "not_started"
      totalSteps: number
      version: CurriculumVersionRef
    }>
  | Readonly<{
      completedSteps: number
      currentStepId: LessonStepId
      currentStepIndex: number
      progressPercent: number
      status: "in_progress"
      totalSteps: number
      version: CurriculumVersionRef
    }>
  | Readonly<{
      completion: LessonCompletion
      status: "completed"
      version: CurriculumVersionRef
    }>

export type CourseLearningState =
  | Readonly<{
      completedLessons: 0
      followingLesson: LearningLessonReference | null
      nextLesson: LearningLessonReference
      progressPercent: 0
      status: "not_started"
      totalLessons: number
      version: CurriculumVersionRef
    }>
  | Readonly<{
      completedLessons: number
      followingLesson: LearningLessonReference | null
      lastActivityAt: string
      nextLesson: LearningLessonReference
      progressPercent: number
      status: "in_progress"
      totalLessons: number
      version: CurriculumVersionRef
    }>
  | Readonly<{
      completedAt: string
      completedLessons: number
      lastActivityAt: string
      nextLesson: null
      progressPercent: 100
      status: "completed"
      totalLessons: number
      version: CurriculumVersionRef
    }>

export type LearningLessonReference = Readonly<{
  currentStepId: LessonStepId
  currentStepIndex: number
  estimatedMinutes: number
  id: LessonId
  title: string
}>
