import type { Database } from "bun:sqlite"

export type SqliteIntegrityResult = Readonly<{
  foreignKeyViolationCount: number
  integrity: "failed" | "ok"
  kind: "sqlite-integrity-result"
  status: "blocked" | "ok"
}>

export function inspectSqliteIntegrity(
  sqlite: Database
): SqliteIntegrityResult {
  const integrityRows = sqlite
    .query<{ readonly result: string }, []>(
      "SELECT integrity_check AS result FROM pragma_integrity_check"
    )
    .all()
  const foreignKeyViolationCount = sqlite
    .query<unknown, []>("PRAGMA foreign_key_check")
    .all().length
  const integrity =
    integrityRows.length === 1 && integrityRows[0]?.result === "ok"
      ? "ok"
      : "failed"

  return {
    foreignKeyViolationCount,
    integrity,
    kind: "sqlite-integrity-result",
    status:
      integrity === "ok" && foreignKeyViolationCount === 0 ? "ok" : "blocked",
  }
}
