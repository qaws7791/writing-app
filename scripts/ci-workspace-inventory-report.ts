import fs from "node:fs"
import path from "node:path"

import type { WorkspaceManifest } from "#scripts/workspace-inventory"

export type TaskExecutionStatus =
  | "cache-hit"
  | "excluded"
  | "failed"
  | "skipped"
  | "supported"
  | "executed"

type TurboTaskSummary = {
  readonly cacheStatus: string | null
  readonly command: string | null
  readonly exitCode: number | null
  readonly packageName: string
  readonly task: string
}

export type TurboRunSummary = {
  readonly tasks: readonly TurboTaskSummary[]
  readonly turboVersion: string
  readonly version: string
}

export function readTurboRunSummary(filePath: string): TurboRunSummary {
  const value: unknown = JSON.parse(fs.readFileSync(filePath, "utf8"))

  if (!isObject(value)) {
    throw new Error(`${filePath} Turborepo summary가 객체가 아닙니다.`)
  }

  const version = value["version"]
  const turboVersion = value["turboVersion"]
  const tasks = value["tasks"]
  if (
    version !== "1" ||
    typeof turboVersion !== "string" ||
    !Array.isArray(tasks)
  ) {
    throw new Error(`${filePath} Turborepo summary v1 schema가 필요합니다.`)
  }

  return {
    tasks: tasks.map((task, index) => readTurboTask(task, filePath, index)),
    turboVersion,
    version,
  }
}

export function findLatestTurboRunSummary(directory: string): string {
  const summaries = fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => {
      const filePath = path.join(directory, entry.name)
      return { filePath, modifiedAt: fs.statSync(filePath).mtimeMs }
    })
    .sort((left, right) => right.modifiedAt - left.modifiedAt)

  const latest = summaries[0]
  if (latest === undefined) {
    throw new Error(`${directory}에 Turborepo summary가 없습니다.`)
  }
  return latest.filePath
}

export function resolveTaskExecutionStatus({
  requestedTask,
  summary,
  workspace,
}: {
  readonly requestedTask: string
  readonly summary?: TurboRunSummary
  readonly workspace: WorkspaceManifest
}): TaskExecutionStatus {
  const supportsTask =
    requestedTask === "audit" || workspace.scripts[requestedTask] !== undefined
  if (summary === undefined) return supportsTask ? "supported" : "excluded"

  const task = summary.tasks.find(
    (item) => item.packageName === workspace.name && item.task === requestedTask
  )
  if (task === undefined || task.command === null || task.exitCode === null) {
    return supportsTask ? "skipped" : "excluded"
  }
  if (task.exitCode !== 0) return "failed"
  if (task.cacheStatus === "HIT") return "cache-hit"
  return "executed"
}

export function formatTaskExecutionStatus(
  status: TaskExecutionStatus,
  task: string
): string {
  const taskCode = `\`${task}\``
  switch (status) {
    case "cache-hit":
      return `cache hit: ${taskCode}`
    case "excluded":
      return `제외: ${taskCode} 스크립트 없음`
    case "failed":
      return `실패: ${taskCode}`
    case "skipped":
      return `건너뜀: ${taskCode}`
    case "supported":
      return `지원: ${taskCode}`
    case "executed":
      return `실행: ${taskCode}`
  }
}

function readTurboTask(
  value: unknown,
  filePath: string,
  index: number
): TurboTaskSummary {
  if (!isObject(value)) {
    throw new Error(`${filePath} tasks[${index}]가 객체가 아닙니다.`)
  }
  const packageName = value["package"]
  const task = value["task"]
  const command = value["command"]
  const cache = value["cache"]
  const execution = value["execution"]
  if (typeof packageName !== "string" || typeof task !== "string") {
    throw new Error(`${filePath} tasks[${index}] 식별자가 올바르지 않습니다.`)
  }
  return {
    cacheStatus:
      isObject(cache) && typeof cache["status"] === "string"
        ? cache["status"]
        : null,
    command: typeof command === "string" ? command : null,
    exitCode:
      isObject(execution) && typeof execution["exitCode"] === "number"
        ? execution["exitCode"]
        : null,
    packageName,
    task,
  }
}

function isObject(
  value: unknown
): value is { readonly [key: string]: unknown } {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
