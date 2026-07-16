import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

import { eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"

import { createWritingAppDatabase } from "@workspace/db/client"
import { archiveContentRowsOutsideSeed } from "@workspace/db/content/content-archive-policy"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"
import { persistedContentStatuses } from "@workspace/db/persisted-values"
import type { ContentSeedRows } from "@workspace/db/seeds/seed-content"
import { courses } from "@workspace/db/schema"

describe("콘텐츠 보관 정책", () => {
  it("seed 밖 활성 코스만 보관하고 버전 콘텐츠는 건드리지 않는다", () => {
    const client = createWritingAppDatabase(":memory:")

    try {
      runBaselineMigration(client.sqlite)
      seedCourses(client)

      const archived = client.db.transaction((transaction) =>
        archiveContentRowsOutsideSeed(transaction, activeSeedRows)
      )

      expect(archived).toBe(2)
      expect(readCourseStatus(client, "seed-course")).toBe(
        persistedContentStatuses.active
      )
      expect(readCourseStatus(client, "outside-active-one-course")).toBe(
        persistedContentStatuses.archived
      )
      expect(readCourseStatus(client, "outside-active-two-course")).toBe(
        persistedContentStatuses.archived
      )
      expect(readCourseStatus(client, "outside-archived-course")).toBe(
        persistedContentStatuses.archived
      )
    } finally {
      client.close()
    }
  })

  it("이미 보관된 코스는 변경 수에 포함하지 않는다", () => {
    const client = createWritingAppDatabase(":memory:")

    try {
      runBaselineMigration(client.sqlite)
      seedCourses(client)
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

  it("seed ID가 비어 있으면 활성 코스 전체를 보관한다", () => {
    const client = createWritingAppDatabase(":memory:")

    try {
      runBaselineMigration(client.sqlite)
      seedCourses(client)

      const archived = client.db.transaction((transaction) =>
        archiveContentRowsOutsideSeed(transaction, emptySeedRows)
      )

      expect(archived).toBe(3)
      expect(
        client.db
          .select()
          .from(courses)
          .all()
          .map((course) => course.status)
      ).toEqual([
        persistedContentStatuses.archived,
        persistedContentStatuses.archived,
        persistedContentStatuses.archived,
        persistedContentStatuses.archived,
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
  description: "seed course",
  id: "seed-course",
  sortOrder: 1,
  status: persistedContentStatuses.active,
  title: "Seed Course",
  visualKey: "basic-sentence-writing",
}

const activeSeedRows: ContentSeedRows = {
  courses: [seedCourseRow],
  lessons: [],
  steps: [],
  units: [],
}

const emptySeedRows: ContentSeedRows = {
  courses: [],
  lessons: [],
  steps: [],
  units: [],
}

function seedCourses(
  client: ReturnType<typeof createWritingAppDatabase>
): void {
  const createdAt = new Date("2026-07-17T00:00:00.000Z")

  client.db
    .insert(courses)
    .values([
      {
        createdAt,
        id: seedCourseRow.id,
        sortOrder: seedCourseRow.sortOrder,
        status: seedCourseRow.status,
      },
      createCourseRow("outside-active-one", persistedContentStatuses.active),
      createCourseRow("outside-active-two", persistedContentStatuses.active),
      createCourseRow("outside-archived", persistedContentStatuses.archived),
    ])
    .run()
}

function createCourseRow(
  namespace: string,
  status:
    | typeof persistedContentStatuses.active
    | typeof persistedContentStatuses.archived
): typeof courses.$inferInsert {
  return {
    createdAt: new Date("2026-07-17T00:00:00.000Z"),
    id: `${namespace}-course`,
    sortOrder: 1,
    status,
  }
}

function readCourseStatus(
  client: ReturnType<typeof createWritingAppDatabase>,
  courseId: string
): string {
  return (
    client.db.select().from(courses).where(eq(courses.id, courseId)).get()
      ?.status ?? "missing"
  )
}
