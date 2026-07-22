import { existsSync } from "node:fs"
import { mkdtemp, rm } from "node:fs/promises"
import { createConnection } from "node:net"
import { tmpdir } from "node:os"
import path from "node:path"

import { expect, test } from "bun:test"

const repositoryRoot = path.resolve(import.meta.dir, "..")
const adminNextLock = path.join(
  repositoryRoot,
  "apps",
  "admin",
  ".next",
  "dev",
  "lock"
)
const adminWebPort = 3001
const apiPort = 4000
const adminApiBaseUrl = `http://127.0.0.1:${apiPort}`

interface ProcessPair {
  readonly parentPid: number
  readonly pid: number
}

test("dev:admin은 admin web과 통합 API만 실행하고 소유 process와 port를 정리한다", async () => {
  expect(await isPortListening(adminWebPort)).toBe(false)
  expect(await isPortListening(apiPort)).toBe(false)
  expect(existsSync(adminNextLock)).toBe(false)

  const temporaryDirectory = await mkdtemp(
    path.join(tmpdir(), "writing-app-admin-dev-")
  )
  const databasePath = path.join(temporaryDirectory, "admin.sqlite")
  const databaseUrl = `file:${databasePath}`
  const environment = {
    ...process.env,
    API_ALLOWED_HOSTS: `localhost:${apiPort},127.0.0.1:${apiPort}`,
    API_BASE_URL: adminApiBaseUrl,
    ADMIN_AUTH_SECRET: "admin-dev-lifecycle-secret-value-0001",
    ADMIN_ORIGIN: `http://127.0.0.1:${adminWebPort}`,
    API_ORIGIN: adminApiBaseUrl,
    API_PORT: String(apiPort),
    LEARNER_AUTH_SECRET: "learner-dev-lifecycle-secret-value-01",
    CI: "true",
    CURSOR_SIGNING_SECRET: "cursor-signing-secret-value-for-lifecycle-01",
    DATABASE_URL: databaseUrl,
    ENABLE_TEST_AUTH: "true",
    LOG_PRETTY: "false",
    NEXT_PUBLIC_API_BASE_URL: adminApiBaseUrl,
    NEXT_PUBLIC_LEARNER_WEB_ORIGIN: "http://127.0.0.1:3000",
    NODE_ENV: "development",
  }

  let devProcess: Bun.Subprocess<"ignore", "pipe", "pipe"> | undefined
  let outputTasks: readonly Promise<void>[] = []
  const ownedProcessIds = new Set<number>()
  let output = ""

  try {
    migrateDisposableDatabase(environment)

    devProcess = Bun.spawn({
      cmd: [process.execPath, "run", "dev:admin"],
      cwd: repositoryRoot,
      detached: process.platform !== "win32",
      env: environment,
      stderr: "pipe",
      stdout: "pipe",
      windowsHide: true,
    })
    outputTasks = [
      collectProcessOutput(devProcess.stdout, (chunk) => {
        output += chunk
      }),
      collectProcessOutput(devProcess.stderr, (chunk) => {
        output += chunk
      }),
    ]
    ownedProcessIds.add(devProcess.pid)

    await waitFor(
      "admin API와 admin web readiness",
      async () =>
        (await isHttpReady(`${adminApiBaseUrl}/health`)) &&
        (await isHttpReady(`http://127.0.0.1:${adminWebPort}/login`)),
      90_000
    )
    expect(existsSync(adminNextLock)).toBe(true)
    expect(output).toContain("@workspace/api:dev")
    expect(output).toContain("@workspace/admin:dev")
    addOwnedProcessIds(
      ownedProcessIds,
      await readProcessTable(),
      devProcess.pid
    )
    expect(output).not.toMatch(/outside (?:of )?(?:the )?project directory/iu)
    addOwnedProcessIds(
      ownedProcessIds,
      await readProcessTable(),
      devProcess.pid
    )

    await requestPlatformShutdown(devProcess)
    const ownedChildProcessIds = new Set(ownedProcessIds)
    ownedChildProcessIds.delete(devProcess.pid)
    await waitFor(
      "admin dev child process exit",
      async () => (await runningProcessIds(ownedChildProcessIds)).length === 0,
      15_000
    )
    await waitFor(
      "admin dev port와 Next lock 해제",
      async () =>
        !(await isPortListening(adminWebPort)) &&
        !(await isPortListening(apiPort)) &&
        !existsSync(adminNextLock),
      15_000
    )
    if (
      process.platform === "win32" &&
      !(await waitForProcessExit(devProcess, 2_000))
    ) {
      devProcess.kill("SIGTERM")
    }
    expect(await waitForProcessExit(devProcess, 5_000)).toBe(true)
    await Promise.all(outputTasks)
    expect(await runningProcessIds(ownedProcessIds)).toEqual([])
  } finally {
    if (devProcess !== undefined) {
      addOwnedProcessIds(
        ownedProcessIds,
        await readProcessTable(),
        devProcess.pid
      )
      const runningOwnedProcessIds = new Set(
        await runningProcessIds(ownedProcessIds)
      )
      if (runningOwnedProcessIds.size > 0) {
        forceStopOwnedProcesses(runningOwnedProcessIds)
        await waitForProcessExit(devProcess, 5_000)
      }
    }
    await Promise.all(outputTasks)
    await rm(temporaryDirectory, { force: true, recursive: true })
  }
}, 180_000)

function migrateDisposableDatabase(
  environment: Record<string, string | undefined>
): void {
  const migration = Bun.spawnSync({
    cmd: [process.execPath, "--filter", "@workspace/api", "db:migrate"],
    cwd: repositoryRoot,
    env: environment,
    stderr: "pipe",
    stdout: "pipe",
    windowsHide: true,
  })

  if (!migration.success) {
    throw new Error(
      `disposable DB migration 실패\n${migration.stdout.toString()}\n${migration.stderr.toString()}`
    )
  }
}

async function requestPlatformShutdown(
  devProcess: Bun.Subprocess<"ignore", "pipe", "pipe">
): Promise<void> {
  if (process.platform === "win32") {
    const termination = Bun.spawnSync({
      cmd: ["taskkill", "/PID", String(devProcess.pid), "/T", "/F"],
      stderr: "pipe",
      stdout: "pipe",
      windowsHide: true,
    })
    if (
      !termination.success &&
      !(await waitForProcessExit(devProcess, 2_000))
    ) {
      throw new Error(
        `Windows admin dev process tree 종료 실패\n${termination.stdout.toString()}\n${termination.stderr.toString()}`
      )
    }
    return
  }

  process.kill(-devProcess.pid, "SIGINT")
}

function forceStopOwnedProcesses(processIds: ReadonlySet<number>): void {
  const orderedProcessIds = [...processIds].sort((left, right) => right - left)

  for (const processId of orderedProcessIds) {
    if (processId === process.pid) continue

    if (process.platform === "win32") {
      Bun.spawnSync({
        cmd: ["taskkill", "/PID", String(processId), "/F"],
        stderr: "ignore",
        stdout: "ignore",
        windowsHide: true,
      })
      continue
    }

    try {
      process.kill(processId, "SIGKILL")
    } catch (error) {
      if (!isMissingProcessError(error)) throw error
    }
  }
}

function addOwnedProcessIds(
  target: Set<number>,
  processTable: readonly ProcessPair[],
  rootPid: number
): void {
  const pendingParentIds = [rootPid]

  while (pendingParentIds.length > 0) {
    const parentPid = pendingParentIds.shift()
    if (parentPid === undefined) break

    for (const processPair of processTable) {
      if (processPair.parentPid !== parentPid || target.has(processPair.pid)) {
        continue
      }

      target.add(processPair.pid)
      pendingParentIds.push(processPair.pid)
    }
  }
}

async function runningProcessIds(
  expectedProcessIds: ReadonlySet<number>
): Promise<readonly number[]> {
  const runningProcessIds = new Set(
    (await readProcessTable()).map((processPair) => processPair.pid)
  )
  return [...expectedProcessIds].filter((processId) =>
    runningProcessIds.has(processId)
  )
}

async function readProcessTable(): Promise<readonly ProcessPair[]> {
  const command =
    process.platform === "win32"
      ? [
          "powershell.exe",
          "-NoProfile",
          "-NonInteractive",
          "-Command",
          "[Console]::OutputEncoding = [Text.UTF8Encoding]::new(); Get-CimInstance Win32_Process | ForEach-Object { '{0} {1}' -f $_.ProcessId, $_.ParentProcessId }",
        ]
      : ["ps", "-eo", "pid=,ppid="]
  const processTable = Bun.spawn({
    cmd: command,
    stderr: "pipe",
    stdout: "pipe",
    windowsHide: true,
  })
  const [exitCode, stdout, stderr] = await Promise.all([
    processTable.exited,
    new Response(processTable.stdout).text(),
    new Response(processTable.stderr).text(),
  ])

  if (exitCode !== 0) {
    throw new Error(`process table 조회 실패: ${stderr}`)
  }

  return stdout
    .split(/\r?\n/u)
    .map((line) => /^(\d+)\s+(\d+)$/u.exec(line.trim()))
    .filter((match): match is RegExpExecArray => match !== null)
    .map((match) => ({
      parentPid: Number(match[2]),
      pid: Number(match[1]),
    }))
}

async function isHttpReady(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { redirect: "manual" })
    return response.status >= 200 && response.status < 500
  } catch {
    return false
  }
}

function isPortListening(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ host: "127.0.0.1", port })
    const finish = (isListening: boolean) => {
      socket.destroy()
      resolve(isListening)
    }

    socket.setTimeout(500)
    socket.once("connect", () => finish(true))
    socket.once("error", () => finish(false))
    socket.once("timeout", () => finish(false))
  })
}

async function waitFor(
  description: string,
  predicate: () => boolean | Promise<boolean>,
  timeout: number
): Promise<void> {
  const deadline = performance.now() + timeout

  while (performance.now() < deadline) {
    if (await predicate()) return
    await Bun.sleep(250)
  }

  throw new Error(`${description} 대기 시간이 ${timeout}ms를 초과했습니다.`)
}

async function waitForProcessExit(
  devProcess: Bun.Subprocess<"ignore", "pipe", "pipe">,
  timeout: number
): Promise<boolean> {
  return Promise.race([
    devProcess.exited.then(() => true),
    Bun.sleep(timeout).then(() => false),
  ])
}

async function collectProcessOutput(
  stream: ReadableStream<Uint8Array<ArrayBuffer>>,
  append: (chunk: string) => void
): Promise<void> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const result = await reader.read()
    if (result.done) break

    const chunk = decoder.decode(result.value, { stream: true })
    append(chunk)
    process.stdout.write(chunk)
  }

  const finalChunk = decoder.decode()
  if (finalChunk.length > 0) append(finalChunk)
}

function isMissingProcessError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as Error & { readonly code?: string }).code === "ESRCH"
  )
}
