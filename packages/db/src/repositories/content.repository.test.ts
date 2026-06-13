import { describe, expect, it } from "vitest"

import { createInMemoryKwepDatabase } from "@/client"
import { runBaselineMigration } from "@/migrations/migrate"
import { courses, courseUnits, lessons, lessonSteps } from "@/schema"
import {
  createContentSeedRows,
  type KwepCourseSeed,
} from "@/seeds/seed-content"

async function readSeedData(): Promise<readonly KwepCourseSeed[]> {
  const seedUrl = new URL("../seeds/content-seed-data.json", import.meta.url)

  return (await Bun.file(seedUrl).json()) as readonly KwepCourseSeed[]
}

describe("콘텐츠 baseline repository", () => {
  it("Kwep seed row를 baseline schema에 삽입한다", async () => {
    const client = createInMemoryKwepDatabase()

    try {
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

      expect(client.db.select().from(courses).all()).toHaveLength(5)
      expect(client.db.select().from(courseUnits).all()).toHaveLength(15)
      expect(client.db.select().from(lessons).all()).toHaveLength(44)
      expect(client.db.select().from(lessonSteps).all()).toHaveLength(136)
    } finally {
      client.close()
    }
  })
})
