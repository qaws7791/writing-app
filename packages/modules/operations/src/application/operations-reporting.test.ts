import { describe, expect, it, vi } from "vitest"
import type { CourseId, LessonId, UserId } from "@workspace/types/ids"

import { createOperationsReportingQueries } from "#operations/application/operations-reporting"

describe("operations reporting application", () => {
  it("identity, content, learning port를 기다림 없이 모두 시작한다", async () => {
    const identity = deferred<readonly []>()
    const content = deferred({
      activeCourses: 0,
      activeLessons: 0,
      lessons: [],
    })
    const learning = deferred({ learnerActivities: [], lessonProgress: [] })
    const calls: string[] = []
    const query = createOperationsReportingQueries({
      observer: vi.fn(),
      ports: {
        content: {
          readContentReport() {
            calls.push("content")
            return content.promise
          },
        },
        identity: {
          readNonDeletedLearners() {
            calls.push("identity")
            return identity.promise
          },
        },
        learning: {
          readOperationsReport() {
            calls.push("learning")
            return learning.promise
          },
        },
      },
    })

    const resultPromise = query.readDashboard({
      now: new Date("2026-07-23T00:00:00.000Z"),
    })
    expect(calls).toEqual(["identity", "content", "learning"])
    identity.resolve([])
    content.resolve({ activeCourses: 0, activeLessons: 0, lessons: [] })
    learning.resolve({ learnerActivities: [], lessonProgress: [] })
    await expect(resultPromise.then((result) => result.isOk())).resolves.toBe(
      true
    )
  })

  it("부분 실패를 0 값으로 병합하지 않고 실패 source를 관측한다", async () => {
    const observer = vi.fn()
    const query = createOperationsReportingQueries({
      observer,
      ports: {
        content: {
          async readContentReport() {
            throw new Error("content unavailable")
          },
        },
        identity: { readNonDeletedLearners: async () => [] },
        learning: {
          readOperationsReport: async () => ({
            learnerActivities: [],
            lessonProgress: [],
          }),
        },
      },
    })

    const result = await query.readDashboard({
      now: new Date("2026-07-23T00:00:00.000Z"),
    })
    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error).toEqual({
        kind: "reporting-unavailable",
        sources: ["content"],
      })
    }
    expect(observer).toHaveBeenCalledWith({
      kind: "operations-reporting-source-failed",
      source: "content",
    })
  })

  it("세 모듈 snapshot을 dashboard와 lesson analytics로 join한다", async () => {
    const userId = "user-1" as UserId
    const lessonId = "lesson-1" as LessonId
    const query = createOperationsReportingQueries({
      observer: vi.fn(),
      ports: {
        content: {
          readContentReport: async () => ({
            activeCourses: 1,
            activeLessons: 1,
            lessons: [
              {
                courseId: "course-1" as CourseId,
                courseTitle: "글쓰기",
                lessonId,
                lessonTitle: "문장",
              },
            ],
          }),
        },
        identity: {
          readNonDeletedLearners: async () => [
            {
              createdAt: new Date("2026-07-22T03:00:00.000Z"),
              email: "learner@example.com",
              id: userId,
              name: "학습자",
            },
          ],
        },
        learning: {
          readOperationsReport: async () => ({
            learnerActivities: [
              {
                currentStreakDays: 2,
                lastActiveDate: "2026-07-23",
                userId,
              },
            ],
            lessonProgress: [
              {
                completedAt: "2026-07-23",
                lessonId,
                status: "completed",
                userId,
              },
            ],
          }),
        },
      },
    })

    const dashboard = await query.readDashboard({
      now: new Date("2026-07-23T03:00:00.000Z"),
    })
    const lessons = await query.readLessonAnalytics({
      direction: "asc",
      page: 1,
      pageSize: 10,
      query: "",
      sort: "completionRate",
    })
    expect(dashboard.isOk() && dashboard.value.metrics).toMatchObject({
      activeUsersLast7Days: 1,
      completedLessons: 1,
      totalUsers: 1,
    })
    expect(lessons.isOk() && lessons.value.items[0]).toMatchObject({
      completed: 1,
      completionRate: 100,
      started: 1,
    })
  })
})

function deferred<T>(initial?: T) {
  let resolvePromise!: (value: T) => void
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve
  })
  return {
    promise,
    resolve: (value: T = initial as T) => resolvePromise(value),
  }
}
