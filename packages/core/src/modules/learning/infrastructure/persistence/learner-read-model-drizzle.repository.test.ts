import { describe, expect, it } from "vitest"
import { eq } from "drizzle-orm"

import {
  createInMemoryWritingAppDatabase,
  type WritingAppDatabaseClient,
} from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"
import { courses } from "@workspace/db/schema"
import {
  createContentSeedRows,
  readContentSeedData,
} from "@workspace/db/seeds/seed-content"
import { upsertContentSeedRows } from "@workspace/db/seeds/seed"

import { createDrizzleLearnerReadModelRepository } from "#core/modules/learning/infrastructure/persistence/learner-read-model-drizzle.repository"

const presentationSecret = "test-presentation-secret-with-32-bytes"

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

  it("lesson 공개 JSON은 solution field를 포함하지 않고 잠금 정책을 적용한다", async () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      await seedContent(client)
      const repository = createRepository(client)
      const firstLesson = await repository.findLesson({
        lessonId: "l1",
        userId: "user-1",
      })
      const lockedLesson = await repository.findLesson({
        lessonId: "l2",
        userId: "user-1",
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
})

function createRepository(client: WritingAppDatabaseClient) {
  return createDrizzleLearnerReadModelRepository(client.db, {
    presentationSecret,
  })
}

async function seedContent(client: WritingAppDatabaseClient): Promise<void> {
  runBaselineMigration(client.sqlite)
  const rows = createContentSeedRows(await readContentSeedData())

  client.db.transaction((transaction) => {
    upsertContentSeedRows(transaction, rows)
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
