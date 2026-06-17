import { describe, expect, it } from "vitest"

import { createContentService } from "@/content/content.service"
import {
  courseIdSchema,
  lessonIdSchema,
  unitIdSchema,
} from "@/content/content.ids"
import type { ContentRepository } from "@/content/content.repository"
import type {
  CourseDetailDto,
  CourseSummaryDto,
  LessonDto,
} from "@/content/content.dto"

const courseSummary: CourseSummaryDto = {
  id: courseIdSchema.parse("c1"),
  title: "글쓰기 첫걸음 30일",
  description: "매일 조금씩 쓰는 습관을 만듭니다.",
  category: "입문자를 위한 코스",
  lessonCount: 10,
  status: "active",
  visualKey: "basic-sentence-writing",
}

const courseDetail: CourseDetailDto = {
  ...courseSummary,
  progress: {
    completedLessons: 0,
    lessons: [],
    nextLesson: null,
    totalLessons: 10,
    percentage: 0,
  },
  units: [],
}

const lesson: LessonDto = {
  id: lessonIdSchema.parse("l1"),
  courseId: courseIdSchema.parse("c1"),
  unitId: unitIdSchema.parse("u1"),
  title: "좋은 문장이란 무엇인가",
  category: "문장의 기본기",
  description: "명료하고 군더더기 없는 문장을 살펴봅니다.",
  estimatedMinutes: 5,
  summary: ["좋은 문장은 모호하지 않다"],
  steps: [],
}

const repository: ContentRepository = {
  async findCourseDetail(courseId) {
    return courseId === courseSummary.id ? courseDetail : null
  },
  async findLesson(lessonId) {
    return lessonId === lesson.id ? lesson : null
  },
  async listCourses() {
    return [courseSummary]
  },
}

describe("콘텐츠 서비스", () => {
  it("repository 코스 목록을 course list DTO로 감싼다", async () => {
    const service = createContentService(repository)

    await expect(service.listCourses()).resolves.toEqual({
      courses: [courseSummary],
    })
  })

  it("코스 상세와 레슨 조회 결과를 Result로 반환한다", async () => {
    const service = createContentService(repository)

    await expect(
      service.getCourseDetail(courseIdSchema.parse("c1"))
    ).resolves.toEqual({
      kind: "ok",
      value: courseDetail,
    })
    await expect(
      service.getLesson(lessonIdSchema.parse("l1"))
    ).resolves.toEqual({
      kind: "ok",
      value: lesson,
    })
  })

  it("없는 코스와 레슨을 명시적 not-found error로 반환한다", async () => {
    const service = createContentService(repository)

    await expect(
      service.getCourseDetail(courseIdSchema.parse("missing-course"))
    ).resolves.toEqual({
      kind: "err",
      error: {
        kind: "course-not-found",
        courseId: courseIdSchema.parse("missing-course"),
      },
    })
    await expect(
      service.getLesson(lessonIdSchema.parse("missing-lesson"))
    ).resolves.toEqual({
      kind: "err",
      error: {
        kind: "lesson-not-found",
        lessonId: lessonIdSchema.parse("missing-lesson"),
      },
    })
  })
})
