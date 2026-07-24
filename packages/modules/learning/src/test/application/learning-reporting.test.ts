import { describe, expect, it, vi } from "vitest"

import type {
  CourseId,
  CurriculumVersionId,
  UserId,
} from "@workspace/types/ids"

import {
  createLearningProfileStatsQuery,
  createLearningReportingQuery,
} from "#learning/application/learning-reporting"

const learnerId = "learner-1" as UserId

describe("learning reporting query", () => {
  it("content와 persistence report를 공개 query port로 조합한다", async () => {
    const readLearnerReports = vi.fn(async () => [
      {
        completedLessons: 2,
        currentStreakDays: 3,
        lastActive: "2026-07-23",
        userId: learnerId,
      },
    ])
    const reporting = createLearningReportingQuery({
      content: {
        async listPublishedCourses() {
          return [
            createCourseSummary("course-1", 2),
            createCourseSummary("course-2", 3),
          ]
        },
      },
      repository: { readLearnerReports },
    })

    await expect(reporting.readActiveLessonCount()).resolves.toBe(5)
    await expect(reporting.readLearnerReports([learnerId])).resolves.toEqual([
      expect.objectContaining({ userId: learnerId }),
    ])
    expect(readLearnerReports).toHaveBeenCalledWith([learnerId])
  })

  it("profile 통계를 같은 reporting 결과에서 계산한다", async () => {
    const profile = createLearningProfileStatsQuery({
      reporting: {
        async readActiveLessonCount() {
          return 5
        },
        async readLearnerReports() {
          return [
            {
              completedLessons: 2,
              currentStreakDays: 3,
              lastActive: "2026-07-23",
              userId: learnerId,
            },
          ]
        },
      },
    })

    await expect(profile.readProfileStats(learnerId)).resolves.toEqual({
      completedLessons: 2,
      currentStreakDays: 3,
      lastActiveDate: "2026-07-23",
      progressPercent: 40,
      totalLessons: 5,
    })
  })
})

function createCourseSummary(courseId: string, lessonCount: number) {
  return {
    category: "기초",
    courseId: courseId as CourseId,
    coverAssetId: null,
    description: "설명",
    lessonCount,
    revision: 1,
    sortOrder: 1,
    title: "학습 코스",
    versionId: `${courseId}-v1` as CurriculumVersionId,
    visualKey: "basic-sentence-writing" as const,
  }
}
