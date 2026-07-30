import {
  toLessonViewModel,
  type Lesson,
} from "@/features/lesson-session/model/lesson-view-model"
import type {
  LearnerCourseSummaryDto,
  LearnerLessonDto,
  LearnerLessonStepDto,
  LearnerProgressPageDto,
  LearnerProfileDto,
} from "@/shared/http/learner-api-client"

const learnerFixtureVersion = {
  curriculumVersionId: "fixture-curriculum-v1",
  revision: 1,
} as const

export const learnerProfileFixture: LearnerProfileDto = {
  stats: {
    completedLessons: 0,
    currentStreakDays: 0,
    lastActiveDate: null,
    progressPercent: 0,
    totalLessons: 0,
  },
  user: {
    email: "learner@example.com",
    id: "learner-1",
    image: null,
    joinedAt: "2026-07-01T00:00:00.000Z",
    name: "학습자",
    status: "active",
  },
}

export const emptyLearnerProgressFixture: LearnerProgressPageDto = {
  items: [],
  nextCursor: null,
}

export const learnerCourseSummaryFixture: LearnerCourseSummaryDto = {
  category: "글쓰기 기초",
  contentStatus: "active",
  cover: null,
  description: "한 문장부터 차근차근 연습합니다.",
  id: "course-1",
  lessonCount: 2,
  title: "글쓰기 첫걸음",
  version: learnerFixtureVersion,
  visualKey: "basic-sentence-writing",
}

const learnerAiLessonWireFixture = {
  category: "글쓰기 기초",
  courseId: "course-1",
  description: "작성한 문장을 바탕으로 AI 코칭을 받습니다.",
  drafts: [],
  estimatedMinutes: 5,
  id: "lesson-ai",
  learning: {
    completedSteps: 1,
    currentStepId: "step-ai",
    currentStepIndex: 1,
    progressPercent: 50,
    status: "in_progress",
    totalSteps: 2,
    version: learnerFixtureVersion,
  },
  steps: [
    {
      id: "step-write",
      min: 1,
      sortOrder: 1,
      type: "WRITE",
    },
    {
      focus: "명확성",
      id: "step-ai",
      sortOrder: 2,
      target: "step-write",
      type: "AI_FEEDBACK",
    },
  ],
  summary: [],
  title: "AI 코칭 레슨",
  unitId: "unit-1",
  version: learnerFixtureVersion,
} satisfies LearnerLessonDto

export const learnerAiLessonFixture: Lesson = toLessonViewModel(
  learnerAiLessonWireFixture
)

const learnerWriteLessonWireFixture = {
  category: "글쓰기 기초",
  courseId: "course-1",
  description: "문장을 작성합니다.",
  drafts: [
    {
      answer: { text: "서버 초안", type: "WRITE" },
      stepId: "step-write",
      updatedAt: "2026-07-24T00:00:00.000Z",
      version: 2,
    },
  ],
  estimatedMinutes: 5,
  id: "lesson-write",
  learning: {
    completedSteps: 0,
    currentStepId: "step-write",
    currentStepIndex: 0,
    progressPercent: 0,
    status: "in_progress",
    totalSteps: 1,
    version: learnerFixtureVersion,
  },
  steps: [
    {
      id: "step-write",
      min: 1,
      prompt: "문장을 작성하세요.",
      sortOrder: 1,
      type: "WRITE",
    },
  ],
  summary: [],
  title: "문장 쓰기",
  unitId: "unit-1",
  version: learnerFixtureVersion,
} satisfies LearnerLessonDto

export const learnerWriteLessonFixture: Lesson = toLessonViewModel(
  learnerWriteLessonWireFixture
)

export const learnerConflictingWriteLessonWireFixture = {
  ...learnerWriteLessonWireFixture,
  drafts: [
    {
      answer: { text: "다른 탭의 초안", type: "WRITE" },
      stepId: "step-write",
      updatedAt: "2026-07-24T00:01:00.000Z",
      version: 3,
    },
  ],
} satisfies LearnerLessonDto

const lessonStepFixtureShell = {
  category: null,
  courseId: "course-1",
  description: null,
  drafts: [],
  estimatedMinutes: 5,
  id: "lesson-1",
  learning: {
    status: "not_started",
    totalSteps: 1,
    version: { curriculumVersionId: "version-1", revision: 1 },
  },
  summary: [],
  title: "fixture",
  unitId: "unit-1",
  version: { curriculumVersionId: "version-1", revision: 1 },
} as const satisfies Omit<LearnerLessonDto, "steps">

export function parseLessonStepFixture(step: LearnerLessonStepDto) {
  const [parsed] = toLessonViewModel({
    ...lessonStepFixtureShell,
    steps: [step],
  }).steps
  if (!parsed) {
    throw new Error("expected one lesson step")
  }
  return parsed
}
