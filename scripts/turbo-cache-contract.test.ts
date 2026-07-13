import { spawnSync } from "node:child_process"
import path from "node:path"

import { describe, expect, test } from "bun:test"

interface TurboDryRun {
  readonly tasks: readonly TurboDryRunTask[]
}

interface TurboDryRunTask {
  readonly hash: string
  readonly resolvedTaskDefinition: {
    readonly cache: boolean
    readonly env: readonly string[]
    readonly outputs: readonly string[]
    readonly passThroughEnv: readonly string[] | null
    readonly persistent: boolean
  }
  readonly taskId: string
}

interface TurboDryRunEnvironment {
  readonly GITHUB_STEP_SUMMARY?: string
  readonly WEB_ORIGIN?: string
}

const repositoryRoot = path.resolve(import.meta.dir, "..")
const turboBinary = path.join(
  repositoryRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "turbo.exe" : "turbo"
)

describe("Turbo cache 계약", () => {
  test("CI summary 경로는 task hash에 영향을 주지 않는다", () => {
    const first = readDryRun(["lint", "typecheck", "build"], {
      GITHUB_STEP_SUMMARY: "summary-a.md",
    })
    const second = readDryRun(["lint", "typecheck", "build"], {
      GITHUB_STEP_SUMMARY: "summary-b.md",
    })

    expect(readTaskHashes(second)).toEqual(readTaskHashes(first))
  })

  test("학습자 web origin은 해당 build hash만 바꾼다", () => {
    const first = readDryRun(["lint", "typecheck", "build"], {
      WEB_ORIGIN: "https://first.example.test",
    })
    const second = readDryRun(["lint", "typecheck", "build"], {
      WEB_ORIGIN: "https://second.example.test",
    })

    expect(readChangedTaskIds(first, second)).toEqual(["@workspace/web#build"])
  })

  test("산출물이 없는 admin-api build는 output cache를 선언하지 않는다", () => {
    const build = readTask(readDryRun(["build"]), "@workspace/admin-api#build")

    expect(build.resolvedTaskDefinition.outputs).toEqual([])
  })

  test("앱 dev task는 cache 없이 runtime env만 전달한다", () => {
    const dev = readTask(readDryRun(["dev"]), "@workspace/web#dev")

    expect(dev.resolvedTaskDefinition.cache).toBe(false)
    expect(dev.resolvedTaskDefinition.persistent).toBe(true)
    expect(dev.resolvedTaskDefinition.passThroughEnv).toContain("WEB_ORIGIN")
    expect(dev.resolvedTaskDefinition.env).toEqual([])
  })
})

function readDryRun(
  tasks: readonly string[],
  environment: TurboDryRunEnvironment = {}
): TurboDryRun {
  const result = spawnSync(turboBinary, ["run", ...tasks, "--dry=json"], {
    cwd: repositoryRoot,
    encoding: "utf8",
    env: { ...process.env, ...environment },
  })

  if (result.status !== 0) {
    throw new Error(result.stderr || "Turbo dry run이 실패했습니다.")
  }

  return JSON.parse(result.stdout) as TurboDryRun
}

function readTask(dryRun: TurboDryRun, taskId: string): TurboDryRunTask {
  const task = dryRun.tasks.find((candidate) => candidate.taskId === taskId)
  if (task === undefined) {
    throw new Error(`Turbo dry run에 ${taskId} task가 없습니다.`)
  }

  return task
}

function readTaskHashes(dryRun: TurboDryRun): readonly string[] {
  return dryRun.tasks.map((task) => `${task.taskId}:${task.hash}`).toSorted()
}

function readChangedTaskIds(
  first: TurboDryRun,
  second: TurboDryRun
): readonly string[] {
  const firstHashes = new Map(
    first.tasks.map((task) => [task.taskId, task.hash] as const)
  )

  return second.tasks
    .filter((task) => firstHashes.get(task.taskId) !== task.hash)
    .map((task) => task.taskId)
    .toSorted()
}
