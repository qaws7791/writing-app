import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
} from "node:fs"
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
} from "node:path"
import { fileURLToPath } from "node:url"
import { createHash } from "node:crypto"

const sqliteHeader = "SQLite format 3\0"

export type DestructiveDatabaseOptions = {
  readonly allowDatabaseReset: boolean
  readonly databaseUrl: string
  readonly forceDatabaseReset: boolean
  readonly nodeEnv: string
  readonly targetFingerprint?: string
}

export type DatabaseResetTarget = {
  readonly backupDirectory: string
  readonly databasePath: string
  readonly fingerprint: string
  readonly files: readonly string[]
}

const repositoryDataDirectory = fileURLToPath(
  new URL("../../../../data/", import.meta.url)
)

export function inspectDatabaseResetTarget(
  databaseUrl: string,
  dataDirectory = repositoryDataDirectory
): DatabaseResetTarget | null {
  const databasePath = getDatabaseFilePath(databaseUrl)

  if (databasePath === null) {
    return null
  }

  const canonicalDataDirectory = canonicalizePath(dataDirectory)
  const canonicalDatabasePath = canonicalizePath(databasePath)
  assertPathWithinData(canonicalDatabasePath, canonicalDataDirectory)

  const candidates = [
    canonicalDatabasePath,
    `${canonicalDatabasePath}-shm`,
    `${canonicalDatabasePath}-wal`,
  ]
  const files = candidates.filter(existsSync)

  for (const path of files) {
    const status = lstatSync(path)

    if (status.isSymbolicLink() || !status.isFile()) {
      throw new Error("DB 초기화 대상은 일반 파일이어야 합니다.")
    }

    assertPathWithinData(realpathSync.native(path), canonicalDataDirectory)
  }

  if (existsSync(canonicalDatabasePath)) {
    const header = readFileSync(canonicalDatabasePath)
      .subarray(0, 16)
      .toString()

    if (header !== sqliteHeader) {
      throw new Error("초기화 대상이 SQLite 데이터베이스 파일이 아닙니다.")
    }
  }

  const fingerprint = createHash("sha256")
    .update(canonicalDatabasePath)
    .digest("hex")

  return {
    backupDirectory: join(
      canonicalDataDirectory,
      "backups",
      `${basename(canonicalDatabasePath)}-${fingerprint.slice(0, 12)}`
    ),
    databasePath: canonicalDatabasePath,
    files,
    fingerprint,
  }
}

export function assertDestructiveDatabaseAllowed(
  target: DatabaseResetTarget,
  options: DestructiveDatabaseOptions
): void {
  if (!options.allowDatabaseReset || !options.forceDatabaseReset) {
    throw new Error(
      "DB 초기화는 ALLOW_DATABASE_RESET=true와 --force가 필요합니다."
    )
  }

  if (
    options.nodeEnv === "production" &&
    options.targetFingerprint !== target.fingerprint
  ) {
    throw new Error(
      "production DB 초기화는 ALLOW_DATABASE_RESET=true, --force, 일치하는 대상 fingerprint가 필요합니다."
    )
  }
}

export function resetSqliteDatabaseFiles(
  options: DestructiveDatabaseOptions
): DatabaseResetTarget | null {
  const target = inspectDatabaseResetTarget(options.databaseUrl)

  if (target === null) {
    throw new Error("메모리 또는 SQLite가 아닌 DB는 초기화할 수 없습니다.")
  }

  assertDestructiveDatabaseAllowed(target, options)

  if (target.files.length === 0) {
    return target
  }

  mkdirSync(target.backupDirectory, { recursive: true })

  for (const path of target.files) {
    const backupPath = join(target.backupDirectory, basename(path))
    copyFileSync(path, backupPath)

    if (statSync(path).size !== statSync(backupPath).size) {
      throw new Error("DB 백업 검증에 실패했습니다.")
    }
  }

  try {
    for (const path of target.files) {
      rmSync(path)
    }
  } catch (error) {
    for (const path of target.files) {
      const backupPath = join(target.backupDirectory, basename(path))

      if (existsSync(backupPath)) {
        copyFileSync(backupPath, path)
      }
    }

    throw error
  }

  return target
}

function assertPathWithinData(path: string, dataDirectory: string): void {
  const relativePath = relative(dataDirectory, path)

  if (
    relativePath === "" ||
    relativePath.startsWith("..") ||
    isAbsolute(relativePath)
  ) {
    throw new Error("저장소 data 디렉터리 밖의 DB 파일은 초기화할 수 없습니다.")
  }
}

function canonicalizePath(path: string): string {
  const absolutePath = resolve(path)
  let existingPath = absolutePath
  const missingSegments: string[] = []

  while (!existsSync(existingPath)) {
    const parent = dirname(existingPath)

    if (parent === existingPath) {
      break
    }

    missingSegments.unshift(basename(existingPath))
    existingPath = parent
  }

  return resolve(realpathSync.native(existingPath), ...missingSegments)
}

function getDatabaseFilePath(databaseUrl: string): string | null {
  if (databaseUrl === ":memory:") {
    return null
  }

  if (databaseUrl.startsWith("file://")) {
    return fileURLToPath(databaseUrl)
  }

  if (/^[a-z][a-z\d+.-]*:\/\//i.test(databaseUrl)) {
    return null
  }

  if (databaseUrl.startsWith("file:")) {
    return databaseUrl.slice("file:".length)
  }

  return databaseUrl
}
