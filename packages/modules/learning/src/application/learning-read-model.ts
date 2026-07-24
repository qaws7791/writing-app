import type { LearnerId } from "@workspace/types/ids"

import type {
  CourseLearningState,
  LearnerStepDraft,
  LearningCurriculum,
  LessonLearningState,
} from "#learning/domain/learning-types"

export type LearnerContentAssetReference = Readonly<{
  altText: string
  id: string
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

type LearnerStepBase = Readonly<{
  id: string
  sortOrder: number
}>

type LearnerStepItem = Readonly<{
  id: string
  text: string
}>

export type LearnerLessonStep =
  | (LearnerStepBase &
      Readonly<{
        body: string
        guide: string
        illustration?: LearnerContentAssetReference
        source?: string
        title: string
        type: "READING"
      }>)
  | (LearnerStepBase &
      Readonly<{
        title: string
        type: "COMPARE"
        versions: readonly Readonly<{ label: string; text: string }>[]
      }>)
  | (LearnerStepBase &
      Readonly<{
        options: readonly LearnerStepItem[]
        question: string
        type: "MULTIPLE_CHOICE"
      }>)
  | (LearnerStepBase &
      Readonly<{
        blankCount: number
        choices: readonly LearnerStepItem[]
        template: string
        type: "FILL_BLANK"
      }>)
  | (LearnerStepBase &
      Readonly<{
        items: readonly LearnerStepItem[]
        layout?: string
        question: string
        type: "SELECT"
      }>)
  | (LearnerStepBase &
      Readonly<{
        items: readonly LearnerStepItem[]
        showNumbers?: boolean
        title: string
        type: "ORDER"
      }>)
  | (LearnerStepBase &
      Readonly<{
        badge?: string
        claim?: string
        context?: string
        draft?: boolean
        goal?: number
        guide?: string
        max?: number
        min: number
        mode?: string
        placeholder?: string
        prompt?: string
        reference?: string
        sample?: string
        structure?: string
        title?: string
        topic?: string
        type: "WRITE"
      }>)
  | (LearnerStepBase &
      Readonly<{
        focus: string
        target: string
        type: "AI_FEEDBACK"
      }>)
  | (LearnerStepBase &
      Readonly<{
        guide: string
        leftItems: readonly LearnerStepItem[]
        rightItems: readonly LearnerStepItem[]
        title: string
        type: "MATCH"
      }>)
  | (LearnerStepBase &
      Readonly<{
        categories: readonly LearnerStepItem[]
        guide: string
        items: readonly LearnerStepItem[]
        title: string
        type: "CATEGORIZE"
      }>)

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
  query?: string
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
