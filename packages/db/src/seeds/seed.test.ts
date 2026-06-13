import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import { createKwepDatabase } from "@/client"
import { courses, lessons, lessonSteps } from "@/schema"
import { seedDatabase } from "@/seeds/seed"

describe("개발 DB seed 실행", () => {
  it("baseline migration을 적용하고 Kwep 콘텐츠를 삽입한다", async () => {
    const tempDirectory = mkdtempSync(join(tmpdir(), "kwep-seed-"))
    const databaseUrl = join(tempDirectory, "api.sqlite")

    try {
      await seedDatabase(databaseUrl)

      const client = createKwepDatabase(databaseUrl)

      try {
        expect(client.db.select().from(courses).all()).toHaveLength(5)
        expect(client.db.select().from(lessons).all()).toHaveLength(44)
        expect(client.db.select().from(lessonSteps).all()).toHaveLength(136)
      } finally {
        client.close()
      }
    } finally {
      rmSync(tempDirectory, { force: true, recursive: true })
    }
  })
})
