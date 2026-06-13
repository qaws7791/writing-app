import { describe, expect, it } from "vitest"

import { createKwepDatabase } from "@/client"
import { runBaselineMigration } from "@/migrations/migrate"
import { createDrizzleAdminRepository } from "@/repositories/admin.repository"
import {
  authUsers,
  courseUnits,
  courses,
  learnerActivityDays,
  learnerLessonProgress,
  learnerProfiles,
  lessons,
} from "@/schema"

describe("어드민 DB repository", () => {
  it("기존 학습자와 콘텐츠 테이블에서 dashboard 지표를 계산한다", async () => {
    const client = createKwepDatabase(":memory:")
    const now = new Date("2026-06-14T03:00:00.000Z")

    try {
      runBaselineMigration(client.sqlite)
      seedDashboardRows(client.db)

      const repository = createDrizzleAdminRepository(client.db)

      await expect(repository.readDashboard({ now })).resolves.toEqual({
        metrics: {
          activeCourses: 1,
          activeLessons: 2,
          activeUsersLast7Days: 2,
          completedLessons: 3,
          signupsLast7Days: 2,
          signupsToday: 1,
          totalUsers: 2,
        },
        recentActivities: [
          {
            currentStreakDays: 3,
            email: "learner-one@example.com",
            lastActiveDate: "2026-06-14",
            name: "첫 학습자",
            userId: "user-1",
          },
          {
            currentStreakDays: 1,
            email: "learner-two@example.com",
            lastActiveDate: "2026-06-10",
            name: "둘째 학습자",
            userId: "user-2",
          },
        ],
      })
    } finally {
      client.close()
    }
  })

  it("사용자 목록과 상세, 상태 변경, 삭제 상태 전환을 처리한다", async () => {
    const client = createKwepDatabase(":memory:")
    const now = new Date("2026-06-14T03:00:00.000Z")

    try {
      runBaselineMigration(client.sqlite)
      seedDashboardRows(client.db)

      const repository = createDrizzleAdminRepository(client.db)

      await expect(
        repository.readUsers({
          page: 1,
          pageSize: 1,
          query: "학습자",
          sort: "lastActive",
          status: "all",
        })
      ).resolves.toEqual({
        items: [
          {
            email: "learner-one@example.com",
            id: "user-1",
            joined: "2026-06-14",
            lastActive: "2026-06-14",
            lessonsDone: 2,
            name: "첫 학습자",
            status: "active",
            streak: 3,
          },
        ],
        pagination: {
          page: 1,
          pageSize: 1,
          totalItems: 2,
          totalPages: 2,
        },
      })

      await expect(
        repository.readUsers({
          page: 1,
          pageSize: 12,
          query: "",
          sort: "lessonsDone",
          status: "suspended",
        })
      ).resolves.toMatchObject({
        items: [
          {
            email: "learner-two@example.com",
            id: "user-2",
            lessonsDone: 1,
            status: "suspended",
          },
        ],
      })

      await expect(repository.readUser({ userId: "user-1" })).resolves.toEqual({
        email: "learner-one@example.com",
        id: "user-1",
        joined: "2026-06-14",
        lastActive: "2026-06-14",
        lessonsDone: 2,
        name: "첫 학습자",
        progressPercent: 100,
        status: "active",
        streak: 3,
        totalLessons: 2,
      })

      await expect(
        repository.updateUserStatus({
          now,
          status: "suspended",
          userId: "user-1",
        })
      ).resolves.toMatchObject({
        id: "user-1",
        status: "suspended",
      })

      await expect(
        repository.deleteUser({ now, userId: "user-1" })
      ).resolves.toEqual({ deleted: true })
      await expect(repository.readUser({ userId: "user-1" })).resolves.toEqual(
        expect.objectContaining({
          id: "user-1",
          lessonsDone: 2,
          status: "deleted",
        })
      )
    } finally {
      client.close()
    }
  })
})

function seedDashboardRows(db: ReturnType<typeof createKwepDatabase>["db"]) {
  const today = new Date("2026-06-14T00:30:00.000Z")
  const yesterday = new Date("2026-06-13T00:30:00.000Z")
  const twoDaysAgo = new Date("2026-06-12T00:30:00.000Z")
  const older = new Date("2026-06-01T00:30:00.000Z")

  db.insert(authUsers)
    .values([
      {
        createdAt: today,
        email: "learner-one@example.com",
        emailVerified: true,
        id: "user-1",
        image: null,
        name: "첫 학습자",
        updatedAt: today,
      },
      {
        createdAt: new Date("2026-06-10T00:30:00.000Z"),
        email: "learner-two@example.com",
        emailVerified: true,
        id: "user-2",
        image: null,
        name: "둘째 학습자",
        updatedAt: today,
      },
      {
        createdAt: older,
        email: "deleted@example.com",
        emailVerified: true,
        id: "user-3",
        image: null,
        name: "삭제 학습자",
        updatedAt: today,
      },
    ])
    .run()

  db.insert(learnerProfiles)
    .values([
      {
        deletedAt: null,
        displayName: "첫 학습자",
        status: "active",
        userId: "user-1",
      },
      {
        deletedAt: null,
        displayName: "둘째 학습자",
        status: "suspended",
        userId: "user-2",
      },
      {
        deletedAt: today,
        displayName: "삭제 학습자",
        status: "deleted",
        userId: "user-3",
      },
    ])
    .run()

  db.insert(courses)
    .values([
      {
        category: "입문",
        curriculumRevision: 0,
        description: "활성 코스",
        id: "course-1",
        sortOrder: 1,
        status: "active",
        title: "활성 코스",
      },
      {
        category: "입문",
        curriculumRevision: 0,
        description: "보관 코스",
        id: "course-2",
        sortOrder: 2,
        status: "archived",
        title: "보관 코스",
      },
    ])
    .run()
  db.insert(courseUnits)
    .values({
      courseId: "course-1",
      id: "unit-1",
      sortOrder: 1,
      status: "active",
      title: "기본 유닛",
    })
    .run()
  db.insert(lessons)
    .values([
      {
        category: "기본",
        courseId: "course-1",
        description: "첫 레슨",
        estimatedMinutes: 5,
        id: "lesson-1",
        sortOrder: 1,
        status: "active",
        summaryJson: "[]",
        title: "첫 레슨",
        unitId: "unit-1",
      },
      {
        category: "기본",
        courseId: "course-1",
        description: "둘째 레슨",
        estimatedMinutes: 5,
        id: "lesson-2",
        sortOrder: 2,
        status: "active",
        summaryJson: "[]",
        title: "둘째 레슨",
        unitId: "unit-1",
      },
      {
        category: "기본",
        courseId: "course-1",
        description: "보관 레슨",
        estimatedMinutes: 5,
        id: "lesson-3",
        sortOrder: 3,
        status: "archived",
        summaryJson: "[]",
        title: "보관 레슨",
        unitId: "unit-1",
      },
    ])
    .run()

  db.insert(learnerLessonProgress)
    .values([
      {
        completedAt: today,
        currentStepIndex: 3,
        lessonId: "lesson-1",
        startedAt: twoDaysAgo,
        status: "completed",
        updatedAt: today,
        userId: "user-1",
      },
      {
        completedAt: yesterday,
        currentStepIndex: 2,
        lessonId: "lesson-2",
        startedAt: yesterday,
        status: "completed",
        updatedAt: yesterday,
        userId: "user-1",
      },
      {
        completedAt: older,
        currentStepIndex: 2,
        lessonId: "lesson-1",
        startedAt: older,
        status: "completed",
        updatedAt: older,
        userId: "user-2",
      },
    ])
    .run()

  db.insert(learnerActivityDays)
    .values([
      {
        activityDate: "2026-06-14",
        completedLessons: 1,
        firstActivityAt: today,
        lastActivityAt: today,
        savedAnswers: 2,
        userId: "user-1",
      },
      {
        activityDate: "2026-06-13",
        completedLessons: 1,
        firstActivityAt: yesterday,
        lastActivityAt: yesterday,
        savedAnswers: 1,
        userId: "user-1",
      },
      {
        activityDate: "2026-06-12",
        completedLessons: 0,
        firstActivityAt: twoDaysAgo,
        lastActivityAt: twoDaysAgo,
        savedAnswers: 1,
        userId: "user-1",
      },
      {
        activityDate: "2026-06-10",
        completedLessons: 1,
        firstActivityAt: older,
        lastActivityAt: new Date("2026-06-10T01:00:00.000Z"),
        savedAnswers: 1,
        userId: "user-2",
      },
    ])
    .run()
}
