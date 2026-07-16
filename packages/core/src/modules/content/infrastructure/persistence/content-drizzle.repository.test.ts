import { describe, expect, it } from "vitest"
import { eq } from "drizzle-orm"
import {
  courseIdSchema,
  lessonIdSchema,
} from "#core/modules/content/domain/content.ids"

import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"
import { createDrizzleContentRepository } from "#core/modules/content/infrastructure/persistence/content-drizzle.repository"
import {
  courseCurriculumVersions,
  courseUnitVersions,
  courses,
  lessonStepVersions,
  lessonVersions,
} from "@workspace/db/schema"
import {
  createContentSeedRows,
  readContentSeedData,
} from "@workspace/db/seeds/seed-content"
import { upsertContentSeedRows } from "@workspace/db/seeds/seed"
import type { WritingAppDatabaseClient } from "@workspace/db/client"

describe("콘텐츠 baseline repository", () => {
  it("기준 콘텐츠 seed row를 baseline schema에 삽입한다", async () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      await seedContentRows(client)

      expect(client.db.select().from(courses).all()).toHaveLength(5)
      expect(
        client.db.select().from(courseCurriculumVersions).all()
      ).toHaveLength(10)
      expect(client.db.select().from(courseUnitVersions).all()).toHaveLength(30)
      expect(client.db.select().from(lessonVersions).all()).toHaveLength(88)
      expect(client.db.select().from(lessonStepVersions).all()).toHaveLength(
        272
      )
    } finally {
      client.close()
    }
  })

  it("학습자 코스 목록에서 archived 코스를 제외하고 lesson metadata를 반환한다", async () => {
    const client = createInMemoryWritingAppDatabase()

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
    const client = createInMemoryWritingAppDatabase()

    try {
      await seedContentRows(client, {
        archivedLessonIds: ["l9"],
        archivedUnitIds: ["u1"],
      })

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
    const client = createInMemoryWritingAppDatabase()

    try {
      await seedContentRows(client, {
        archivedLessonIds: ["l9"],
        archivedStepIds: ["l8-s1"],
      })

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

  it("guide가 없는 쓰기 스텝이 포함된 레슨을 조회한다", async () => {
    const client = createInMemoryWritingAppDatabase()

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

async function seedContentRows(
  client: WritingAppDatabaseClient,
  archived: {
    readonly archivedLessonIds?: readonly string[]
    readonly archivedStepIds?: readonly string[]
    readonly archivedUnitIds?: readonly string[]
  } = {}
): Promise<void> {
  runBaselineMigration(client.sqlite)

  const sourceRows = createContentSeedRows(await readContentSeedData())
  const rows = {
    ...sourceRows,
    lessons: sourceRows.lessons.map((lesson) => ({
      ...lesson,
      status: archived.archivedLessonIds?.includes(lesson.id)
        ? ("archived" as const)
        : lesson.status,
    })),
    steps: sourceRows.steps.map((step) => ({
      ...step,
      status: archived.archivedStepIds?.includes(step.id)
        ? ("archived" as const)
        : step.status,
    })),
    units: sourceRows.units.map((unit) => ({
      ...unit,
      status: archived.archivedUnitIds?.includes(unit.id)
        ? ("archived" as const)
        : unit.status,
    })),
  }

  client.db.transaction((transaction) => {
    upsertContentSeedRows(transaction, rows)
  })
}
