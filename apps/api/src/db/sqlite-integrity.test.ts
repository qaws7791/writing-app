import { Database } from "bun:sqlite"
import { describe, expect, it } from "vitest"

import { inspectSqliteIntegrity } from "@/db/sqlite-integrity"

describe("복구 SQLite 구조 검사", () => {
  it("integrity와 foreign key가 모두 정상인 DB만 허용한다", () => {
    using sqlite = new Database(":memory:")
    sqlite.exec(`
      PRAGMA foreign_keys = ON;
      CREATE TABLE parent (id TEXT PRIMARY KEY);
      CREATE TABLE child (
        id TEXT PRIMARY KEY,
        parent_id TEXT NOT NULL REFERENCES parent(id)
      );
      INSERT INTO parent (id) VALUES ('parent-1');
      INSERT INTO child (id, parent_id) VALUES ('child-1', 'parent-1');
    `)

    expect(inspectSqliteIntegrity(sqlite)).toEqual({
      foreignKeyViolationCount: 0,
      integrity: "ok",
      kind: "sqlite-integrity-result",
      status: "ok",
    })
  })

  it("foreign key 위반이 있는 복구 DB를 migration 전에 차단한다", () => {
    using sqlite = new Database(":memory:")
    sqlite.exec(`
      PRAGMA foreign_keys = OFF;
      CREATE TABLE parent (id TEXT PRIMARY KEY);
      CREATE TABLE child (
        id TEXT PRIMARY KEY,
        parent_id TEXT NOT NULL REFERENCES parent(id)
      );
      INSERT INTO child (id, parent_id) VALUES ('child-1', 'missing-parent');
      PRAGMA foreign_keys = ON;
    `)

    expect(inspectSqliteIntegrity(sqlite)).toEqual({
      foreignKeyViolationCount: 1,
      integrity: "ok",
      kind: "sqlite-integrity-result",
      status: "blocked",
    })
  })
})
