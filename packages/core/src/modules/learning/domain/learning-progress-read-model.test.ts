import { describe, expect, it } from "vitest"
import {
  courseDetailDtoSchema,
  courseSummaryDtoSchema,
} from "@workspace/contracts/content"

import {
  toCourseProgress,
  withLearnerCourseProgress,
} from "@workspace/core/modules/learning/domain/learning-progress-read-model"

describe("학습 진행 read model", () => {
  it("첫 미완료 lesson만 available로 계산하고 이후 lesson은 locked로 둔다", () => {
    expect(
      toCourseProgress(courseSummary, courseDetail, [
        {
          currentStepIndex: 0,
          lessonId: "l1",
          status: "completed",
        },
        {
          currentStepIndex: 2,
          lessonId: "l-new",
          status: "in_progress",
        },
      ])
    ).toEqual({
      id: "c1",
      lessons: [
        {
          currentStepIndex: 0,
          estimatedMinutes: 5,
          id: "l1",
          status: "completed",
          title: "좋은 문장이란 무엇인가",
        },
        {
          currentStepIndex: 2,
          estimatedMinutes: 10,
          id: "l-new",
          status: "available",
          title: "새 학습 활동 둘러보기",
        },
        {
          currentStepIndex: null,
          estimatedMinutes: 5,
          id: "l2",
          status: "locked",
          title: "한 문장에 한 생각만 담기",
        },
      ],
      nextLessons: [
        {
          courseId: "c1",
          currentStepIndex: 2,
          estimatedMinutes: 10,
          id: "l-new",
          status: "available",
          title: "새 학습 활동 둘러보기",
        },
      ],
      progressPercent: 33,
      title: "글쓰기 첫걸음 30일",
      visualKey: "basic-sentence-writing",
    })
  })

  it("모든 lesson을 완료하면 course 상세의 nextLesson을 비운다", () => {
    expect(
      withLearnerCourseProgress(courseDetail, [
        {
          currentStepIndex: 0,
          lessonId: "l1",
          status: "completed",
        },
        {
          currentStepIndex: 2,
          lessonId: "l-new",
          status: "completed",
        },
        {
          currentStepIndex: 0,
          lessonId: "l2",
          status: "completed",
        },
      ]).progress
    ).toMatchObject({
      completedLessons: 3,
      nextLesson: null,
      percentage: 100,
      totalLessons: 3,
    })
  })
})

const courseSummary = courseSummaryDtoSchema.parse({
  category: "입문자를 위한 코스",
  description: "매일 조금씩 쓰는 습관을 만듭니다.",
  id: "c1",
  lessonCount: 3,
  status: "active",
  title: "글쓰기 첫걸음 30일",
  visualKey: "basic-sentence-writing",
})

const courseDetail = courseDetailDtoSchema.parse({
  category: "입문자를 위한 코스",
  description: "매일 조금씩 쓰는 습관을 만듭니다.",
  id: "c1",
  lessonCount: 3,
  progress: {
    completedLessons: 0,
    lessons: [
      {
        currentStepIndex: null,
        lessonId: "l1",
        status: "available",
      },
      {
        currentStepIndex: null,
        lessonId: "l-new",
        status: "locked",
      },
      {
        currentStepIndex: null,
        lessonId: "l2",
        status: "locked",
      },
    ],
    nextLesson: {
      currentStepIndex: null,
      estimatedMinutes: 5,
      id: "l1",
      status: "available",
      title: "좋은 문장이란 무엇인가",
    },
    percentage: 0,
    totalLessons: 3,
  },
  status: "active",
  title: "글쓰기 첫걸음 30일",
  visualKey: "basic-sentence-writing",
  units: [
    {
      id: "u1",
      lessons: [
        {
          category: "문장의 기본기",
          description: "명료하고 군더더기 없는 문장을 살펴봅니다.",
          estimatedMinutes: 5,
          id: "l1",
          sortOrder: 1,
          status: "active",
          title: "좋은 문장이란 무엇인가",
        },
        {
          category: "문장의 기본기",
          description: "새 학습 활동을 살펴봅니다.",
          estimatedMinutes: 10,
          id: "l-new",
          sortOrder: 2,
          status: "active",
          title: "새 학습 활동 둘러보기",
        },
        {
          category: "문장의 기본기",
          description: "한 문장에는 한 생각만 담습니다.",
          estimatedMinutes: 5,
          id: "l2",
          sortOrder: 3,
          status: "active",
          title: "한 문장에 한 생각만 담기",
        },
      ],
      sortOrder: 1,
      title: "문장의 기본기",
    },
  ],
})
