import { describe, expect, it } from "vitest"

import { createLearnerContentService } from "@/modules/content/application/use-cases/learner-content.service"
import {
  courseIdSchema,
  lessonIdSchema,
  unitIdSchema,
} from "@/modules/content/domain/content.ids"
import type { ContentRepository } from "@/modules/content/application/ports/content.repository"
import type {
  CourseDetailDto,
  CourseSummaryDto,
  LessonDto,
} from "@/modules/content/domain/content.dto"
import type { ProgressReader } from "@/modules/learning/domain/learning-progress-read-model"

const courseId = courseIdSchema.parse("c1")
const lessonId = lessonIdSchema.parse("l1")

const courseSummary: CourseSummaryDto = {
  id: courseId,
  title: "글쓰기 첫걸음 30일",
  description: "매일 조금씩 쓰는 습관을 만듭니다.",
  category: "입문자를 위한 코스",
  lessonCount: 1,
  status: "active",
  visualKey: "basic-sentence-writing",
}

const courseDetail: CourseDetailDto = {
  ...courseSummary,
  progress: {
    completedLessons: 0,
    lessons: [],
    nextLesson: null,
    totalLessons: 1,
    percentage: 0,
  },
  units: [
    {
      id: unitIdSchema.parse("u1"),
      title: "문장의 기본기",
      sortOrder: 1,
      lessons: [
        {
          id: lessonId,
          title: "좋은 문장이란 무엇인가",
          category: "문장의 기본기",
          description: "명료하고 군더더기 없는 문장을 살펴봅니다.",
          estimatedMinutes: 5,
          status: "active",
          sortOrder: 1,
        },
      ],
    },
  ],
}

const lesson: LessonDto = {
  id: lessonId,
  courseId,
  unitId: unitIdSchema.parse("u1"),
  title: "좋은 문장이란 무엇인가",
  category: "문장의 기본기",
  description: "명료하고 군더더기 없는 문장을 살펴봅니다.",
  estimatedMinutes: 5,
  summary: ["좋은 문장은 모호하지 않다"],
  steps: [],
}

const repository: ContentRepository = {
  async findCourseDetail(inputCourseId) {
    return inputCourseId === courseId ? courseDetail : null
  },
  async findLesson(inputLessonId) {
    return inputLessonId === lessonId ? lesson : null
  },
  async listCourses() {
    return [courseSummary]
  },
}

describe("학습자 콘텐츠 서비스", () => {
  it("공통 콘텐츠 조회 결과에 학습자 진행률을 합성한다", async () => {
    const progressReader: ProgressReader = {
      async readLearnerProgress() {
        return {
          currentStreakDays: 0,
          lessonProgress: [],
        }
      },
    }
    const service = createLearnerContentService({
      contentRepository: repository,
      progressReader,
    })

    await expect(
      service.getCourseDetail({
        courseId,
        userId: "user-1",
      })
    ).resolves.toEqual({
      kind: "ok",
      value: {
        ...courseDetail,
        progress: {
          completedLessons: 0,
          lessons: [
            {
              currentStepIndex: null,
              lessonId,
              status: "available",
            },
          ],
          nextLesson: {
            currentStepIndex: null,
            estimatedMinutes: 5,
            id: lessonId,
            status: "available",
            title: "좋은 문장이란 무엇인가",
          },
          percentage: 0,
          totalLessons: 1,
        },
      },
    })
  })

  it("코스가 없으면 progress reader를 호출하지 않고 not-found를 반환한다", async () => {
    let progressReadCount = 0
    const progressReader: ProgressReader = {
      async readLearnerProgress() {
        progressReadCount += 1

        return {
          currentStreakDays: 0,
          lessonProgress: [],
        }
      },
    }
    const service = createLearnerContentService({
      contentRepository: repository,
      progressReader,
    })
    const missingCourseId = courseIdSchema.parse("missing-course")

    await expect(
      service.getCourseDetail({
        courseId: missingCourseId,
        userId: "user-1",
      })
    ).resolves.toEqual({
      error: {
        courseId: missingCourseId,
        kind: "course-not-found",
      },
      kind: "err",
    })
    expect(progressReadCount).toBe(0)
  })
})
