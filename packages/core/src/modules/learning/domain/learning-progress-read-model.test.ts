import { describe, expect, it } from "vitest"

import {
  filterCoursesByProgressStatus,
  hasStartedCourse,
  isCourseCompleted,
  matchesProgressCourseStatusFilter,
} from "#core/modules/learning/domain/learning-progress-read-model"
import { lessonIdSchema } from "@workspace/contracts/content/ids"

const inProgressCourse = {
  lessons: [
    {
      currentStepIndex: 2,
      estimatedMinutes: 5,
      id: lessonIdSchema.parse("l1"),
      status: "completed" as const,
      title: "완료 레슨",
    },
    {
      currentStepIndex: null,
      estimatedMinutes: 7,
      id: lessonIdSchema.parse("l2"),
      status: "available" as const,
      title: "다음 레슨",
    },
  ],
  progressPercent: 50,
}

const completedCourse = {
  lessons: [
    {
      currentStepIndex: null,
      estimatedMinutes: 5,
      id: lessonIdSchema.parse("l3"),
      status: "completed" as const,
      title: "완료 레슨",
    },
  ],
  progressPercent: 100,
}

const untouchedCourse = {
  lessons: [
    {
      currentStepIndex: null,
      estimatedMinutes: 5,
      id: lessonIdSchema.parse("l4"),
      status: "available" as const,
      title: "첫 레슨",
    },
  ],
  progressPercent: 0,
}

describe("learning progress read model filter", () => {
  it("시작한 코스와 완료 코스를 구분한다", () => {
    expect(hasStartedCourse(inProgressCourse)).toBe(true)
    expect(isCourseCompleted(inProgressCourse)).toBe(false)
    expect(hasStartedCourse(completedCourse)).toBe(true)
    expect(isCourseCompleted(completedCourse)).toBe(true)
    expect(hasStartedCourse(untouchedCourse)).toBe(false)
    expect(isCourseCompleted(untouchedCourse)).toBe(false)
  })

  it("status 필터에 맞는 코스만 반환한다", () => {
    const courses = [inProgressCourse, completedCourse, untouchedCourse]

    expect(filterCoursesByProgressStatus(courses, "in_progress")).toEqual([
      inProgressCourse,
    ])
    expect(filterCoursesByProgressStatus(courses, "completed")).toEqual([
      completedCourse,
    ])
    expect(filterCoursesByProgressStatus(courses)).toEqual(courses)
  })

  it("status 매칭 규칙을 제공한다", () => {
    expect(
      matchesProgressCourseStatusFilter(inProgressCourse, "in_progress")
    ).toBe(true)
    expect(
      matchesProgressCourseStatusFilter(completedCourse, "completed")
    ).toBe(true)
    expect(
      matchesProgressCourseStatusFilter(untouchedCourse, "in_progress")
    ).toBe(false)
  })
})
