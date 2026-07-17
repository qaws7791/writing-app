import { describe, expect, it } from "vitest"

import {
  courseIdSchema,
  learnerIdSchema,
  lessonIdSchema,
  type LearnerCourseSort,
} from "@workspace/contracts/learning/read-data"
import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/bun-sqlite"

import {
  createInMemoryWritingAppDatabase,
  type WritingAppDatabaseClient,
} from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"
import * as databaseSchema from "@workspace/db/schema"
import {
  createContentSeedRows,
  readContentSeedData,
} from "@workspace/db/seeds/seed-content"
import { upsertContentSeedRows } from "@workspace/db/seeds/seed"
import type { LearnerCursorPosition } from "@workspace/core/learning"

import { createDrizzleLearnerReadModelRepository } from "@/adapters/learning/learner-read-model-drizzle.repository"
import { LearnerLessonPersistedDataCorruptionError } from "@/adapters/learning/learner-read-persisted-data"

const presentationSecret = "test-presentation-secret-with-32-bytes"
const {
  authUsers,
  courseCurriculumVersions,
  courses,
  courseUnitVersions,
  learnerCourseProgress,
  lessonStepVersions,
  lessonVersions,
} = databaseSchema

describe("학습자 read model Drizzle repository", () => {
  it("검색·분류를 DB에서 적용하고 한글 category를 결정적으로 반환한다", async () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      await seedContent(client)
      const repository = createRepository(client)
      const categories = await repository.listCourseCategories()
      const page = await repository.listCourses({
        category: "입문자를 위한 코스",
        limit: 20,
        query: "글쓰기",
        sort: "title-asc",
      })

      expect(categories).toEqual(
        [...categories].sort((left, right) => left.localeCompare(right, "ko"))
      )
      expect(page.items.length).toBeGreaterThan(0)
      expect(
        page.items.every(
          (course) =>
            course.category === "입문자를 위한 코스" &&
            `${course.title} ${course.description} ${course.category}`.includes(
              "글쓰기"
            )
        )
      ).toBe(true)
    } finally {
      client.close()
    }
  })

  it("같은 정렬 key의 페이지 경계를 course ID로 구분해 중복하지 않는다", async () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      await seedContent(client)
      client.db
        .update(courses)
        .set({ sortOrder: 1 })
        .where(eq(courses.id, "c2"))
        .run()
      const repository = createRepository(client)
      const first = await repository.listCourses({
        limit: 1,
        sort: "recommended",
      })

      expect(first.items.map((course) => course.id)).toEqual(["c1"])
      expect(first.nextPosition).toEqual({ courseId: "c1", primary: 1 })

      const second = await repository.listCourses({
        after: first.nextPosition ?? undefined,
        limit: 1,
        sort: "recommended",
      })

      expect(second.items.map((course) => course.id)).toEqual(["c2"])
      expect(second.items[0]?.id).not.toBe(first.items[0]?.id)
    } finally {
      client.close()
    }
  })

  it.each([
    ["recommended", ["course-a", "course-b", "course-c"]],
    ["title-asc", ["course-a", "course-b", "course-c"]],
    ["title-desc", ["course-c", "course-a", "course-b"]],
    ["lesson-count-asc", ["course-a", "course-b", "course-c"]],
    ["lesson-count-desc", ["course-c", "course-a", "course-b"]],
  ] as const)(
    "%s의 동률 첫·중간·마지막 page에 누락·중복이 없다",
    async (sort, expectedIds) => {
      const client = createInMemoryWritingAppDatabase()

      try {
        seedCursorProjectionCourses(client)
        const { queries, repository } = createObservedRepository(client)
        const result = await collectCoursePages(repository, sort)

        expect(result.ids).toEqual(expectedIds)
        expect(new Set(result.ids).size).toBe(expectedIds.length)
        expect(result.positions).toHaveLength(2)
        expect(queries).toHaveLength(3)
      } finally {
        client.close()
      }
    }
  )

  it("progress timestamp 동률·status·빈 page를 query 수 증가 없이 처리한다", async () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      seedCursorProjectionCourses(client)
      const { queries, repository } = createObservedRepository(client)
      const userId = learnerIdSchema.parse("cursor-user")
      const all = await collectProgressPages(repository, userId)

      expect(all.ids).toEqual(["course-a", "course-b", "course-c"])
      expect(new Set(all.ids).size).toBe(3)
      expect(all.positions).toHaveLength(2)
      expect(queries).toHaveLength(24)
      queries.length = 0

      const completed = await repository.listProgress({
        limit: 10,
        status: "completed",
        userId,
      })
      expect(completed.items.map((course) => course.id)).toEqual(["course-b"])
      expect(completed.nextPosition).toBeNull()
      expect(queries).toHaveLength(8)
      queries.length = 0

      const inProgress = await repository.listProgress({
        limit: 10,
        status: "in_progress",
        userId,
      })
      expect(inProgress.items.map((course) => course.id)).toEqual([
        "course-a",
        "course-c",
      ])
      expect(queries).toHaveLength(15)
      queries.length = 0

      const empty = await repository.listProgress({
        limit: 10,
        userId: learnerIdSchema.parse("learner-without-progress"),
      })
      expect(empty).toEqual({ items: [], nextPosition: null })
      expect(queries).toHaveLength(1)
    } finally {
      client.close()
    }
  })

  it("null·잘못된 cursor primary는 기존 false predicate로 빈 page를 반환한다", async () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      seedCursorProjectionCourses(client)
      const repository = createRepository(client)
      const nullPosition: LearnerCursorPosition = {
        courseId: "course-a",
        primary: 0,
      }
      Object.defineProperty(nullPosition, "primary", { value: null })

      await expect(
        repository.listCourses({
          after: nullPosition,
          limit: 1,
          sort: "title-asc",
        })
      ).resolves.toEqual({ items: [], nextPosition: null })
      await expect(
        repository.listProgress({
          after: {
            courseId: "course-a",
            primary: "not-a-timestamp",
          },
          limit: 1,
          userId: learnerIdSchema.parse("cursor-user"),
        })
      ).resolves.toEqual({ items: [], nextPosition: null })
    } finally {
      client.close()
    }
  })

  it("lesson 공개 JSON은 solution field를 포함하지 않고 잠금 정책을 적용한다", async () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      await seedContent(client)
      const repository = createRepository(client)
      const firstLesson = await repository.findLesson({
        lessonId: lessonIdSchema.parse("l1"),
        userId: learnerIdSchema.parse("user-1"),
      })
      const lockedLesson = await repository.findLesson({
        lessonId: lessonIdSchema.parse("l2"),
        userId: learnerIdSchema.parse("user-1"),
      })

      expect(firstLesson.kind).toBe("found")
      expect(lockedLesson).toEqual({ kind: "locked" })

      if (firstLesson.kind === "found") {
        expect(collectObjectKeys(firstLesson.value.steps)).not.toEqual(
          expect.arrayContaining([
            "analysis",
            "answer",
            "categoryId",
            "correct",
            "explanation",
            "feedback",
            "pairs",
            "score",
            "wrong",
          ])
        )
      }
    } finally {
      client.close()
    }
  })

  it("대표 조회의 SQLite query 수와 step ordering을 고정한다", async () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      await seedContent(client)
      seedLearnerCourseProgress(client)
      const { queries, repository } = createObservedRepository(client)
      const userId = learnerIdSchema.parse("user-1")

      await repository.listCourses({ limit: 20, sort: "recommended" })
      expect(queries).toHaveLength(1)
      queries.length = 0

      await repository.findCourseDetail({
        courseId: courseIdSchema.parse("c1"),
        userId,
      })
      expect(queries).toHaveLength(7)
      queries.length = 0

      const progress = await repository.listProgress({ limit: 20, userId })
      expect(progress.items).toHaveLength(1)
      expect(queries).toHaveLength(8)
      queries.length = 0

      const lesson = await repository.findLesson({
        lessonId: lessonIdSchema.parse("l1"),
        userId,
      })

      expect(queries).toHaveLength(10)
      expect(lesson.kind).toBe("found")
      if (lesson.kind === "found") {
        expect(lesson.value.steps.map((step) => step.sortOrder)).toEqual(
          [...lesson.value.steps]
            .sort((left, right) => left.sortOrder - right.sortOrder)
            .map((step) => step.sortOrder)
        )
      }
    } finally {
      client.close()
    }
  })

  it.each([
    {
      expectedCorruption: {
        field: "lesson-summary",
        lessonId: "l1",
        reason: "invalid-json",
      },
      field: "summary" as const,
    },
    {
      expectedCorruption: {
        field: "lesson-step-content",
        lessonId: "l1",
        reason: "invalid-json",
        stepId: "l1-s1",
      },
      field: "step" as const,
    },
  ])(
    "손상된 $field JSON을 부분 응답 대신 명시적 오류로 격리한다",
    async ({ expectedCorruption, field }) => {
      const client = createInMemoryWritingAppDatabase()

      try {
        await seedContent(client, { corruptField: field })
        const repository = createRepository(client)

        expect(() =>
          repository.findLesson({
            lessonId: lessonIdSchema.parse("l1"),
            userId: learnerIdSchema.parse("user-1"),
          })
        ).toThrowError(LearnerLessonPersistedDataCorruptionError)

        try {
          repository.findLesson({
            lessonId: lessonIdSchema.parse("l1"),
            userId: learnerIdSchema.parse("user-1"),
          })
        } catch (error) {
          expect(error).toMatchObject({ corruption: expectedCorruption })
        }
      } finally {
        client.close()
      }
    }
  )

  it("조회 row가 없으면 decode를 시도하지 않고 not-found를 반환한다", async () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      await seedContent(client)
      const repository = createRepository(client)

      await expect(
        repository.findLesson({
          lessonId: lessonIdSchema.parse("missing-lesson"),
          userId: learnerIdSchema.parse("user-1"),
        })
      ).resolves.toEqual({ kind: "not-found" })
    } finally {
      client.close()
    }
  })

  it("다중 유닛에서는 유닛 순서로 다음 레슨과 잠금 상태를 계산한다", async () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      runBaselineMigration(client.sqlite)
      seedMultiUnitCourse(client)
      const repository = createRepository(client)

      const course = await repository.findCourseDetail({
        courseId: courseIdSchema.parse("course-order"),
        userId: learnerIdSchema.parse("user-1"),
      })
      const firstLesson = await repository.findLesson({
        lessonId: lessonIdSchema.parse("z-first-unit-lesson"),
        userId: learnerIdSchema.parse("user-1"),
      })
      const secondLesson = await repository.findLesson({
        lessonId: lessonIdSchema.parse("a-second-unit-lesson"),
        userId: learnerIdSchema.parse("user-1"),
      })

      expect(course?.learning).toMatchObject({
        nextLesson: { id: "z-first-unit-lesson" },
        status: "not_started",
      })
      expect(
        course?.units
          .flatMap((unit) => unit.lessons)
          .find((lesson) => lesson.id === "z-first-unit-lesson")?.learning
      ).toMatchObject({ status: "not_started" })
      expect(
        course?.units
          .flatMap((unit) => unit.lessons)
          .find((lesson) => lesson.id === "a-second-unit-lesson")?.learning
      ).toMatchObject({ status: "locked" })
      expect(firstLesson.kind).toBe("found")
      expect(secondLesson).toEqual({ kind: "locked" })
    } finally {
      client.close()
    }
  })
})

function createRepository(client: WritingAppDatabaseClient) {
  return createDrizzleLearnerReadModelRepository(client.db, {
    presentationSecret,
  })
}

function createObservedRepository(client: WritingAppDatabaseClient) {
  const queries: string[] = []
  const db = drizzle(client.sqlite, {
    logger: {
      logQuery(query) {
        queries.push(query)
      },
    },
    schema: databaseSchema,
  })

  return {
    queries,
    repository: createDrizzleLearnerReadModelRepository(db, {
      presentationSecret,
    }),
  }
}

type LearnerReadRepository = ReturnType<typeof createRepository>

async function collectCoursePages(
  repository: LearnerReadRepository,
  sort: LearnerCourseSort
): Promise<{
  readonly ids: readonly string[]
  readonly positions: readonly LearnerCursorPosition[]
}> {
  const ids: string[] = []
  const positions: LearnerCursorPosition[] = []
  let after: LearnerCursorPosition | undefined

  for (let pageIndex = 0; pageIndex < 10; pageIndex += 1) {
    const page = await repository.listCourses({
      ...(after === undefined ? {} : { after }),
      limit: 1,
      sort,
    })
    ids.push(...page.items.map((course) => course.id))

    if (page.nextPosition === null) return { ids, positions }
    positions.push(page.nextPosition)
    after = page.nextPosition
  }

  throw new Error("course pagination이 10 page 안에 종료되지 않았습니다.")
}

async function collectProgressPages(
  repository: LearnerReadRepository,
  userId: ReturnType<typeof learnerIdSchema.parse>
): Promise<{
  readonly ids: readonly string[]
  readonly positions: readonly LearnerCursorPosition[]
}> {
  const ids: string[] = []
  const positions: LearnerCursorPosition[] = []
  let after: LearnerCursorPosition | undefined

  for (let pageIndex = 0; pageIndex < 10; pageIndex += 1) {
    const page = await repository.listProgress({
      ...(after === undefined ? {} : { after }),
      limit: 1,
      userId,
    })
    ids.push(...page.items.map((course) => course.id))

    if (page.nextPosition === null) return { ids, positions }
    positions.push(page.nextPosition)
    after = page.nextPosition
  }

  throw new Error("progress pagination이 10 page 안에 종료되지 않았습니다.")
}

async function seedContent(
  client: WritingAppDatabaseClient,
  options: { readonly corruptField?: "step" | "summary" } = {}
): Promise<void> {
  runBaselineMigration(client.sqlite)
  const rows = createContentSeedRows(await readContentSeedData())
  const fixtureRows = {
    ...rows,
    lessons: rows.lessons.map((lesson) =>
      options.corruptField === "summary" && lesson.id === "l1"
        ? { ...lesson, summaryJson: "{" }
        : lesson
    ),
    steps: rows.steps.map((step) =>
      options.corruptField === "step" && step.id === "l1-s1"
        ? { ...step, contentJson: "{" }
        : step
    ),
  }

  client.db.transaction((transaction) => {
    upsertContentSeedRows(transaction, fixtureRows)
  })
}

function seedCursorProjectionCourses(client: WritingAppDatabaseClient): void {
  runBaselineMigration(client.sqlite)
  const now = new Date("2026-07-17T00:00:00.000Z")
  const olderActivityAt = new Date("2026-07-16T00:00:00.000Z")
  const fixtures = [
    {
      id: "course-a",
      lessonCount: 1,
      progressStatus: "in_progress" as const,
      sortOrder: 1,
      title: "alpha",
    },
    {
      id: "course-b",
      lessonCount: 1,
      progressStatus: "completed" as const,
      sortOrder: 1,
      title: "alpha",
    },
    {
      id: "course-c",
      lessonCount: 2,
      progressStatus: "in_progress" as const,
      sortOrder: 2,
      title: "beta",
    },
  ]

  client.db.transaction((transaction) => {
    transaction
      .insert(authUsers)
      .values({
        createdAt: now,
        email: "cursor-user@example.com",
        emailVerified: true,
        id: "cursor-user",
        image: null,
        name: "Cursor 학습자",
        updatedAt: now,
      })
      .run()

    for (const fixture of fixtures) {
      const curriculumVersionId = `${fixture.id}-v1`
      const unitId = `${fixture.id}-unit`
      const lessonRows = Array.from(
        { length: fixture.lessonCount },
        (_, index) => ({
          category: "pagination",
          curriculumVersionId,
          description: `${fixture.id} lesson ${index + 1}`,
          estimatedMinutes: 5,
          id: `${fixture.id}-lesson-${index + 1}`,
          sortOrder: index + 1,
          status: "active" as const,
          summaryJson: "[]",
          title: `${fixture.id} lesson ${index + 1}`,
          unitId,
        })
      )

      transaction
        .insert(courses)
        .values({
          createdAt: now,
          id: fixture.id,
          publishedCurriculumVersionId: null,
          sortOrder: fixture.sortOrder,
          status: "active",
        })
        .run()
      transaction
        .insert(courseCurriculumVersions)
        .values({
          category: "pagination",
          courseId: fixture.id,
          createdAt: now,
          description: `${fixture.id} description`,
          editVersion: 0,
          id: curriculumVersionId,
          publishedAt: null,
          revision: 1,
          status: "draft",
          title: fixture.title,
          updatedAt: now,
          visualKey: "basic-sentence-writing",
        })
        .run()
      transaction
        .insert(courseUnitVersions)
        .values({
          curriculumVersionId,
          id: unitId,
          sortOrder: 1,
          status: "active",
          title: `${fixture.id} unit`,
        })
        .run()
      transaction.insert(lessonVersions).values(lessonRows).run()
      transaction
        .insert(lessonStepVersions)
        .values(
          lessonRows.map((lesson) => ({
            contentJson: JSON.stringify({
              body: `${lesson.id} body`,
              guide: "읽어 보세요.",
              title: `${lesson.id} step`,
              type: "reading",
            }),
            curriculumVersionId,
            id: `${lesson.id}-step-1`,
            lessonId: lesson.id,
            sortOrder: 1,
            status: "active" as const,
            type: "READING",
          }))
        )
        .run()
      transaction
        .update(courseCurriculumVersions)
        .set({ publishedAt: now, status: "published", updatedAt: now })
        .where(eq(courseCurriculumVersions.id, curriculumVersionId))
        .run()
      transaction
        .update(courses)
        .set({ publishedCurriculumVersionId: curriculumVersionId })
        .where(eq(courses.id, fixture.id))
        .run()
      transaction
        .insert(learnerCourseProgress)
        .values({
          completedAt: fixture.progressStatus === "completed" ? now : null,
          courseId: fixture.id,
          curriculumVersionId,
          lastActivityAt: fixture.id === "course-c" ? olderActivityAt : now,
          startedAt: olderActivityAt,
          status: fixture.progressStatus,
          updatedAt: now,
          userId: "cursor-user",
        })
        .run()
    }
  })
}

function seedLearnerCourseProgress(client: WritingAppDatabaseClient): void {
  const now = new Date("2026-07-17T00:00:00.000Z")
  const course = client.db
    .select({ curriculumVersionId: courses.publishedCurriculumVersionId })
    .from(courses)
    .where(eq(courses.id, "c1"))
    .get()
  const curriculumVersionId = course?.curriculumVersionId

  if (curriculumVersionId === undefined || curriculumVersionId === null) {
    throw new Error("발행된 query characterization 코스를 찾을 수 없습니다.")
  }

  client.db.transaction((transaction) => {
    transaction
      .insert(authUsers)
      .values({
        createdAt: now,
        email: "query-characterization@example.com",
        emailVerified: true,
        id: "user-1",
        image: null,
        name: "조회 기준 학습자",
        updatedAt: now,
      })
      .run()
    transaction
      .insert(learnerCourseProgress)
      .values({
        courseId: "c1",
        curriculumVersionId,
        lastActivityAt: now,
        startedAt: now,
        status: "in_progress",
        updatedAt: now,
        userId: "user-1",
      })
      .run()
  })
}

function seedMultiUnitCourse(client: WritingAppDatabaseClient): void {
  const now = new Date("2026-07-17T00:00:00.000Z")
  const courseId = "course-order"
  const curriculumVersionId = "curriculum:course-order:1"

  client.db.transaction((transaction) => {
    transaction
      .insert(courses)
      .values({
        createdAt: now,
        id: courseId,
        publishedCurriculumVersionId: null,
        sortOrder: 1,
        status: "active",
      })
      .run()
    transaction
      .insert(courseCurriculumVersions)
      .values({
        category: "테스트",
        courseId,
        createdAt: now,
        description: "다중 유닛 정렬 테스트",
        editVersion: 0,
        id: curriculumVersionId,
        publishedAt: null,
        revision: 1,
        status: "draft",
        title: "정렬 테스트 코스",
        updatedAt: now,
        visualKey: "basic-sentence-writing",
      })
      .run()
    transaction
      .insert(courseUnitVersions)
      .values([
        {
          curriculumVersionId,
          id: "first-unit",
          sortOrder: 1,
          status: "active",
          title: "첫 번째 유닛",
        },
        {
          curriculumVersionId,
          id: "second-unit",
          sortOrder: 2,
          status: "active",
          title: "두 번째 유닛",
        },
      ])
      .run()
    transaction
      .insert(lessonVersions)
      .values([
        {
          category: "테스트",
          curriculumVersionId,
          description: "첫 번째 레슨",
          estimatedMinutes: 5,
          id: "z-first-unit-lesson",
          sortOrder: 1,
          status: "active",
          summaryJson: "[]",
          title: "첫 번째 레슨",
          unitId: "first-unit",
        },
        {
          category: "테스트",
          curriculumVersionId,
          description: "두 번째 레슨",
          estimatedMinutes: 5,
          id: "a-second-unit-lesson",
          sortOrder: 1,
          status: "active",
          summaryJson: "[]",
          title: "두 번째 레슨",
          unitId: "second-unit",
        },
      ])
      .run()
    transaction
      .insert(lessonStepVersions)
      .values([
        {
          contentJson: JSON.stringify({
            body: "첫 번째 레슨 본문",
            guide: "읽어 보세요.",
            title: "첫 번째 스텝",
            type: "reading",
          }),
          curriculumVersionId,
          id: "first-unit-step",
          lessonId: "z-first-unit-lesson",
          sortOrder: 1,
          status: "active",
          type: "READING",
        },
        {
          contentJson: JSON.stringify({
            body: "두 번째 레슨 본문",
            guide: "읽어 보세요.",
            title: "두 번째 스텝",
            type: "reading",
          }),
          curriculumVersionId,
          id: "second-unit-step",
          lessonId: "a-second-unit-lesson",
          sortOrder: 1,
          status: "active",
          type: "READING",
        },
      ])
      .run()
    transaction
      .update(courseCurriculumVersions)
      .set({ publishedAt: now, status: "published", updatedAt: now })
      .where(eq(courseCurriculumVersions.id, curriculumVersionId))
      .run()
    transaction
      .update(courses)
      .set({ publishedCurriculumVersionId: curriculumVersionId })
      .where(eq(courses.id, courseId))
      .run()
  })
}

function collectObjectKeys(value: unknown): readonly string[] {
  if (Array.isArray(value)) {
    return value.flatMap(collectObjectKeys)
  }
  if (typeof value !== "object" || value === null) {
    return []
  }

  return Object.entries(value).flatMap(([key, child]) => [
    key,
    ...collectObjectKeys(child),
  ])
}
