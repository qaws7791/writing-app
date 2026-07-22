import { mkdirSync, mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { Database } from "bun:sqlite"
import { describe, expect, it } from "vitest"

import { createWritingAppDatabase } from "#db/client"
import { inspectDatabaseResetTarget } from "#db/destructive-operation-guard"
import { authUsers } from "#db/schema"
import { seedDatabase } from "#db/seeds/seed"

describe("통합 DB seed 실행", () => {
  it("baseline과 공통 auth fixture만 만들고 module seed는 호출하지 않는다", async () => {
    const fixture = await createSeededDatabase("writing-app-seed-")

    try {
      const client = createWritingAppDatabase(fixture.databaseUrl)
      try {
        expect(
          client.sqlite
            .query<{ readonly count: number }, []>(
              "SELECT COUNT(*) AS count FROM courses"
            )
            .get()?.count
        ).toBe(0)
        expect(client.db.select().from(authUsers).all()).toMatchObject([
          {
            email: "learner@example.com",
            id: "user-1",
            name: "글쓰기 탐험가",
          },
        ])
      } finally {
        client.close()
      }
    } finally {
      removeTempDirectory(fixture.tempDirectory)
    }
  })

  it("production에서는 명시적 허용 조건 없이 seed를 실행하지 않는다", async () => {
    const tempDirectory = mkdtempSync(
      join(tmpdir(), "writing-app-production-seed-")
    )
    const databaseUrl = join(tempDirectory, "api.sqlite")

    try {
      await expect(
        seedDatabase({ databaseUrl, nodeEnv: "production" })
      ).rejects.toThrow(
        "저장소 data 디렉터리 밖의 DB 파일은 초기화할 수 없습니다."
      )
    } finally {
      rmSync(tempDirectory, { force: true, recursive: true })
    }
  })

  it("저장소 data 밖의 이전 DB는 허용 조건이 있어도 재생성하지 않는다", async () => {
    const tempDirectory = mkdtempSync(
      join(tmpdir(), "writing-app-legacy-seed-")
    )
    const databaseUrl = join(tempDirectory, "api.sqlite")
    const legacyClient = new Database(databaseUrl)

    try {
      insertLegacyCourse(legacyClient)
      legacyClient.close()
      await expect(
        seedDatabase({
          allowDatabaseReset: true,
          databaseUrl,
          forceDatabaseReset: true,
        })
      ).rejects.toThrow(
        "저장소 data 디렉터리 밖의 DB 파일은 초기화할 수 없습니다."
      )
    } finally {
      legacyClient.close(false)
      rmSync(tempDirectory, { force: true, recursive: true })
    }
  })

  it("명시적 허용 조건이 없으면 이전 DB 파일을 삭제하지 않는다", async () => {
    const databaseUrl = createRepositoryDataDatabasePath("seed-guard")
    const legacyClient = new Database(databaseUrl)

    try {
      insertLegacyCourse(legacyClient)
      legacyClient.close()
      await expect(seedDatabase(databaseUrl)).rejects.toThrow(
        "DB 파일 재생성은 ALLOW_DATABASE_RESET=true와 --force가 필요합니다."
      )
      const existingClient = new Database(databaseUrl, { readonly: true })
      try {
        expect(
          existingClient
            .query<{ readonly id: string }, []>("SELECT id FROM courses")
            .all()
        ).toEqual([{ id: "legacy-course" }])
      } finally {
        existingClient.close()
      }
    } finally {
      legacyClient.close(false)
      removeDatabaseFiles(databaseUrl)
    }
  })

  it("저장소 data 하위 DB는 명시적 허용 조건으로 baseline을 재생성한다", async () => {
    const databaseUrl = createRepositoryDataDatabasePath("seed-reset")
    const legacyClient = new Database(databaseUrl)
    let backupDirectory: string | undefined

    try {
      insertLegacyCourse(legacyClient)
      legacyClient.close()
      const resetTarget = inspectDatabaseResetTarget(databaseUrl)
      if (resetTarget === null)
        throw new Error("파일 DB reset 대상이 필요합니다.")
      backupDirectory = resetTarget.backupDirectory

      await seedDatabase({
        allowDatabaseReset: true,
        databaseUrl,
        forceDatabaseReset: true,
      })
      const client = createWritingAppDatabase(databaseUrl)
      try {
        const courseColumns = client.sqlite
          .query<{ readonly name: string }, []>("PRAGMA table_info(courses)")
          .all()
          .map((row) => row.name)
        expect(courseColumns).toContain("published_curriculum_version_id")
        expect(
          client.sqlite
            .query<{ readonly count: number }, []>(
              "SELECT COUNT(*) AS count FROM courses"
            )
            .get()?.count
        ).toBe(0)
      } finally {
        client.close()
      }
    } finally {
      legacyClient.close(false)
      removeDatabaseFiles(databaseUrl)
      if (backupDirectory !== undefined) {
        rmSync(backupDirectory, { force: true, recursive: true })
      }
    }
  })
})

async function createSeededDatabase(prefix: string) {
  const tempDirectory = mkdtempSync(join(tmpdir(), prefix))
  const databaseUrl = join(tempDirectory, "api.sqlite")
  await seedDatabase(databaseUrl)
  return { databaseUrl, tempDirectory }
}

function createRepositoryDataDatabasePath(prefix: string): string {
  const directory = fileURLToPath(
    new URL("../../../../../data", import.meta.url)
  )
  mkdirSync(directory, { recursive: true })
  return join(directory, `${prefix}-${crypto.randomUUID()}.sqlite`)
}

function insertLegacyCourse(database: Database): void {
  database.exec(
    "CREATE TABLE courses (id TEXT PRIMARY KEY NOT NULL); INSERT INTO courses (id) VALUES ('legacy-course');"
  )
}

function removeDatabaseFiles(databaseUrl: string): void {
  Bun.gc(true)
  for (const path of [
    databaseUrl,
    `${databaseUrl}-shm`,
    `${databaseUrl}-wal`,
  ]) {
    rmSync(path, { force: true, maxRetries: 3, retryDelay: 100 })
  }
}

function removeTempDirectory(tempDirectory: string): void {
  Bun.gc(true)
  rmSync(tempDirectory, {
    force: true,
    maxRetries: 3,
    recursive: true,
    retryDelay: 100,
  })
}
