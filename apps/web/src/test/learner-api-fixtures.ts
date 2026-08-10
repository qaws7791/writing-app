import type { LearnerLessonDto } from "@/shared/http/learner-api-client"

const learnerFixtureVersion = {
  curriculumVersionId: "fixture-curriculum-v1",
  revision: 1,
} as const

export function createLearnerLessonWireFixture(
  overrides: Readonly<Partial<LearnerLessonDto>> = {}
): LearnerLessonDto {
  return {
    category: "글쓰기 기초",
    courseId: "course-1",
    description: null,
    drafts: [],
    estimatedMinutes: 5,
    id: "lesson-1",
    learning: {
      status: "not_started",
      totalSteps: 1,
      version: learnerFixtureVersion,
    },
    steps: [
      {
        body: "읽기 본문",
        guide: "읽기 안내",
        id: "step-1",
        sortOrder: 1,
        title: "읽기",
        type: "READING",
      },
    ],
    summary: [],
    title: "테스트 레슨",
    unitId: "unit-1",
    version: learnerFixtureVersion,
    ...overrides,
  }
}
