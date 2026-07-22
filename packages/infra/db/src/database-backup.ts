import {
  chmodSync,
  copyFileSync,
  closeSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { basename, dirname, join, resolve } from "node:path"

import { Database } from "bun:sqlite"

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

  mkdirSync(dirname(backupPath), { recursive: true })
  const partialPath = join(
    dirname(backupPath),
    `.${basename(backupPath)}.${crypto.randomUUID()}.partial`
  )
  const source = new Database(sourcePath, { readonly: true, strict: true })

  try {
    writeFileSync(partialPath, source.serialize())
    const verification = verifyDatabaseBackup(partialPath, {
      requiredTables: input.requiredTables,
    })
    renameSync(partialPath, backupPath)
    return {
      backupBytes: statSync(backupPath).size,
      backupPath,
      kind: "database-backup-verified",
      sourcePath,
      verification,
    }
  } finally {
    source.close()
    rmSync(partialPath, { force: true })
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
    const integrityCheck = restored
      .query<{ readonly integrity_check: string }, []>("PRAGMA integrity_check")
      .get()?.integrity_check
    if (integrityCheck !== "ok") {
      throw new Error(`복구 DB integrity_check 실패: ${integrityCheck}`)
    }

    for (const tableName of requiredTables) {
      const exists = restored
        .query<{ readonly name: string }, [name: string]>(
          "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?1"
        )
        .get(tableName)
      if (exists === null || exists === undefined) {
        throw new Error(`복구 DB 필수 table 누락: ${tableName}`)
      }
      restored.query(`SELECT COUNT(*) AS row_count FROM "${tableName}"`).get()
    }

    return {
      integrityCheck: "ok",
      requiredTableReadSmoke: "ok",
      schemaVersion:
        restored
          .query<{ readonly schema_version: number }, []>(
            "PRAGMA schema_version"
          )
          .get()?.schema_version ?? 0,
      userVersion:
        restored
          .query<{ readonly user_version: number }, []>("PRAGMA user_version")
          .get()?.user_version ?? 0,
    }
  } finally {
    restored.close()
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
