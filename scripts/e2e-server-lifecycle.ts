export interface E2eServerDefinition {
  readonly command: readonly string[]
  readonly cwd: string
  readonly env: Record<string, string | undefined>
  readonly name: string
  readonly readinessUrl: string
}

export interface E2eServerLifecycleOptions {
  readonly onServerStarted?: (server: StartedE2eServer) => void
  readonly pollIntervalMilliseconds?: number
  readonly readinessTimeoutMilliseconds?: number
  readonly shutdownTimeoutMilliseconds?: number
}

export interface StartedE2eServer {
  readonly definition: E2eServerDefinition
  readonly process: Bun.Subprocess<"ignore", "inherit", "inherit">
}

const defaultPollIntervalMilliseconds = 250
const defaultReadinessTimeoutMilliseconds = 120_000
const defaultShutdownTimeoutMilliseconds = 5_000

/**
 * Starts each E2E dependency in an isolated process group owned by the runner.
 * The runner can therefore terminate only the processes it created without
 * inferring ownership from a port or a potentially stale PID.
 */
export async function startE2eServers(
  definitions: readonly E2eServerDefinition[],
  options: E2eServerLifecycleOptions = {}
): Promise<readonly StartedE2eServer[]> {
  const startedServers: StartedE2eServer[] = []

  try {
    for (const definition of definitions) {
      const server: StartedE2eServer = {
        definition,
        process: Bun.spawn({
          cmd: [...definition.command],
          cwd: definition.cwd,
          detached: process.platform !== "win32",
          env: definition.env,
          stderr: "inherit",
          stdin: "ignore",
          stdout: "inherit",
          windowsHide: true,
        }),
      }
      startedServers.push(server)
      options.onServerStarted?.(server)
      await waitForServerReadiness(server, options)
    }

    return startedServers
  } catch (error) {
    try {
      await stopE2eServers(startedServers, options)
    } catch (cleanupError) {
      console.error(
        "E2E server 시작 실패 후 정리하지 못했습니다.",
        cleanupError
      )
    }
    throw error
  }
}

export async function stopE2eServers(
  servers: readonly StartedE2eServer[],
  options: E2eServerLifecycleOptions = {}
): Promise<void> {
  const errors: unknown[] = []

  for (const server of [...servers].reverse()) {
    try {
      await stopE2eProcess(server.process, server.definition.name, options)
    } catch (error) {
      errors.push(error)
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `E2E server 정리에 실패했습니다. ${errors.map(String).join("\n")}`
    )
  }
}

async function waitForServerReadiness(
  server: StartedE2eServer,
  options: E2eServerLifecycleOptions
): Promise<void> {
  const deadline =
    performance.now() +
    (options.readinessTimeoutMilliseconds ??
      defaultReadinessTimeoutMilliseconds)

  while (performance.now() < deadline) {
    if (server.process.exitCode !== null) {
      throw new Error(
        `${server.definition.name} E2E server가 준비 전에 종료되었습니다. exitCode=${server.process.exitCode}`
      )
    }

    if (await isHttpReady(server.definition.readinessUrl)) return
    await Bun.sleep(
      options.pollIntervalMilliseconds ?? defaultPollIntervalMilliseconds
    )
  }

  throw new Error(
    `${server.definition.name} E2E server 준비 시간이 초과되었습니다: ${server.definition.readinessUrl}`
  )
}

export async function stopE2eProcess(
  subprocess: Bun.Subprocess<"ignore", "inherit", "inherit">,
  name: string,
  options: E2eServerLifecycleOptions = {}
): Promise<void> {
  const timeout =
    options.shutdownTimeoutMilliseconds ?? defaultShutdownTimeoutMilliseconds

  if (process.platform === "win32") {
    if (subprocess.exitCode === null) subprocess.kill("SIGTERM")

    if (await waitForProcessExit(subprocess, timeout)) return

    terminateWindowsProcessTree(subprocess.pid)
    if (await waitForProcessExit(subprocess, timeout)) return

    throw new Error(
      `${name} E2E process tree가 종료되지 않았습니다. pid=${subprocess.pid}`
    )
  }

  signalOwnedProcessGroup(subprocess.pid, "SIGTERM")
  await waitForProcessExit(subprocess, timeout)

  if (!isProcessGroupAlive(subprocess.pid)) return

  signalOwnedProcessGroup(subprocess.pid, "SIGKILL")
  if (await waitForProcessGroupExit(subprocess.pid, timeout)) return

  throw new Error(
    `${name} E2E process group이 종료되지 않았습니다. pgid=${subprocess.pid}`
  )
}

function signalOwnedProcessGroup(
  processId: number,
  signal: NodeJS.Signals
): void {
  try {
    process.kill(-processId, signal)
  } catch (error) {
    if (readErrorCode(error) !== "ESRCH") throw error
  }
}

function isProcessGroupAlive(processId: number): boolean {
  try {
    process.kill(-processId, 0)
    return true
  } catch (error) {
    if (readErrorCode(error) === "ESRCH") return false
    throw error
  }
}

async function waitForProcessExit(
  process: Bun.Subprocess<"ignore", "inherit", "inherit">,
  timeout: number
): Promise<boolean> {
  if (process.exitCode !== null) return true

  return Promise.race([
    process.exited.then(() => true),
    Bun.sleep(timeout).then(() => false),
  ])
}

async function waitForProcessGroupExit(
  processId: number,
  timeout: number
): Promise<boolean> {
  const deadline = performance.now() + timeout

  while (performance.now() < deadline) {
    if (!isProcessGroupAlive(processId)) return true
    await Bun.sleep(defaultPollIntervalMilliseconds)
  }

  return !isProcessGroupAlive(processId)
}

function terminateWindowsProcessTree(processId: number): void {
  const termination = Bun.spawnSync({
    cmd: ["taskkill", "/PID", String(processId), "/T", "/F"],
    stderr: "pipe",
    stdout: "pipe",
    windowsHide: true,
  })

  if (termination.success) return

  throw new Error(
    `Windows E2E server process tree 종료 실패: ${termination.stderr.toString()}`
  )
}

async function isHttpReady(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { redirect: "manual" })
    return response.status >= 200 && response.status < 500
  } catch {
    return false
  }
}

function readErrorCode(error: unknown): string | undefined {
  return typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
    ? error.code
    : undefined
}
