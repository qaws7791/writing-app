import type {
  CourseId,
  CurriculumVersionId,
  LessonId,
  LessonStepId,
  LessonStepItemId,
  UnitId,
} from "@workspace/types/ids"

type LearningStepBase = Readonly<{
  id: LessonStepId
  sortOrder: number
}>

export type LearningStep =
  | (LearningStepBase &
      Readonly<{
        body: string
        guide: string
        source?: string
        title: string
        type: "READING"
      }>)
  | (LearningStepBase &
      Readonly<{
        analysis: string
        title: string
        type: "COMPARE"
        versions: readonly Readonly<{ label: string; text: string }>[]
      }>)
  | (LearningStepBase &
      Readonly<{
        correct: string
        explanation: string
        options: readonly Readonly<{
          id: string
          text: string
        }>[]
        question: string
        type: "MULTIPLE_CHOICE"
        wrong?: string
      }>)
  | (LearningStepBase &
      Readonly<{
        answer: readonly string[]
        explanation: string
        template: string
        type: "FILL_BLANK"
        wordIds?: readonly string[]
        words: readonly string[]
      }>)
  | (LearningStepBase &
      Readonly<{
        correct: readonly number[]
        explanation: string
        layout?: string
        question: string
        segmentIds?: readonly string[]
        segments: readonly string[]
        type: "SELECT"
      }>)
  | (LearningStepBase &
      Readonly<{
        correct: readonly string[]
        explanation: string
        itemIds?: readonly string[]
        items: readonly string[]
        showNumbers?: boolean
        title: string
        type: "ORDER"
      }>)
  | (LearningStepBase &
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
  | (LearningStepBase &
      Readonly<{
        allowRetry: boolean
        feedback: string
        focus: string
        score: number
        scoreMax: number
        showScore: boolean
        target: LessonStepId
        type: "AI_FEEDBACK"
      }>)
  | (LearningStepBase &
      Readonly<{
        explanation: string
        guide: string
        pairs: readonly Readonly<{
          left: string
          leftId?: string
          right: string
          rightId?: string
        }>[]
        title: string
        type: "MATCH"
      }>)
  | (LearningStepBase &
      Readonly<{
        categories: readonly Readonly<{
          id: string
          label: string
        }>[]
        explanation: string
        guide: string
        items: readonly Readonly<{
          categoryId: string
          id: string
          text: string
        }>[]
        title: string
        type: "CATEGORIZE"
      }>)

type LearningCurriculumLesson = Readonly<{
  category: string | null
  description: string | null
  estimatedMinutes: number
  id: LessonId
  sortOrder: number
  status: "active" | "archived"
  steps: readonly LearningStep[]
  summary: readonly string[]
  title: string
  unitId: UnitId
  unitSortOrder: number
}>

export type LearningCurriculum = Readonly<{
  category: string
  contentStatus?: "active" | "archived"
  courseId: CourseId
  curriculumVersionId: CurriculumVersionId
  description: string
  lessons: readonly LearningCurriculumLesson[]
  revision: number
  title: string
  visualKey:
    | "basic-sentence-writing"
    | "creative-writing"
    | "essay-writing"
    | "expression"
    | "grammar-complete"
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
  description: string
  lessonCount: number
  revision: number
  sortOrder: number
  title: string
  versionId: CurriculumVersionId
  visualKey: LearningCurriculum["visualKey"]
}>

export type LearnerStepSubmission =
  | Readonly<{
      selectedOptionId: LessonStepItemId
      type: "MULTIPLE_CHOICE"
    }>
  | Readonly<{
      selectedChoiceIds: readonly LessonStepItemId[]
      type: "FILL_BLANK"
    }>
  | Readonly<{
      selectedItemIds: readonly LessonStepItemId[]
      type: "SELECT"
    }>
  | Readonly<{
      orderedItemIds: readonly LessonStepItemId[]
      type: "ORDER"
    }>
  | Readonly<{
      pairs: readonly Readonly<{
        leftItemId: LessonStepItemId
        rightItemId: LessonStepItemId
      }>[]
      type: "MATCH"
    }>
  | Readonly<{
      assignments: readonly Readonly<{
        categoryId: LessonStepItemId
        itemId: LessonStepItemId
      }>[]
      type: "CATEGORIZE"
    }>
  | Readonly<{ text: string; type: "WRITE" }>

export type StepItemVerdict = "correct" | "incorrect" | "missed"

type ChoiceStepEvaluation = Readonly<{
  correct: boolean
  correctItemIds: readonly string[]
  explanation: string
  items: readonly Readonly<{
    id: string
    verdict: StepItemVerdict
  }>[]
  type: "FILL_BLANK" | "MULTIPLE_CHOICE" | "ORDER" | "SELECT"
}>

export type StepEvaluation =
  | ChoiceStepEvaluation
  | Readonly<{
      correct: boolean
      explanation: string
      items: readonly Readonly<{
        expectedRightItemId: string
        leftItemId: string
        rightItemId: string
        verdict: StepItemVerdict
      }>[]
      type: "MATCH"
    }>
  | Readonly<{
      correct: boolean
      explanation: string
      items: readonly Readonly<{
        categoryId: string
        expectedCategoryId: string
        itemId: string
        verdict: StepItemVerdict
      }>[]
      type: "CATEGORIZE"
    }>
  | Readonly<{ accepted: true; type: "WRITE" }>

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
      nextLesson: LearningLessonReference
      progressPercent: 0
      status: "not_started"
      totalLessons: number
      version: CurriculumVersionRef
    }>
  | Readonly<{
      completedLessons: number
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

type LearningLessonReference = Readonly<{
  currentStepId: LessonStepId
  currentStepIndex: number
  estimatedMinutes: number
  id: LessonId
  title: string
}>
