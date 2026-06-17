import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

import { eq } from "drizzle-orm"

import { createKwepDatabase } from "@/client"
import { runBaselineMigration } from "@/migrations/migrate"
import { createDrizzleAdminRepository } from "@/repositories/admin.repository"
import {
  toCourseId,
  toLessonId,
  toLessonStepId,
  toUnitId,
  type CreateAdminCourseContentIds,
  type NewAdminCourseContentIds,
} from "@/repositories/admin-content-ids"
import { createDrizzleContentRepository } from "@/repositories/content.repository"
import {
  authUsers,
  courseUnits,
  courses,
  learnerActivityDays,
  learnerLessonProgress,
  learnerProfiles,
  lessonSteps,
  lessons,
} from "@/schema"

describe("어드민 DB repository", () => {
  it("사용자 목록 페이지네이션은 JS 배열 slice가 아니라 DB 쿼리 경계에서 처리한다", () => {
    const repositorySource = readFileSync(
      fileURLToPath(new URL("admin.repository.ts", import.meta.url)),
      "utf8"
    )
    const readUsersSource = readFunctionSource(repositorySource, "readUsers")

    expect(readUsersSource).toBeDefined()
    expect(readUsersSource).not.toContain(".slice(")
  })

  it("코스와 레슨 분석 목록 페이지네이션은 DB 쿼리 경계에서 처리한다", () => {
    const repositorySource = readFileSync(
      fileURLToPath(new URL("admin.repository.ts", import.meta.url)),
      "utf8"
    )
    const readCoursesSource = readFunctionSource(
      repositorySource,
      "readCourses"
    )
    const readLessonAnalyticsSource = readFunctionSource(
      repositorySource,
      "readLessonAnalytics"
    )

    expect(readCoursesSource).toBeDefined()
    expect(readLessonAnalyticsSource).toBeDefined()
    expect(readCoursesSource).not.toContain(".slice(")
    expect(readCoursesSource).not.toMatch(/\.all\(\)[\s\S]*?\.filter/)
    expect(readLessonAnalyticsSource).not.toContain(".slice(")
    expect(readLessonAnalyticsSource).not.toMatch(/\.all\(\)[\s\S]*?\.filter/)
  })

  it("코스 편집 조회는 전체 테이블을 읽은 뒤 중첩 filter로 조합하지 않는다", () => {
    const repositorySource = readFileSync(
      fileURLToPath(new URL("admin.repository.ts", import.meta.url)),
      "utf8"
    )
    const readCourseEditorSource = readFunctionSource(
      repositorySource,
      "readCourseEditor"
    )

    expect(readCourseEditorSource).toBeDefined()
    expect(readCourseEditorSource).not.toMatch(
      /from\(courseUnits\)[\s\S]*?\.all\(\)[\s\S]*?\.filter/
    )
    expect(readCourseEditorSource).not.toMatch(
      /from\(lessons\)[\s\S]*?\.all\(\)[\s\S]*?\.filter/
    )
    expect(readCourseEditorSource).not.toMatch(
      /from\(lessonSteps\)[\s\S]*?\.all\(\)[\s\S]*?\.filter/
    )
    expect(readCourseEditorSource).not.toMatch(/lessonRows[\s\S]*?\.filter/)
    expect(readCourseEditorSource).not.toMatch(/stepRows[\s\S]*?\.filter/)
  })

  it("어드민 repository 팩터리는 도메인별 조각으로 조합한다", () => {
    const repositorySource = readFileSync(
      fileURLToPath(new URL("admin.repository.ts", import.meta.url)),
      "utf8"
    )
    const factorySource = readFunctionSource(
      repositorySource,
      "createDrizzleAdminRepository"
    )

    expect(factorySource).toBeDefined()
    expect(factorySource).toContain("createAdminCourseRepository")
    expect(factorySource).toContain("createAdminUserRepository")
    expect(factorySource).toContain("createAdminAnalyticsRepository")
    expect(factorySource).toContain("createAdminSettingsRepository")
    expect(factorySource).not.toContain("archiveCourse(input)")
    expect(factorySource).not.toContain("deleteUser(input)")
    expect(factorySource).not.toContain("readAnalytics(input)")
  })

  it("콘텐츠 reset은 공유 보관 정책을 사용한다", () => {
    const repositorySource = readFileSync(
      fileURLToPath(new URL("admin.repository.ts", import.meta.url)),
      "utf8"
    )

    expect(repositorySource).toContain("archiveContentRowsOutsideSeed")
    expect(repositorySource).not.toContain("function archiveContentOutsideSeed")
  })

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

  it("코스 목록 검색, 카테고리 필터, 상태 필터, 페이지네이션을 처리한다", async () => {
    const client = createKwepDatabase(":memory:")

    try {
      runBaselineMigration(client.sqlite)
      seedDashboardRows(client.db)

      const repository = createDrizzleAdminRepository(client.db)

      await expect(
        repository.readCourses({
          category: "입문",
          page: 1,
          pageSize: 20,
          query: "활성",
          status: "active",
        })
      ).resolves.toEqual({
        items: [
          {
            category: "입문",
            id: "course-1",
            lessonCount: 2,
            revision: 0,
            status: "active",
            title: "활성 코스",
            unitCount: 1,
          },
        ],
        pagination: {
          page: 1,
          pageSize: 20,
          totalItems: 1,
          totalPages: 1,
        },
      })

      await expect(
        repository.readCourses({
          category: "",
          page: 1,
          pageSize: 1,
          query: "코스",
          status: "all",
        })
      ).resolves.toEqual({
        items: [
          {
            category: "입문",
            id: "course-1",
            lessonCount: 2,
            revision: 0,
            status: "active",
            title: "활성 코스",
            unitCount: 1,
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
        repository.readCourses({
          category: "",
          page: 1,
          pageSize: 20,
          query: "",
          status: "archived",
        })
      ).resolves.toMatchObject({
        items: [
          {
            id: "course-2",
            status: "archived",
            title: "보관 코스",
          },
        ],
      })
    } finally {
      client.close()
    }
  })

  it("기존 학습자와 학습 진행 테이블에서 분석 지표를 계산한다", async () => {
    const client = createKwepDatabase(":memory:")
    const now = new Date("2026-06-14T03:00:00.000Z")

    try {
      runBaselineMigration(client.sqlite)
      seedDashboardRows(client.db)

      const repository = createDrizzleAdminRepository(client.db)

      await expect(
        repository.readAnalytics({
          days: 3,
          now,
        })
      ).resolves.toEqual({
        dailySeries: [
          {
            completions: 0,
            date: "2026-06-12",
            signups: 0,
          },
          {
            completions: 1,
            date: "2026-06-13",
            signups: 0,
          },
          {
            completions: 1,
            date: "2026-06-14",
            signups: 1,
          },
        ],
        streakBuckets: [
          {
            count: 0,
            label: "0일",
          },
          {
            count: 2,
            label: "1-3일",
          },
          {
            count: 0,
            label: "4-7일",
          },
          {
            count: 0,
            label: "8-14일",
          },
          {
            count: 0,
            label: "15일+",
          },
        ],
        worstLessons: [
          {
            completed: 1,
            completionRate: 50,
            courseId: "course-1",
            courseTitle: "활성 코스",
            dropOffRate: 50,
            lessonId: "lesson-2",
            lessonTitle: "둘째 레슨",
            started: 2,
          },
          {
            completed: 2,
            completionRate: 100,
            courseId: "course-1",
            courseTitle: "활성 코스",
            dropOffRate: 0,
            lessonId: "lesson-1",
            lessonTitle: "첫 레슨",
            started: 2,
          },
        ],
      })

      await expect(
        repository.readLessonAnalytics({
          direction: "asc",
          page: 1,
          pageSize: 10,
          query: "레슨",
          sort: "completionRate",
        })
      ).resolves.toEqual({
        items: [
          {
            completed: 1,
            completionRate: 50,
            courseId: "course-1",
            courseTitle: "활성 코스",
            dropOffRate: 50,
            lessonId: "lesson-2",
            lessonTitle: "둘째 레슨",
            started: 2,
          },
          {
            completed: 2,
            completionRate: 100,
            courseId: "course-1",
            courseTitle: "활성 코스",
            dropOffRate: 0,
            lessonId: "lesson-1",
            lessonTitle: "첫 레슨",
            started: 2,
          },
        ],
        pagination: {
          page: 1,
          pageSize: 10,
          totalItems: 2,
          totalPages: 1,
        },
      })
    } finally {
      client.close()
    }
  })

  it("운영 설정 저장과 Kwep seed 콘텐츠 초기화를 처리한다", async () => {
    const client = createKwepDatabase(":memory:")
    const now = new Date("2026-06-14T03:00:00.000Z")

    try {
      runBaselineMigration(client.sqlite)

      const repository = createDrizzleAdminRepository(client.db)

      await expect(repository.readSettings()).resolves.toEqual({
        legal: {
          privacy: "",
          terms: "",
        },
        notice: {
          announce: "",
          banner: "",
        },
      })
      await expect(
        repository.saveNoticeSettings({
          announce: "공지 내용",
          banner: "새 강의가 추가되었어요!",
          now,
        })
      ).resolves.toEqual({
        legal: {
          privacy: "",
          terms: "",
        },
        notice: {
          announce: "공지 내용",
          banner: "새 강의가 추가되었어요!",
        },
      })
      await expect(
        repository.saveLegalSettings({
          now,
          privacy: "개인정보처리방침",
          terms: "이용약관",
        })
      ).resolves.toEqual({
        legal: {
          privacy: "개인정보처리방침",
          terms: "이용약관",
        },
        notice: {
          announce: "공지 내용",
          banner: "새 강의가 추가되었어요!",
        },
      })

      await expect(repository.resetContent({ now })).resolves.toEqual({
        changed: {
          archived: 0,
          courses: 5,
          lessons: 44,
          steps: 136,
          units: 15,
        },
        revision: 1,
      })
      expect(
        client.db
          .select()
          .from(courses)
          .all()
          .filter((course) => course.status === "active")
      ).toHaveLength(5)
      expect(
        client.db
          .select()
          .from(courseUnits)
          .all()
          .filter((unit) => unit.status === "active")
      ).toHaveLength(15)
      expect(
        client.db
          .select()
          .from(lessons)
          .all()
          .filter((lesson) => lesson.status === "active")
      ).toHaveLength(44)
      expect(
        client.db
          .select()
          .from(lessonSteps)
          .all()
          .filter((step) => step.status === "active")
      ).toHaveLength(136)
    } finally {
      client.close()
    }
  })

  it("콘텐츠 reset은 seed 밖 활성 콘텐츠를 보관하고 변경 수를 반환한다", async () => {
    const client = createKwepDatabase(":memory:")
    const now = new Date("2026-06-14T03:00:00.000Z")

    try {
      runBaselineMigration(client.sqlite)
      seedOutsideContentRows(client.db)

      const repository = createDrizzleAdminRepository(client.db)

      await expect(repository.resetContent({ now })).resolves.toEqual({
        changed: {
          archived: 4,
          courses: 5,
          lessons: 44,
          steps: 136,
          units: 15,
        },
        revision: 1,
      })
      expect(
        client.db
          .select()
          .from(courses)
          .where(eq(courses.id, "outside-course"))
          .get()?.status
      ).toBe("archived")
      expect(
        client.db
          .select()
          .from(courseUnits)
          .where(eq(courseUnits.id, "outside-unit"))
          .get()?.status
      ).toBe("archived")
      expect(
        client.db
          .select()
          .from(lessons)
          .where(eq(lessons.id, "outside-lesson"))
          .get()?.status
      ).toBe("archived")
      expect(
        client.db
          .select()
          .from(lessonSteps)
          .where(eq(lessonSteps.id, "outside-step"))
          .get()?.status
      ).toBe("archived")
    } finally {
      client.close()
    }
  })

  it("새 코스를 기본 커리큘럼과 함께 만들고 보관하면 학습자 목록에서 제외한다", async () => {
    const client = createKwepDatabase(":memory:")
    const now = new Date("2026-06-14T03:00:00.000Z")

    try {
      runBaselineMigration(client.sqlite)

      const repository = createDrizzleAdminRepository(client.db, {
        createCourseContentIds: createQueuedCourseContentIds("cmqd74yo0"),
      })
      const contentRepository = createDrizzleContentRepository(client.db)

      const created = await repository.createCourse({ now })

      expect(created).toMatchObject({
        category: "미분류",
        description: "강의 설명을 입력하세요.",
        id: "cmqd74yo0",
        revision: 1,
        status: "active",
        title: "새 강의",
      })
      expect(created.units).toHaveLength(1)
      expect(created.units[0]?.title).toBe("새 유닛")
      expect(created.units[0]?.lessons).toHaveLength(1)
      expect(created.units[0]?.lessons[0]).toMatchObject({
        estimatedMinutes: 5,
        id: "cmqd74yo0-l1",
        summary: [],
        title: "새 레슨",
      })
      expect(
        created.units[0]?.lessons[0]?.steps.map((step) => step.type)
      ).toEqual(["READING", "WRITE"])

      await expect(
        repository.readCourseEditor({ courseId: "cmqd74yo0" })
      ).resolves.toEqual(created)
      await expect(contentRepository.listCourses()).resolves.toEqual([
        expect.objectContaining({
          id: "cmqd74yo0",
          lessonCount: 1,
        }),
      ])

      await expect(
        repository.archiveCourse({ courseId: "cmqd74yo0", now })
      ).resolves.toEqual({ archived: true })
      await expect(
        repository.readCourseEditor({ courseId: "cmqd74yo0" })
      ).resolves.toBeNull()
      expect(
        (await contentRepository.listCourses()).map((course) => course.id)
      ).not.toContain("cmqd74yo0")
    } finally {
      client.close()
    }
  })

  it("새 코스 ID 생성은 요청 시각이 아니라 명시적 factory에 맡긴다", async () => {
    const client = createKwepDatabase(":memory:")
    const now = new Date("2026-06-14T03:00:00.000Z")

    try {
      runBaselineMigration(client.sqlite)

      const repository = createDrizzleAdminRepository(client.db, {
        createCourseContentIds: createQueuedCourseContentIds(
          "course-generated-1",
          "course-generated-2"
        ),
      })

      const first = await repository.createCourse({ now })
      const second = await repository.createCourse({ now })

      expect(first.id).toBe("course-generated-1")
      expect(second.id).toBe("course-generated-2")
      expect(
        client.db
          .select()
          .from(courses)
          .all()
          .map((course) => course.id)
          .sort()
      ).toEqual(["course-generated-1", "course-generated-2"])
    } finally {
      client.close()
    }
  })

  it("생성된 콘텐츠 ID가 DB unique constraint와 충돌하면 다시 생성한다", async () => {
    const client = createKwepDatabase(":memory:")
    const now = new Date("2026-06-14T03:00:00.000Z")

    try {
      runBaselineMigration(client.sqlite)

      const repository = createDrizzleAdminRepository(client.db, {
        createCourseContentIds: createQueuedCourseContentIds(
          "course-collision",
          "course-collision",
          "course-retry"
        ),
      })

      await expect(repository.createCourse({ now })).resolves.toMatchObject({
        id: "course-collision",
      })
      await expect(repository.createCourse({ now })).resolves.toMatchObject({
        id: "course-retry",
      })
      expect(
        client.db
          .select()
          .from(courses)
          .all()
          .map((course) => course.id)
          .sort()
      ).toEqual(["course-collision", "course-retry"])
    } finally {
      client.close()
    }
  })
})

function createQueuedCourseContentIds(
  ...courseIds: readonly string[]
): CreateAdminCourseContentIds {
  let index = 0

  return () => {
    const courseId = courseIds[Math.min(index, courseIds.length - 1)]
    index += 1

    if (courseId === undefined) {
      throw new Error("테스트 코스 ID가 비어 있습니다.")
    }

    return createTestCourseContentIds(courseId)
  }
}

function createTestCourseContentIds(
  courseId: string
): NewAdminCourseContentIds {
  const lessonId = `${courseId}-l1`

  return {
    courseId: toCourseId(courseId),
    lessonId: toLessonId(lessonId),
    readingStepId: toLessonStepId(`${lessonId}-s1`),
    unitId: toUnitId(`${courseId}-u1`),
    writeStepId: toLessonStepId(`${lessonId}-s2`),
  }
}

function seedOutsideContentRows(
  db: ReturnType<typeof createKwepDatabase>["db"]
): void {
  db.insert(courses)
    .values({
      category: "임시",
      curriculumRevision: 0,
      description: "seed 밖 코스",
      id: "outside-course",
      sortOrder: 1,
      status: "active",
      title: "Seed 밖 코스",
    })
    .run()
  db.insert(courseUnits)
    .values({
      courseId: "outside-course",
      id: "outside-unit",
      sortOrder: 1,
      status: "active",
      title: "Seed 밖 유닛",
    })
    .run()
  db.insert(lessons)
    .values({
      category: "임시",
      courseId: "outside-course",
      description: "seed 밖 레슨",
      estimatedMinutes: 5,
      id: "outside-lesson",
      sortOrder: 1,
      status: "active",
      summaryJson: "[]",
      title: "Seed 밖 레슨",
      unitId: "outside-unit",
    })
    .run()
  db.insert(lessonSteps)
    .values({
      contentJson: "{}",
      id: "outside-step",
      lessonId: "outside-lesson",
      sortOrder: 1,
      status: "active",
      type: "READING",
    })
    .run()
}

function readFunctionSource(source: string, name: string): string | undefined {
  const start = source.indexOf(`function ${name}(`)

  if (start < 0) {
    return undefined
  }

  const parametersStart = source.indexOf("(", start)

  if (parametersStart < 0) {
    return undefined
  }

  let parameterDepth = 0
  let parametersEnd = -1

  for (let index = parametersStart; index < source.length; index += 1) {
    const char = source[index]

    if (char === "(") {
      parameterDepth += 1
    }

    if (char === ")") {
      parameterDepth -= 1
    }

    if (parameterDepth === 0) {
      parametersEnd = index
      break
    }
  }

  if (parametersEnd < 0) {
    return undefined
  }

  const bodyStart = source.indexOf("{", parametersEnd)

  if (bodyStart < 0) {
    return undefined
  }

  let depth = 0

  for (let index = bodyStart; index < source.length; index += 1) {
    const char = source[index]

    if (char === "{") {
      depth += 1
    }

    if (char === "}") {
      depth -= 1
    }

    if (depth === 0) {
      return source.slice(start, index + 1)
    }
  }

  return undefined
}

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
      {
        completedAt: null,
        currentStepIndex: 1,
        lessonId: "lesson-2",
        startedAt: today,
        status: "in_progress",
        updatedAt: today,
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
