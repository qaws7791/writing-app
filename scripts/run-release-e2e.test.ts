import { describe, expect, it } from "bun:test"

import {
  releaseE2eProjects,
  releaseE2eTestFiles,
  type ReleaseE2eProject,
} from "#scripts/playwright-release-plan"
import {
  buildReleaseE2eApplications,
  executeReleaseE2ePlan,
} from "#scripts/run-release-e2e"

describe("Playwright release 실행 계약", () => {
  it("fixture 설정으로 web과 admin standalone을 순서대로 빌드한다", async () => {
    const commands: string[][] = []
    const environments: Array<Record<string, string | undefined>> = []

    const exitCode = await buildReleaseE2eApplications(
      async (command, environment) => {
        commands.push([...command])
        environments.push(environment)
        return 0
      }
    )

    expect(exitCode).toBe(0)
    expect(commands).toEqual([
      ["bun", "--filter", "@workspace/web", "build"],
      ["bun", "--filter", "@workspace/admin", "build"],
    ])
    expect(environments).toHaveLength(2)
    expect(environments[0]).toMatchObject({
      ADMIN_ORIGIN: "http://127.0.0.1:3101",
      API_BASE_URL: "http://127.0.0.1:4100",
      CONTENT_ASSET_IMAGE_ALLOWED_ORIGINS: "http://127.0.0.1:4199",
      CONTENT_ASSET_PUBLIC_BASE_URL: "http://127.0.0.1:4199/content-assets",
      NEXT_PUBLIC_LEARNER_WEB_ORIGIN: "http://localhost:3100",
      NODE_ENV: "test",
      WEB_ORIGIN: "http://localhost:3100",
    })
  })

  it("Chromium 성공 뒤 새 WebKit 실행을 순서대로 시작한다", async () => {
    const executedProjects: ReleaseE2eProject[] = []

    const exitCode = await executeReleaseE2ePlan(async (project) => {
      executedProjects.push(project)
      return 0
    })

    expect(exitCode).toBe(0)
    expect(executedProjects).toEqual(releaseE2eProjects)
  })

  it("앞선 브라우저가 실패하면 다음 격리 실행을 시작하지 않는다", async () => {
    const executedProjects: ReleaseE2eProject[] = []

    const exitCode = await executeReleaseE2ePlan(async (project) => {
      executedProjects.push(project)
      return 17
    })

    expect(exitCode).toBe(17)
    expect(executedProjects).toEqual(["release-chromium"])
  })

  it("두 release project가 승인된 spec만 실제로 수집한다", () => {
    const result = Bun.spawnSync({
      cmd: [
        process.execPath,
        "x",
        "playwright",
        "test",
        "--config",
        "playwright.config.ts",
        "--list",
        ...releaseE2eProjects.flatMap((project) => ["--project", project]),
      ],
      cwd: process.cwd(),
      env: {
        ...process.env,
        E2E_RUN_ROOT: process.cwd(),
        NO_COLOR: "1",
      },
      stderr: "pipe",
      stdout: "pipe",
    })
    const stdout = result.stdout.toString()
    const stderr = result.stderr.toString()

    expect(result.exitCode, `${stdout}\n${stderr}`).toBe(0)
    for (const project of releaseE2eProjects) {
      expect(readListedSpecFiles(stdout, project)).toEqual(
        [...releaseE2eTestFiles].sort()
      )
    }
  })
})

function readListedSpecFiles(
  stdout: string,
  project: ReleaseE2eProject
): readonly string[] {
  const matches = stdout.matchAll(
    new RegExp(
      `\\[${project}\\]\\s+›\\s+(?:e2e[\\\\/])?([^:]+\\.spec\\.ts):`,
      "gu"
    )
  )

  return [...new Set([...matches].map((match) => match[1]))].sort()
}
