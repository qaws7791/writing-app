import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { sqliteTable, text } from "drizzle-orm/sqlite-core"
import { describe, expect, it, vi } from "vitest"

import { createSqliteDatabase } from "#db/sqlite-database"

const healthRecords = sqliteTable("health_records", {
  id: text("id").primaryKey(),
})
const schema = { healthRecords }

describe("SQLite database lifecycle", () => {
  it("Drizzle prepared statement를 finalize한 뒤 파일을 즉시 제거할 수 있다", () => {
    const directory = mkdtempSync(join(tmpdir(), "writing-app-sqlite-close-"))
    const client = createSqliteDatabase({
      filename: join(directory, "database.sqlite"),
      schema,
    })

    try {
      client.sqlite.exec(
        "CREATE TABLE health_records (id TEXT PRIMARY KEY NOT NULL)"
      )
      const preparedQuery = client.db.select().from(healthRecords).prepare()
      const nativeQuery = client.sqlite.query(
        "SELECT COUNT(*) AS count FROM health_records"
      )

      expect(preparedQuery.all()).toEqual([])
      expect(nativeQuery.get()).toEqual({ count: 0 })
      expect(
        client.sqlite.query("SELECT COUNT(*) AS count FROM health_records")
      ).toBe(nativeQuery)

      client.close()

      expect(() => client.close()).not.toThrow()
      expect(() => preparedQuery.all()).toThrow()
      expect(() => nativeQuery.get()).toThrow()
    } finally {
      rmSync(directory, { force: true, recursive: true })
    }
  })

  it("statement finalize와 strict close가 함께 실패하면 모든 원인을 보존한다", () => {
    const client = createSqliteDatabase({
      filename: ":memory:",
      schema,
    })
    client.sqlite.exec(
      "CREATE TABLE health_records (id TEXT PRIMARY KEY NOT NULL)"
    )
    const preparedQuery = client.db.select().from(healthRecords).prepare()
    const prototypeProbe = client.sqlite.prepare("SELECT 1")
    const statementPrototype = Object.getPrototypeOf(prototypeProbe) as {
      finalize: () => void
    }
    prototypeProbe.finalize()
    const finalizeSpy = vi
      .spyOn(statementPrototype, "finalize")
      .mockImplementationOnce(() => {
        throw new Error("statement finalize failure")
      })

    try {
      expect(preparedQuery.all()).toEqual([])

      let closeError: unknown
      try {
        client.close()
      } catch (error) {
        closeError = error
      }

      expect(closeError).toBeInstanceOf(AggregateError)
      expect((closeError as AggregateError).errors).toHaveLength(2)
    } finally {
      finalizeSpy.mockRestore()
      client.close()
    }

    expect(() => client.close()).not.toThrow()
  })

  it("공개 native client로 생성한 prepared statement도 finalize한다", () => {
    const client = createSqliteDatabase({
      filename: ":memory:",
      schema,
    })
    const statement = client.sqlite.prepare("SELECT 1")

    expect(statement.get()).toEqual({ "1": 1 })

    expect(() => client.close()).not.toThrow()
    expect(() => client.close()).not.toThrow()
    expect(() => statement.get()).toThrow()
  })
})
