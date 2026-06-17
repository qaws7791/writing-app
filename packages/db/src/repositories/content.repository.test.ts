import { describe, expect, it } from "vitest"
import { eq } from "drizzle-orm"
import { courseIdSchema, lessonIdSchema } from "@workspace/core/content"

import { createInMemoryKwepDatabase } from "@/client"
import { runBaselineMigration } from "@/migrations/migrate"
import { createDrizzleContentRepository } from "@/repositories/content.repository"
import { courses, courseUnits, lessons, lessonSteps } from "@/schema"
import {
  createContentSeedRows,
  type KwepCourseSeed,
} from "@/seeds/seed-content"
import type { KwepDatabaseClient } from "@/client"

async function readSeedData(): Promise<readonly KwepCourseSeed[]> {
  const seedUrl = new URL("../seeds/content-seed-data.json", import.meta.url)

  return (await Bun.file(seedUrl).json()) as readonly KwepCourseSeed[]
}

describe("콘텐츠 baseline repository", () => {
  it("Kwep seed row를 baseline schema에 삽입한다", async () => {
    const client = createInMemoryKwepDatabase()

    try {
      await seedContentRows(client)

      expect(client.db.select().from(courses).all()).toHaveLength(5)
      expect(client.db.select().from(courseUnits).all()).toHaveLength(15)
      expect(client.db.select().from(lessons).all()).toHaveLength(44)
      expect(client.db.select().from(lessonSteps).all()).toHaveLength(136)
    } finally {
      client.close()
    }
  })

  it("학습자 코스 목록에서 archived 코스를 제외하고 lesson metadata를 반환한다", async () => {
    const client = createInMemoryKwepDatabase()

    try {
      await seedContentRows(client)
      client.db
        .update(courses)
        .set({ status: "archived" })
        .where(eq(courses.id, "c2"))
        .run()

      const repository = createDrizzleContentRepository(client.db)
      const courseList = await repository.listCourses()

      expect(courseList).toHaveLength(4)
      expect(courseList.map((course) => course.id)).not.toContain("c2")
      expect(courseList[0]).toMatchObject({
        id: "c1",
        lessonCount: 10,
        status: "active",
        visualKey: "basic-sentence-writing",
      })
    } finally {
      client.close()
    }
  })

  it("코스 상세에서 archived 하위 콘텐츠를 제외한다", async () => {
    const client = createInMemoryKwepDatabase()

    try {
      await seedContentRows(client)
      client.db
        .update(courseUnits)
        .set({ status: "archived" })
        .where(eq(courseUnits.id, "u1"))
        .run()
      client.db
        .update(lessons)
        .set({ status: "archived" })
        .where(eq(lessons.id, "l9"))
        .run()

      const repository = createDrizzleContentRepository(client.db)
      const courseDetail = await repository.findCourseDetail(
        courseIdSchema.parse("c1")
      )

      expect(courseDetail?.units.map((unit) => unit.id)).toEqual(["u2", "u3"])
      expect(
        courseDetail?.units.flatMap((unit) =>
          unit.lessons.map((lesson) => lesson.id)
        )
      ).not.toContain("l9")
    } finally {
      client.close()
    }
  })

  it("레슨 조회에서 archived 레슨과 스텝을 제외한다", async () => {
    const client = createInMemoryKwepDatabase()

    try {
      await seedContentRows(client)
      client.db
        .update(lessons)
        .set({ status: "archived" })
        .where(eq(lessons.id, "l9"))
        .run()
      client.db
        .update(lessonSteps)
        .set({ status: "archived" })
        .where(eq(lessonSteps.id, "l8-s1"))
        .run()

      const repository = createDrizzleContentRepository(client.db)

      await expect(
        repository.findLesson(lessonIdSchema.parse("l9"))
      ).resolves.toBeNull()

      const lesson = await repository.findLesson(lessonIdSchema.parse("l8"))

      expect(lesson?.steps.map((step) => step.id)).not.toContain("l8-s1")
    } finally {
      client.close()
    }
  })

  it("guide가 없는 Kwep write 스텝이 포함된 레슨을 조회한다", async () => {
    const client = createInMemoryKwepDatabase()

    try {
      await seedContentRows(client)

      const repository = createDrizzleContentRepository(client.db)
      const lesson = await repository.findLesson(lessonIdSchema.parse("l6"))

      expect(lesson?.title).toBe("주장과 근거")
      expect(lesson?.steps.map((step) => step.type)).toContain("WRITE")
      expect(lesson?.steps).toHaveLength(7)
    } finally {
      client.close()
    }
  })
})

async function seedContentRows(client: KwepDatabaseClient): Promise<void> {
  runBaselineMigration(client.sqlite)

  const rows = createContentSeedRows(await readSeedData())

  client.db
    .insert(courses)
    .values([...rows.courses])
    .run()
  client.db
    .insert(courseUnits)
    .values([...rows.units])
    .run()
  client.db
    .insert(lessons)
    .values([...rows.lessons])
    .run()
  client.db
    .insert(lessonSteps)
    .values([...rows.steps])
    .run()
}
