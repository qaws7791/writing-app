import { stopE2eProcess } from "#scripts/e2e-server-lifecycle"
import {
  releaseE2eProjects,
  type ReleaseE2eProject,
} from "#scripts/playwright-release-plan"

const shutdownSignals = ["SIGINT", "SIGTERM", "SIGHUP"] as const
type ShutdownSignal = (typeof shutdownSignals)[number]
type ExecuteReleaseProject = (project: ReleaseE2eProject) => Promise<number>
type ExecuteReleaseStep = (
  command: readonly string[],
  environment: Record<string, string | undefined>
) => Promise<number>

const releaseBuildEnvironment = {
  ...process.env,
  ADMIN_ORIGIN: "http://127.0.0.1:3101",
  API_BASE_URL: "http://127.0.0.1:4100",
  CONTENT_ASSET_IMAGE_ALLOWED_ORIGINS: "http://127.0.0.1:4199",
  CONTENT_ASSET_PUBLIC_BASE_URL: "http://127.0.0.1:4199/content-assets",
  NEXT_PUBLIC_LEARNER_WEB_ORIGIN: "http://localhost:3100",
  NODE_ENV: "test",
  WEB_ORIGIN: "http://localhost:3100",
}

export async function buildReleaseE2eApplications(
  executeStep: ExecuteReleaseStep
): Promise<number> {
  for (const application of ["web", "admin"] as const) {
    const exitCode = await executeStep(
      ["bun", "--filter", `@workspace/${application}`, "build"],
      releaseBuildEnvironment
    )
    if (exitCode !== 0) return exitCode
  }

  return 0
}

export async function executeReleaseE2ePlan(
  executeProject: ExecuteReleaseProject
): Promise<number> {
  for (const project of releaseE2eProjects) {
    const exitCode = await executeProject(project)
    if (exitCode !== 0) return exitCode
  }

  return 0
}

if (import.meta.main) {
  let activeRun: Bun.Subprocess<"ignore", "inherit", "inherit"> | undefined
  let shutdownSignal: ShutdownSignal | undefined

  const requestShutdown = (signal: ShutdownSignal): void => {
    if (shutdownSignal !== undefined) return

    shutdownSignal = signal
    void (async () => {
      if (activeRun !== undefined) {
        await stopE2eProcess(activeRun, "Playwright release project")
      }
      process.exit(signalExitCode(signal))
    })()
  }

  const signalHandlers = shutdownSignals.map((signal) => ({
    handler: () => requestShutdown(signal),
    signal,
  }))

  for (const { handler, signal } of signalHandlers) {
    process.on(signal, handler)
  }

  try {
    const executeStep: ExecuteReleaseStep = async (command, environment) => {
      activeRun = Bun.spawn({
        cmd: [...command],
        cwd: process.cwd(),
        detached: process.platform !== "win32",
        env: environment,
        stderr: "inherit",
        stdin: "ignore",
        stdout: "inherit",
        windowsHide: true,
      })
      const exitCode = await activeRun.exited
      activeRun = undefined
      return exitCode
    }

    const buildExitCode = await buildReleaseE2eApplications(executeStep)
    process.exitCode =
      buildExitCode === 0
        ? await executeReleaseE2ePlan(async (project) => {
            process.stdout.write(
              `격리된 Playwright release project 시작: ${project}\n`
            )
            return executeStep(
              [
                process.execPath,
                "scripts/run-e2e.ts",
                "--runtime",
                "standalone",
                "--project",
                project,
              ],
              process.env
            )
          })
        : buildExitCode
  } finally {
    for (const { handler, signal } of signalHandlers) {
      process.off(signal, handler)
    }
  }
}

function signalExitCode(signal: ShutdownSignal): number {
  switch (signal) {
    case "SIGHUP":
      return 129
    case "SIGINT":
      return 130
    case "SIGTERM":
      return 143
  }
}
