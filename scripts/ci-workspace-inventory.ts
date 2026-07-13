import { appendFileSync } from "node:fs"

import {
  createRepositoryWorkspaceInventory,
  findLatestTurboRunSummary,
  formatTaskExecutionStatus,
  formatWorkspaceInventoryError,
  readTurboRunSummary,
  resolveTaskExecutionStatus,
} from "@workspace/repository-tooling"

const arguments_ = process.argv.slice(2)
const summaryDirectoryArgument = arguments_.find((argument) =>
  argument.startsWith("--summary-directory=")
)
const requestedScripts = arguments_.filter(
  (argument) => !argument.startsWith("--summary-directory=")
)
const rows = ["| workspace | CI 범위 |", "| --- | --- |"]

const inventoryResult = createRepositoryWorkspaceInventory(process.cwd())

if (inventoryResult.status === "failure") {
  throw new Error(
    inventoryResult.errors.map(formatWorkspaceInventoryError).join("\n")
  )
}

const summary =
  summaryDirectoryArgument === undefined
    ? undefined
    : readTurboRunSummary(
        findLatestTurboRunSummary(summaryDirectoryArgument.split("=")[1] ?? "")
      )

for (const workspace of inventoryResult.inventory.allWorkspaces) {
  const statuses = requestedScripts.map((script) =>
    formatTaskExecutionStatus(
      resolveTaskExecutionStatus({
        requestedTask: script,
        summary,
        workspace,
      }),
      script
    )
  )
  rows.push(`| \`${workspace.name}\` | ${statuses.join(", ")} |`)
}

const summaryMarkdown = [
  `## ${inventoryResult.inventory.allWorkspaces.length}개 workspace 검증 인벤토리`,
  "",
  ...rows,
  "",
].join("\n")
console.log(summaryMarkdown)

const summaryPath = process.env["GITHUB_STEP_SUMMARY"]

if (summaryPath !== undefined) {
  appendFileSync(summaryPath, summaryMarkdown)
}
