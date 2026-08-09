import { randomUUID } from "node:crypto"
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { createConnection } from "node:net"
import path from "node:path"

import {
  applyEnvironmentOverrides,
  inspectLocalEnvironmentFiles,
  prepareLocalEnvironmentFiles,
  readLocalApiEnvironment,
} from "#scripts/local-environment"
import { requireLocalToolchain } from "#scripts/local-toolchain"

const repositoryRoot = path.resolve(import.meta.dir, "..")

export type SetupLock = Readonly<{
  release: () => void
}>

async function runSetup(): Promise<void> {
  const toolchain = requireLocalToolchain(repositoryRoot)
  console.log(
    `✓ Git ${toolchain.gitVersion}, Bun ${toolchain.bunVersion}, Node.js ${toolchain.nodeVersion}`
  )

  const setupLock = acquireSetupLock(repositoryRoot)
  try {
    await runSetupWithLock()
  } finally {
    setupLock.release()
  }
}

async function runSetupWithLock(): Promise<void> {
  await run(["bun", "install", "--frozen-lockfile"])
  await run(["bun", "run", "generate"])

  for (const result of prepareLocalEnvironmentFiles(repositoryRoot)) {
    const detail =
      result.kind === "updated" ? ` (${result.keys.join(", ")})` : ""
    const action =
      result.kind === "created"
        ? "생성"
        : result.kind === "updated"
          ? "보충"
          : "보존"
    console.log(`- ${action}: ${result.path}${detail}`)
  }

  const environmentIssues = inspectLocalEnvironmentFiles(repositoryRoot)
  if (environmentIssues.length > 0) {
    throw new Error(
      `로컬 환경 파일을 준비할 수 없습니다.\n${environmentIssues.map((issue) => `- ${issue}`).join("\n")}`
    )
  }

  const apiEnvironment = applyEnvironmentOverrides(
    readLocalApiEnvironment(repositoryRoot),
    process.env
  )
  requireSafeSetupEnvironment(apiEnvironment)
  await run(
    [
      "bun",
      "--env-file=apps/api/.env",
      "apps/api/src/scripts/check-environment.ts",
    ],
    apiEnvironment
  )
  await requireAvailableApiPort(readApiPort(apiEnvironment))

  const backupPath = createSetupBackupPath()
  await run(
    [
      "bun",
      "--env-file=apps/api/.env",
      "apps/api/src/scripts/backup-database.ts",
      `--output=${backupPath}`,
      "--if-source-missing=skip",
    ],
    apiEnvironment
  )
  await run(["bun", "run", "dev:admin:setup"], apiEnvironment)
  await run(["bun", "run", "doctor"], apiEnvironment)

  console.log("로컬 준비가 완료되었습니다. bun run dev를 실행하세요.")
  console.log(
    "관리자가 새로 생성된 경우 로그인 값은 apps/api/.env의 ADMIN_SEED_EMAIL과 ADMIN_SEED_PASSWORD에 있습니다."
  )
  console.log("이미 존재한 관리자 credential은 변경하지 않습니다.")
}

function requireSafeSetupEnvironment(
  environment: Readonly<Record<string, string>>
): void {
  if (environment["NODE_ENV"] !== "development") {
    throw new Error(
      "로컬 setup은 NODE_ENV=development에서만 실행할 수 있습니다."
    )
  }
  if (environment["ADMIN_SEED_RESET_PASSWORD"] !== "false") {
    throw new Error(
      "로컬 setup은 기존 관리자 credential을 보존하기 위해 ADMIN_SEED_RESET_PASSWORD=false가 필요합니다."
    )
  }

  const databaseUrl = environment["DATABASE_URL"]
  if (
    databaseUrl === undefined ||
    databaseUrl === "" ||
    databaseUrl === ":memory:"
  ) {
    throw new Error("로컬 setup은 file-backed DATABASE_URL이 필요합니다.")
  }
  if (
    /^[a-z][a-z\d+.-]*:\/\//iu.test(databaseUrl) &&
    !databaseUrl.startsWith("file://")
  ) {
    throw new Error("로컬 setup은 원격 DATABASE_URL을 변경하지 않습니다.")
  }
}

export function acquireSetupLock(root: string): SetupLock {
  const dataDirectory = path.resolve(root, "data")
  const lockDirectory = path.join(dataDirectory, ".setup.lock")
  const ownerPath = path.join(lockDirectory, "owner.json")
  const token = randomUUID()

  mkdirSync(dataDirectory, { recursive: true, mode: 0o700 })
  try {
    mkdirSync(lockDirectory, { mode: 0o700 })
  } catch (error) {
    if (isFileSystemError(error, "EEXIST")) {
      throw new Error(
        `다른 setup이 실행 중이거나 이전 setup lock이 남아 있습니다: ${ownerPath}\n실행 중인 PID가 없는지 확인한 뒤 lock 디렉터리를 직접 제거하세요.`
      )
    }
    throw error
  }

  try {
    writeFileSync(
      ownerPath,
      `${JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString(), token }, null, 2)}\n`,
      { encoding: "utf8", flag: "wx", mode: 0o600 }
    )
  } catch (error) {
    rmSync(lockDirectory, { recursive: true })
    throw error
  }

  let released = false
  return {
    release() {
      if (released) return
      const owner = JSON.parse(readFileSync(ownerPath, "utf8")) as {
        readonly token?: unknown
      }
      if (owner.token !== token) {
        throw new Error(
          `setup lock 소유권이 바뀌어 해제하지 않습니다: ${ownerPath}`
        )
      }
      rmSync(lockDirectory, { recursive: true })
      released = true
    },
  }
}

function createSetupBackupPath(): string {
  const timestamp = new Date().toISOString().replaceAll(":", "-")
  return path.join(
    repositoryRoot,
    "data",
    "backups",
    "setup",
    `api-${timestamp}.sqlite`
  )
}

function isFileSystemError(error: unknown, code: string): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === code
  )
}

function readApiPort(environment: Readonly<Record<string, string>>): number {
  const value = environment["API_PORT"]
  const port = Number(value)
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`API_PORT가 올바르지 않습니다: ${value ?? "missing"}`)
  }
  return port
}

async function requireAvailableApiPort(port: number): Promise<void> {
  if (!(await isPortListening(port))) return
  throw new Error(
    `API port ${port}가 이미 사용 중입니다. 실행 중인 개발 서버를 종료한 뒤 bun run setup을 다시 실행하세요.`
  )
}

function isPortListening(port: number): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const socket = createConnection({ host: "127.0.0.1", port })
    socket.setTimeout(500)
    socket.once("connect", () => {
      socket.destroy()
      resolve(true)
    })
    socket.once("timeout", () => {
      socket.destroy()
      resolve(false)
    })
    socket.once("error", (error: NodeJS.ErrnoException) => {
      socket.destroy()
      if (error.code === "ECONNREFUSED") {
        resolve(false)
        return
      }
      reject(error)
    })
  })
}

async function run(
  command: readonly string[],
  environment?: Readonly<Record<string, string>>
): Promise<void> {
  console.log(`\n> ${command.join(" ")}`)
  const child = Bun.spawn([...command], {
    cwd: repositoryRoot,
    ...(environment === undefined
      ? {}
      : { env: { ...process.env, ...environment } }),
    stderr: "inherit",
    stdin: "inherit",
    stdout: "inherit",
  })
  if ((await child.exited) !== 0) {
    throw new Error(`${command.join(" ")} 명령이 실패했습니다.`)
  }
}

if (import.meta.main) {
  try {
    await runSetup()
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
