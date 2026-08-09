import { describe, expect, it } from "vitest"

import {
  projectLearnerCourseDetail,
  projectLearnerCoursePage,
  projectLearnerProgressCourse,
  projectLearnerProgressPageWindow,
  type LearnerCourseProjectionBundle,
  type LearnerCourseProjectionLesson,
  type LearnerCourseProjectionStep,
  type LearnerCourseProgressProjectionRow,
  type LearnerLessonProgressProjectionRow,
} from "#learning/infrastructure/persistence/learner-read-mapping"

const version = {
  curriculumVersionId: "course-1-v1",
  revision: 1,
} as const

describe("learner read page projection", () => {
  it("course page의 동률 row 순서와 다음 cursor primary를 보존한다", () => {
    const rows = [
      createCourseListRow({ id: "course-a", sortOrder: 1 }),
      createCourseListRow({ id: "course-b", sortOrder: 1 }),
    ]

    expect(
      projectLearnerCoursePage({
        limit: 1,
        rows,
      })
    ).toMatchObject({
      items: [{ id: "course-a" }],
      nextPosition: { courseId: "course-a", primary: 1 },
    })
  })

  it("마지막·빈 course page는 next position을 만들지 않는다", () => {
    expect(
      projectLearnerCoursePage({
        limit: 1,
        rows: [createCourseListRow({ id: "course-a", sortOrder: 1 })],
      }).nextPosition
    ).toBeNull()
    expect(
      projectLearnerCoursePage({
        limit: 20,
        rows: [],
      })
    ).toEqual({ items: [], nextPosition: null })
  })

  it("progress page의 timestamp 동률 순서와 millisecond cursor를 보존한다", () => {
    const lastActivityAt = new Date("2026-07-17T00:00:00.000Z")
    const window = projectLearnerProgressPageWindow(
      [
        { courseId: "course-a", lastActivityAt },
        { courseId: "course-b", lastActivityAt },
      ],
      1
    )

    expect(window.pageRows).toEqual([{ courseId: "course-a", lastActivityAt }])
    expect(window.nextPosition).toEqual({
      courseId: "course-a",
      primary: lastActivityAt.getTime(),
    })
    expect(projectLearnerProgressPageWindow([], 20)).toEqual({
      nextPosition: null,
      pageRows: [],
    })
  })
})

describe("learner course learning projection", () => {
  it("완료·진행·시작 전 lesson과 course percent·next lesson을 결정한다", () => {
    const course = projectLearnerCourseDetail(
      createCourseProjectionBundle({
        courseProgress: {
          completedAt: null,
          lastActivityAt: new Date("2026-07-16T00:00:00.000Z"),
          status: "in_progress",
        },
        lessonProgress: [
          {
            completedAt: null,
            currentStepId: "lesson-1-step-1",
            lessonId: "lesson-1",
            status: "completed",
            updatedAt: new Date("2026-07-15T00:00:00.000Z"),
          },
          {
            completedAt: null,
            currentStepId: "lesson-2-step-2",
            lessonId: "lesson-2",
            status: "in_progress",
            updatedAt: new Date("2026-07-16T00:00:00.000Z"),
          },
        ],
      })
    )

    expect(course.learning).toEqual({
      completedLessons: 1,
      lastActivityAt: "2026-07-16T00:00:00.000Z",
      nextLesson: {
        currentStepId: "lesson-2-step-2",
        currentStepIndex: 1,
        estimatedMinutes: 10,
        id: "lesson-2",
        title: "두 번째 레슨",
      },
      progressPercent: 33,
      status: "in_progress",
      totalLessons: 3,
      version,
    })
    expect(course.units[0]?.lessons.map((lesson) => lesson.learning)).toEqual([
      {
        completion: {
          completedAt: "2026-07-15T00:00:00.000Z",
          totalSteps: 1,
        },
        status: "completed",
        version,
      },
      {
        completedSteps: 1,
        currentStepId: "lesson-2-step-2",
        currentStepIndex: 1,
        progressPercent: 50,
        status: "in_progress",
        totalSteps: 2,
        version,
      },
      { status: "not_started", totalSteps: 1, version },
    ])
  })

  it("진행 row가 없으면 첫 lesson과 첫 step을 not-started next lesson으로 선택한다", () => {
    const course = projectLearnerCourseDetail(createCourseProjectionBundle())

    expect(course.learning).toMatchObject({
      completedLessons: 0,
      nextLesson: {
        currentStepId: "lesson-1-step-1",
        currentStepIndex: 0,
        id: "lesson-1",
      },
      progressPercent: 0,
      status: "not_started",
      totalLessons: 3,
    })
    expect(
      course.units[0]?.lessons.map((lesson) => lesson.learning.status)
    ).toEqual(["not_started", "not_started", "not_started"])
  })

  it("completedAt null은 last activity로 대체하고 완료 course는 next lesson이 없다", () => {
    const completedAt = new Date("2026-07-17T00:00:00.000Z")
    const course = projectLearnerCourseDetail(
      createCourseProjectionBundle({
        courseProgress: {
          completedAt: null,
          lastActivityAt: completedAt,
          status: "completed",
        },
        lessonProgress: createCompletedLessonProgress(completedAt),
      })
    )

    expect(course.learning).toMatchObject({
      completedAt: completedAt.toISOString(),
      completedLessons: 3,
      lastActivityAt: completedAt.toISOString(),
      nextLesson: null,
      progressPercent: 100,
      status: "completed",
      totalLessons: 3,
    })
    expect(projectLearnerProgressCourse(course)).toEqual({
      cover: course.cover,
      id: course.id,
      learning: course.learning,
      title: course.title,
      visualKey: course.visualKey,
    })
  })

  it("빈 완료 course projection을 유지하고 빈 미완료 course는 기존 invariant로 거부한다", () => {
    const completed = projectLearnerCourseDetail(
      createCourseProjectionBundle({
        courseProgress: {
          completedAt: null,
          lastActivityAt: new Date("2026-07-17T00:00:00.000Z"),
          status: "completed",
        },
        lessons: [],
        steps: [],
      })
    )

    expect(completed).toMatchObject({
      learning: {
        completedLessons: 0,
        nextLesson: null,
        progressPercent: 100,
        status: "completed",
        totalLessons: 0,
      },
      lessonCount: 0,
      units: [{ lessons: [] }],
    })
    expect(() =>
      projectLearnerCourseDetail(
        createCourseProjectionBundle({ lessons: [], steps: [] })
      )
    ).toThrow("In-progress curriculum must have a next lesson")
  })
})

function createCourseListRow(input: {
  readonly id: string
  readonly sortOrder: number
}) {
  return {
    category: "입문",
    contentStatus: "active" as const,
    cover: null,
    description: `${input.id} 설명`,
    id: input.id,
    lessonCount: 3,
    revision: 1,
    sortOrder: input.sortOrder,
    title: `${input.id} 제목`,
    versionId: `${input.id}-v1`,
    visualKey: "basic-sentence-writing" as const,
  }
}

const defaultLessons: readonly LearnerCourseProjectionLesson[] = [
  {
    category: "기본",
    contentStatus: "active",
    description: "첫 번째",
    estimatedMinutes: 5,
    id: "lesson-1",
    sortOrder: 1,
    title: "첫 번째 레슨",
    unitId: "unit-1",
  },
  {
    category: "기본",
    contentStatus: "active",
    description: "두 번째",
    estimatedMinutes: 10,
    id: "lesson-2",
    sortOrder: 2,
    title: "두 번째 레슨",
    unitId: "unit-1",
  },
  {
    category: "기본",
    contentStatus: "active",
    description: "세 번째",
    estimatedMinutes: 15,
    id: "lesson-3",
    sortOrder: 3,
    title: "세 번째 레슨",
    unitId: "unit-1",
  },
]

const defaultSteps: readonly LearnerCourseProjectionStep[] = [
  { id: "lesson-1-step-1", lessonId: "lesson-1", sortOrder: 1 },
  { id: "lesson-2-step-1", lessonId: "lesson-2", sortOrder: 1 },
  { id: "lesson-2-step-2", lessonId: "lesson-2", sortOrder: 2 },
  { id: "lesson-3-step-1", lessonId: "lesson-3", sortOrder: 1 },
]

function createCourseProjectionBundle(
  input: {
    readonly courseProgress?: LearnerCourseProgressProjectionRow
    readonly lessonProgress?: readonly LearnerLessonProgressProjectionRow[]
    readonly lessons?: readonly LearnerCourseProjectionLesson[]
    readonly steps?: readonly LearnerCourseProjectionStep[]
  } = {}
): LearnerCourseProjectionBundle {
  return {
    course: { contentStatus: "active", id: "course-1" },
    courseProgress: input.courseProgress,
    lessonProgress: input.lessonProgress ?? [],
    lessons: input.lessons ?? defaultLessons,
    steps: input.steps ?? defaultSteps,
    units: [{ id: "unit-1", sortOrder: 1, title: "첫 번째 유닛" }],
    version: {
      category: "입문",
      cover: null,
      description: "course 설명",
      id: version.curriculumVersionId,
      revision: version.revision,
      title: "course 제목",
      visualKey: "basic-sentence-writing",
    },
  }
}

function createCompletedLessonProgress(
  completedAt: Date
): readonly LearnerLessonProgressProjectionRow[] {
  return defaultLessons.map((lesson) => ({
    completedAt,
    currentStepId:
      defaultSteps.find((step) => step.lessonId === lesson.id)?.id ??
      "missing-step",
    lessonId: lesson.id,
    status: "completed",
    updatedAt: completedAt,
  }))
}
