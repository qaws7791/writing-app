import { randomUUID } from "node:crypto"
import {
  chmodSync,
  copyFileSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import type { LocalDatabaseDiagnostic } from "#scripts/local-database-diagnostic"

export interface RunLocalDatabaseSetupOptions {
  readonly backup: () => Promise<string>
  readonly databaseExists: () => boolean
  readonly inspect: () => Promise<LocalDatabaseDiagnostic>
  readonly migrateAndSeed: () => Promise<void>
  readonly rehearseMigration: (backupPath: string) => Promise<void>
}

export async function runLocalDatabaseSetup({
  backup,
  databaseExists,
  inspect,
  migrateAndSeed,
  rehearseMigration,
}: RunLocalDatabaseSetupOptions): Promise<void> {
  if (databaseExists()) {
    const diagnostic = await inspect()
    if (diagnostic.status === "blocked") {
      throw new Error(
        "기존 DB가 지원하지 않는 상태입니다. bun --filter @workspace/api db:reconcile 결과를 확인하세요."
      )
    }
    if (diagnostic.status === "migration-required") {
      const backupPath = await backup()
      await rehearseMigration(backupPath)
    }
  }

  await migrateAndSeed()
}

export interface RehearseLocalDatabaseMigrationOptions {
  readonly backupPath: string
  readonly inspectCandidate: (
    candidatePath: string
  ) => Promise<LocalDatabaseDiagnostic>
  readonly migrateCandidate: (candidatePath: string) => Promise<void>
}

export async function rehearseLocalDatabaseMigration({
  backupPath,
  inspectCandidate,
  migrateCandidate,
}: RehearseLocalDatabaseMigrationOptions): Promise<void> {
  const temporaryDirectory = mkdtempSync(
    path.join(tmpdir(), "writing-app-local-db-rehearsal-")
  )
  const candidatePath = path.join(temporaryDirectory, "api.sqlite")

  try {
    copyFileSync(backupPath, candidatePath)
    chmodSync(candidatePath, 0o600)
    await migrateCandidate(candidatePath)
    const diagnostic = await inspectCandidate(candidatePath)
    if (diagnostic.schema !== "current" || diagnostic.status !== "ok") {
      throw new Error(
        `DB migration 사본 리허설이 current/ok에 도달하지 못했습니다: ${diagnostic.schema}/${diagnostic.status}`
      )
    }
  } finally {
    rmSync(temporaryDirectory, { force: true, recursive: true })
  }
}

export function createLocalSetupOperationLockPath(
  repositoryRoot: string
): string {
  return path.join(repositoryRoot, ".writing-app-setup.lock")
}

export async function withLocalSetupOperationLock<T>(
  repositoryRoot: string,
  operation: () => Promise<T>
): Promise<T> {
  const lockPath = createLocalSetupOperationLockPath(repositoryRoot)
  const ownerPath = path.join(lockPath, "owner.json")
  const lockContent = JSON.stringify({
    processId: process.pid,
    repositoryRoot,
    startedAt: new Date().toISOString(),
    token: randomUUID(),
  })

  try {
    mkdirSync(lockPath, { mode: 0o700 })
  } catch (error) {
    if (isFileExistsError(error)) {
      throw new Error(
        `로컬 DB setup operation lock이 이미 있습니다: ${lockPath}. 다른 setup이 실행 중인지 확인하고, 실행 중인 process가 없을 때만 lock을 수동 제거하세요.`
      )
    }
    throw error
  }

  try {
    writeFileSync(ownerPath, lockContent, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600,
    })
  } catch (error) {
    try {
      unlinkSync(ownerPath)
    } catch (cleanupError) {
      if (!isFileNotFoundError(cleanupError)) {
        throw new AggregateError(
          [error, cleanupError],
          "로컬 setup operation lock metadata 생성과 정리에 실패했습니다."
        )
      }
    }
    try {
      rmdirSync(lockPath)
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        "로컬 setup operation lock metadata 생성과 정리에 실패했습니다."
      )
    }
    throw error
  }

  let operationFailed = false
  let operationFailure: unknown
  let result: T | undefined
  try {
    result = await operation()
  } catch (error) {
    operationFailed = true
    operationFailure = error
  }

  let cleanupFailure: unknown
  try {
    releaseLocalSetupOperationLock(lockPath, ownerPath, lockContent)
  } catch (error) {
    cleanupFailure = error
  }

  if (cleanupFailure !== undefined) {
    if (operationFailed) {
      throw new AggregateError(
        [operationFailure, cleanupFailure],
        "로컬 setup 실패 후 operation lock 정리에도 실패했습니다."
      )
    }
    throw cleanupFailure
  }
  if (operationFailed) throw operationFailure

  return result as T
}

function releaseLocalSetupOperationLock(
  lockPath: string,
  ownerPath: string,
  expectedContent: string
): void {
  let actualContent: string
  try {
    actualContent = readFileSync(ownerPath, "utf8")
  } catch (error) {
    throw new Error(
      `로컬 setup operation lock을 확인할 수 없습니다: ${lockPath}`,
      {
        cause: error,
      }
    )
  }
  if (actualContent !== expectedContent) {
    throw new Error(
      `로컬 setup operation lock 소유권이 바뀌어 자동 정리하지 않습니다: ${lockPath}`
    )
  }
  const entries = readdirSync(lockPath)
  if (entries.length !== 1 || entries[0] !== path.basename(ownerPath)) {
    throw new Error(
      `로컬 setup operation lock에 예상하지 않은 파일이 있어 자동 정리하지 않습니다: ${lockPath}`
    )
  }

  try {
    unlinkSync(ownerPath)
    rmdirSync(lockPath)
  } catch (error) {
    throw new Error(
      `로컬 setup operation lock을 정리할 수 없습니다: ${lockPath}`,
      {
        cause: error,
      }
    )
  }
}

function isFileExistsError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "EEXIST"
  )
}

function isFileNotFoundError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  )
}
