import path from "node:path"

export type LocalDatabaseDiagnostic =
  | Readonly<{
      schema: "current"
      status: "ok"
    }>
  | Readonly<{
      pendingMigrationIds: readonly string[]
      schema: "current"
      status: "migration-required"
    }>
  | Readonly<{
      schema: "empty"
      status: "migration-required"
    }>
  | Readonly<{
      reason: string
      schema: "unsupported"
      status: "blocked"
    }>

export interface InspectLocalDatabaseOptions {
  readonly environment: Readonly<NodeJS.ProcessEnv>
  readonly repositoryRoot: string
}

export interface LocalDatabaseDiagnosticProcessResult {
  readonly exitCode: number
  readonly stderr: string
  readonly stdout: string
}

export async function inspectLocalApplicationDatabase({
  environment,
  repositoryRoot,
}: InspectLocalDatabaseOptions): Promise<LocalDatabaseDiagnostic> {
  const child = Bun.spawn(["bun", "apps/api/src/scripts/inspect-database.ts"], {
    cwd: repositoryRoot,
    env: environment,
    stderr: "pipe",
    stdin: "ignore",
    stdout: "pipe",
  })
  const [exitCode, stdout, stderr] = await Promise.all([
    child.exited,
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ])

  return parseLocalDatabaseDiagnosticProcessResult({
    exitCode,
    stderr,
    stdout,
  })
}

export function parseLocalDatabaseDiagnosticProcessResult({
  exitCode,
  stderr,
  stdout,
}: LocalDatabaseDiagnosticProcessResult): LocalDatabaseDiagnostic {
  if (exitCode !== 0 && exitCode !== 2) {
    const detail = stderr.trim()
    throw new Error(
      detail.length > 0
        ? `DB 진단 실행에 실패했습니다: ${detail}`
        : "DB 진단 실행에 실패했습니다."
    )
  }

  const diagnostic = parseLocalDatabaseDiagnostic(stdout)
  const expectedExitCode =
    diagnostic.schema === "current" && diagnostic.status === "ok" ? 0 : 2
  if (exitCode !== expectedExitCode) {
    throw new Error(
      `DB 진단 결과와 종료 코드가 일치하지 않습니다: status=${diagnostic.status}, exit=${exitCode}`
    )
  }

  return diagnostic
}

export function parseLocalDatabaseDiagnostic(
  output: string
): LocalDatabaseDiagnostic {
  let value: unknown
  try {
    value = JSON.parse(output)
  } catch {
    throw new Error("DB 진단이 유효한 JSON 결과를 반환하지 않았습니다.")
  }

  if (!isObject(value) || value["kind"] !== "application-database-diagnostic") {
    throw new Error("DB 진단 결과의 kind가 올바르지 않습니다.")
  }

  const schema = value["schema"]
  const status = value["status"]
  if (schema === "current" && status === "ok") {
    return Object.freeze({ schema, status })
  }
  if (schema === "current" && status === "migration-required") {
    const pendingMigrationIds = value["pendingMigrationIds"]
    if (
      !Array.isArray(pendingMigrationIds) ||
      pendingMigrationIds.length === 0 ||
      !pendingMigrationIds.every(
        (migrationId): migrationId is string =>
          typeof migrationId === "string" && migrationId.length > 0
      )
    ) {
      throw new Error(
        "DB 진단 결과의 pending migration 목록이 올바르지 않습니다."
      )
    }
    return Object.freeze({
      pendingMigrationIds: Object.freeze([...pendingMigrationIds]),
      schema,
      status,
    })
  }
  if (schema === "empty" && status === "migration-required") {
    return Object.freeze({ schema, status })
  }
  if (
    schema === "unsupported" &&
    status === "blocked" &&
    typeof value["reason"] === "string" &&
    value["reason"].length > 0
  ) {
    return Object.freeze({ reason: value["reason"], schema, status })
  }

  throw new Error("DB 진단 결과의 schema/status 조합이 올바르지 않습니다.")
}

export function createSetupDatabaseBackupPath(
  repositoryRoot: string,
  now: Date = new Date()
): string {
  const timestamp = now
    .toISOString()
    .replaceAll("-", "")
    .replaceAll(":", "")
    .replace(".", "")
  return path.join(
    repositoryRoot,
    "data",
    "backups",
    `setup-${timestamp}-api.sqlite`
  )
}

function isObject(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
