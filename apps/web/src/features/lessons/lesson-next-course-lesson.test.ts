import { describe, expect, it } from "vitest"

import type {
  CourseDetail,
  CourseLessonSummary,
} from "@/features/courses/course-types"
import { getNextCourseLesson } from "@/features/lessons/lesson-next-course-lesson"

describe("다음 코스 레슨 selector", () => {
  it("unit order와 lesson order 기준으로 현재 레슨 다음 항목을 반환한다", () => {
    expect(getNextCourseLesson(courseDetail, "l1")).toEqual(lesson("l2", 2))
    expect(getNextCourseLesson(courseDetail, "l2")).toEqual(lesson("l3", 1))
  })

  it("course detail이 없거나 현재 레슨이 마지막이면 null을 반환한다", () => {
    expect(getNextCourseLesson(undefined, "l1")).toBeNull()
    expect(getNextCourseLesson(courseDetail, "missing")).toBeNull()
    expect(getNextCourseLesson(courseDetail, "l3")).toBeNull()
  })
})

const courseDetail: CourseDetail = {
  category: "입문자를 위한 코스",
  description: "매일 조금씩 쓰는 습관을 만듭니다.",
  id: "c1",
  lessonCount: 3,
  progress: {
    completedLessons: 1,
    lessons: [],
    nextLesson: null,
    totalLessons: 3,
  },
  progressPercent: 33,
  status: "active",
  title: "글쓰기 첫걸음 30일",
  units: [
    {
      id: "u2",
      lessons: [lesson("l3", 1)],
      order: 2,
      title: "두 번째 유닛",
    },
    {
      id: "u1",
      lessons: [lesson("l2", 2), lesson("l1", 1)],
      order: 1,
      title: "첫 번째 유닛",
    },
  ],
  visualKey: "basic-sentence-writing",
}

function lesson(id: string, order: number): CourseLessonSummary {
  return {
    category: "문장의 기본기",
    description: "명료하고 군더더기 없는 문장을 살펴봅니다.",
    estimatedMinutes: 5,
    id,
    order,
    status: "active",
    title:
      id === "l1"
        ? "좋은 문장이란 무엇인가"
        : id === "l2"
          ? "한 문장에 한 생각만 담기"
          : "문장 다듬기",
  }
}
