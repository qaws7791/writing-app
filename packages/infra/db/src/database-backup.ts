import {
  chmodSync,
  copyFileSync,
  closeSync,
  existsSync,
  linkSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { basename, dirname, join, resolve } from "node:path"

import { Database, type SQLQueryBindings } from "bun:sqlite"

export type DatabaseBackupVerification = {
  readonly integrityCheck: "ok"
  readonly requiredTableReadSmoke: "ok"
  readonly schemaVersion: number
  readonly userVersion: number
}

export type DatabaseBackupReport = {
  readonly backupBytes: number
  readonly backupPath: string
  readonly kind: "database-backup-verified"
  readonly sourcePath: string
  readonly verification: DatabaseBackupVerification
}

export function createVerifiedDatabaseBackup(input: {
  readonly backupPath: string
  readonly requiredTables: readonly string[]
  readonly sourcePath: string
}): DatabaseBackupReport {
  const sourcePath = resolve(input.sourcePath)
  const backupPath = resolve(input.backupPath)
  assertReadableDatabaseSource(sourcePath)
  if (sourcePath === backupPath) {
    throw new Error("백업 산출물은 원본 DB와 다른 경로여야 합니다.")
  }
  if (existsSync(backupPath)) {
    throw new Error(`기존 백업 파일을 덮어쓰지 않습니다: ${backupPath}`)
  }

  ensureBackupOutputDirectory(dirname(backupPath))
  const partialPath = join(
    dirname(backupPath),
    `.${basename(backupPath)}.${crypto.randomUUID()}.partial`
  )
  const source = new Database(sourcePath, { readonly: true, strict: true })
  let sourceClosed = false

  try {
    writeFileSync(partialPath, source.serialize(), {
      flag: "wx",
      mode: 0o600,
    })
    chmodSync(partialPath, 0o600)
    normalizeBackupJournalMode(partialPath)
    const verification = verifyDatabaseBackup(partialPath, {
      requiredTables: input.requiredTables,
    })
    const backupBytes = statSync(partialPath).size
    source.close(true)
    sourceClosed = true
    publishBackupWithoutOverwrite(partialPath, backupPath)
    return {
      backupBytes,
      backupPath,
      kind: "database-backup-verified",
      sourcePath,
      verification,
    }
  } finally {
    try {
      if (!sourceClosed) {
        source.close(true)
      }
    } finally {
      for (const temporaryPath of [
        partialPath,
        `${partialPath}-shm`,
        `${partialPath}-wal`,
      ]) {
        rmSync(temporaryPath, { force: true })
      }
    }
  }
}

function publishBackupWithoutOverwrite(
  partialPath: string,
  backupPath: string
): void {
  try {
    linkSync(partialPath, backupPath)
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "EEXIST"
    ) {
      throw new Error(`기존 백업 파일을 덮어쓰지 않습니다: ${backupPath}`, {
        cause: error,
      })
    }
    throw error
  }
}

function ensureBackupOutputDirectory(outputDirectory: string): void {
  const firstCreatedDirectory = mkdirSync(outputDirectory, {
    mode: 0o700,
    recursive: true,
  })
  if (firstCreatedDirectory !== undefined) {
    chmodSync(outputDirectory, 0o700)
  }
}

function normalizeBackupJournalMode(backupPath: string): void {
  const backup = new Database(backupPath, {
    create: false,
    readwrite: true,
    strict: true,
  })

  try {
    const journalMode = readSqliteRow<{
      readonly journal_mode: string
    }>(backup, "PRAGMA journal_mode = DELETE")?.journal_mode
    if (journalMode !== "delete") {
      throw new Error(`백업 DB journal_mode 전환 실패: ${journalMode}`)
    }
  } finally {
    backup.close(true)
  }
}

export function verifyDatabaseBackup(
  backupPathInput: string,
  input: { readonly requiredTables: readonly string[] }
): DatabaseBackupVerification {
  const backupPath = resolve(backupPathInput)
  assertReadableDatabaseSource(backupPath)
  const temporaryDirectory = mkdtempSync(
    join(tmpdir(), "writing-app restore verification ")
  )
  const restoredPath = join(temporaryDirectory, basename(backupPath))

  try {
    copyFileSync(backupPath, restoredPath)
    chmodSync(restoredPath, 0o600)
    return inspectRestoredDatabase(restoredPath, input.requiredTables)
  } finally {
    rmSync(temporaryDirectory, { force: true, recursive: true })
  }
}

function inspectRestoredDatabase(
  restoredPath: string,
  requiredTables: readonly string[]
): DatabaseBackupVerification {
  const restored = new Database(restoredPath, {
    create: false,
    readwrite: true,
    strict: true,
  })

  try {
    restored.exec("PRAGMA query_only = ON")
    const integrityCheck = readSqliteRow<{
      readonly integrity_check: string
    }>(restored, "PRAGMA integrity_check")?.integrity_check
    if (integrityCheck !== "ok") {
      throw new Error(`복구 DB integrity_check 실패: ${integrityCheck}`)
    }

    for (const tableName of requiredTables) {
      const exists = readSqliteRow<{ readonly name: string }>(
        restored,
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?1",
        tableName
      )
      if (exists === null || exists === undefined) {
        throw new Error(`복구 DB 필수 table 누락: ${tableName}`)
      }
      readSqliteRow(
        restored,
        `SELECT COUNT(*) AS row_count FROM "${tableName}"`
      )
    }

    return {
      integrityCheck: "ok",
      requiredTableReadSmoke: "ok",
      schemaVersion:
        readSqliteRow<{ readonly schema_version: number }>(
          restored,
          "PRAGMA schema_version"
        )?.schema_version ?? 0,
      userVersion:
        readSqliteRow<{ readonly user_version: number }>(
          restored,
          "PRAGMA user_version"
        )?.user_version ?? 0,
    }
  } finally {
    restored.close(true)
  }
}

function readSqliteRow<TRow>(
  sqlite: Database,
  sql: string,
  ...params: SQLQueryBindings[]
): TRow | null {
  const statement = sqlite.prepare<TRow, SQLQueryBindings[]>(sql)

  try {
    return statement.get(...params)
  } finally {
    statement.finalize()
  }
}

function assertReadableDatabaseSource(filePath: string): void {
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    throw new Error(`SQLite 파일을 찾을 수 없습니다: ${filePath}`)
  }
  const descriptor = openSync(filePath, "r")
  const headerBytes = Buffer.alloc(16)
  try {
    readSync(descriptor, headerBytes, 0, headerBytes.length, 0)
  } finally {
    closeSync(descriptor)
  }
  const header = headerBytes.toString("utf8")
  if (header !== "SQLite format 3\0") {
    throw new Error(`SQLite 파일 형식이 아닙니다: ${filePath}`)
  }
}
