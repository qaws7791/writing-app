import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

import { eq } from "drizzle-orm"
import { contentStatuses } from "@workspace/core/status"

import { createKwepDatabase } from "@/client"
import { archiveContentRowsOutsideSeed } from "@/content/content-archive-policy"
import { runBaselineMigration } from "@/migrations/migrate"
import type { ContentSeedRows } from "@/seeds/seed-content"
import { courseUnits, courses, lessonSteps, lessons } from "@/schema"

describe("콘텐츠 보관 정책", () => {
  it("seed 밖 활성 콘텐츠만 한 번에 보관하고 변경 수를 반환한다", () => {
    const client = createKwepDatabase(":memory:")

    try {
      runBaselineMigration(client.sqlite)
      seedContentRows(client.db)

      const archived = client.db.transaction((transaction) =>
        archiveContentRowsOutsideSeed(transaction, activeSeedRows)
      )

      expect(archived).toBe(8)
      expect(readStatuses(client.db, "seed")).toEqual([
        contentStatuses.active,
        contentStatuses.active,
        contentStatuses.active,
        contentStatuses.active,
      ])
      expect(readStatuses(client.db, "outside-active-one")).toEqual([
        contentStatuses.archived,
        contentStatuses.archived,
        contentStatuses.archived,
        contentStatuses.archived,
      ])
      expect(readStatuses(client.db, "outside-active-two")).toEqual([
        contentStatuses.archived,
        contentStatuses.archived,
        contentStatuses.archived,
        contentStatuses.archived,
      ])
      expect(readStatuses(client.db, "outside-archived")).toEqual([
        contentStatuses.archived,
        contentStatuses.archived,
        contentStatuses.archived,
        contentStatuses.archived,
      ])
    } finally {
      client.close()
    }
  })

  it("이미 보관된 콘텐츠는 변경 수에 포함하지 않는다", () => {
    const client = createKwepDatabase(":memory:")

    try {
      runBaselineMigration(client.sqlite)
      seedContentRows(client.db)

      client.db.transaction((transaction) =>
        archiveContentRowsOutsideSeed(transaction, activeSeedRows)
      )
      const archivedAgain = client.db.transaction((transaction) =>
        archiveContentRowsOutsideSeed(transaction, activeSeedRows)
      )

      expect(archivedAgain).toBe(0)
    } finally {
      client.close()
    }
  })

  it("seed ID가 비어 있으면 활성 콘텐츠 전체를 보관한다", () => {
    const client = createKwepDatabase(":memory:")

    try {
      runBaselineMigration(client.sqlite)
      seedContentRows(client.db)

      const archived = client.db.transaction((transaction) =>
        archiveContentRowsOutsideSeed(transaction, emptySeedRows)
      )

      expect(archived).toBe(12)
      expect(readStatuses(client.db, "seed")).toEqual([
        contentStatuses.archived,
        contentStatuses.archived,
        contentStatuses.archived,
        contentStatuses.archived,
      ])
      expect(readStatuses(client.db, "outside-active-one")).toEqual([
        contentStatuses.archived,
        contentStatuses.archived,
        contentStatuses.archived,
        contentStatuses.archived,
      ])
      expect(readStatuses(client.db, "outside-active-two")).toEqual([
        contentStatuses.archived,
        contentStatuses.archived,
        contentStatuses.archived,
        contentStatuses.archived,
      ])
    } finally {
      client.close()
    }
  })

  it("전체 테이블을 읽은 뒤 행 단위 update를 반복하지 않는다", () => {
    const source = readFileSync(
      fileURLToPath(new URL("content-archive-policy.ts", import.meta.url)),
      "utf8"
    )

    expect(source).not.toMatch(/\.select\(\)[\s\S]*?\.all\(\)/)
    expect(source).not.toMatch(/for\s*\([\s\S]*?\.update\(/)
  })
})

const seedCourseRow: ContentSeedRows["courses"][number] = {
  category: "기초",
  curriculumRevision: 0,
  description: "seed course",
  id: "seed-course",
  sortOrder: 1,
  status: contentStatuses.active,
  title: "Seed Course",
}

const seedUnitRow: ContentSeedRows["units"][number] = {
  courseId: "seed-course",
  id: "seed-unit",
  sortOrder: 1,
  status: contentStatuses.active,
  title: "Seed Unit",
}

const seedLessonRow: ContentSeedRows["lessons"][number] = {
  category: "기초",
  courseId: "seed-course",
  description: "seed lesson",
  estimatedMinutes: 5,
  id: "seed-lesson",
  sortOrder: 1,
  status: contentStatuses.active,
  summaryJson: "[]",
  title: "Seed Lesson",
  unitId: "seed-unit",
}

const seedStepRow: ContentSeedRows["steps"][number] = {
  contentJson: "{}",
  id: "seed-step",
  lessonId: "seed-lesson",
  sortOrder: 1,
  status: contentStatuses.active,
  type: "READING",
}

const activeSeedRows: ContentSeedRows = {
  courses: [seedCourseRow],
  lessons: [seedLessonRow],
  steps: [seedStepRow],
  units: [seedUnitRow],
}

const emptySeedRows: ContentSeedRows = {
  courses: [],
  lessons: [],
  steps: [],
  units: [],
}

function seedContentRows(
  db: ReturnType<typeof createKwepDatabase>["db"]
): void {
  db.insert(courses)
    .values([
      seedCourseRow,
      createCourseRow("outside-active-one", contentStatuses.active),
      createCourseRow("outside-active-two", contentStatuses.active),
      createCourseRow("outside-archived", contentStatuses.archived),
    ])
    .run()

  db.insert(courseUnits)
    .values([
      seedUnitRow,
      createUnitRow("outside-active-one", contentStatuses.active),
      createUnitRow("outside-active-two", contentStatuses.active),
      createUnitRow("outside-archived", contentStatuses.archived),
    ])
    .run()

  db.insert(lessons)
    .values([
      seedLessonRow,
      createLessonRow("outside-active-one", contentStatuses.active),
      createLessonRow("outside-active-two", contentStatuses.active),
      createLessonRow("outside-archived", contentStatuses.archived),
    ])
    .run()

  db.insert(lessonSteps)
    .values([
      seedStepRow,
      createStepRow("outside-active-one", contentStatuses.active),
      createStepRow("outside-active-two", contentStatuses.active),
      createStepRow("outside-archived", contentStatuses.archived),
    ])
    .run()
}

function createCourseRow(
  namespace: string,
  status: typeof contentStatuses.active | typeof contentStatuses.archived
): typeof courses.$inferInsert {
  return {
    category: "기초",
    curriculumRevision: 0,
    description: namespace,
    id: `${namespace}-course`,
    sortOrder: 1,
    status,
    title: namespace,
  }
}

function createUnitRow(
  namespace: string,
  status: typeof contentStatuses.active | typeof contentStatuses.archived
): typeof courseUnits.$inferInsert {
  return {
    courseId: `${namespace}-course`,
    id: `${namespace}-unit`,
    sortOrder: 1,
    status,
    title: namespace,
  }
}

function createLessonRow(
  namespace: string,
  status: typeof contentStatuses.active | typeof contentStatuses.archived
): typeof lessons.$inferInsert {
  return {
    category: "기초",
    courseId: `${namespace}-course`,
    description: namespace,
    estimatedMinutes: 5,
    id: `${namespace}-lesson`,
    sortOrder: 1,
    status,
    summaryJson: "[]",
    title: namespace,
    unitId: `${namespace}-unit`,
  }
}

function createStepRow(
  namespace: string,
  status: typeof contentStatuses.active | typeof contentStatuses.archived
): typeof lessonSteps.$inferInsert {
  return {
    contentJson: "{}",
    id: `${namespace}-step`,
    lessonId: `${namespace}-lesson`,
    sortOrder: 1,
    status,
    type: "READING",
  }
}

function readStatuses(
  db: ReturnType<typeof createKwepDatabase>["db"],
  namespace: string
): readonly string[] {
  const courseId = `${namespace}-course`
  const unitId = `${namespace}-unit`
  const lessonId = `${namespace}-lesson`
  const stepId = `${namespace}-step`

  return [
    db.select().from(courses).where(eq(courses.id, courseId)).get()?.status ??
      "missing",
    db.select().from(courseUnits).where(eq(courseUnits.id, unitId)).get()
      ?.status ?? "missing",
    db.select().from(lessons).where(eq(lessons.id, lessonId)).get()?.status ??
      "missing",
    db.select().from(lessonSteps).where(eq(lessonSteps.id, stepId)).get()
      ?.status ?? "missing",
  ]
}
