import { mkdirSync, rmSync } from "node:fs"
import { basename, join } from "node:path"

import {
  aggregateLcovReports,
  assertLineCoverageThresholds,
  createRepositoryWorkspaceInventory,
  formatWorkspaceInventoryError,
  type LineCoverageThreshold,
} from "@workspace/repository-tooling"

type BunCoverageProject = {
  readonly coverageTests: readonly string[]
  readonly path: string
  readonly runtime: "bun"
}

type NodeCoverageProject = {
  readonly coverageTests?: readonly string[]
  readonly path: string
  readonly runtime: "node"
}

type CoverageProject = BunCoverageProject | NodeCoverageProject

const projects: readonly CoverageProject[] = [
  {
    coverageTests: [
      "src/runtime-config.test.ts",
      "src/lib/auth/admin-auth-navigation.test.ts",
    ],
    path: "apps/admin",
    runtime: "node",
  },
  {
    coverageTests: ["src/architecture.test.ts"],
    path: "apps/admin-api",
    runtime: "bun",
  },
  {
    coverageTests: ["src/architecture.test.ts"],
    path: "apps/api",
    runtime: "bun",
  },
  {
    coverageTests: [
      "src/runtime-config.test.ts",
      "src/lib/api/api-error.test.ts",
    ],
    path: "apps/web",
    runtime: "node",
  },
  {
    coverageTests: ["src/input-limits.test.ts"],
    path: "packages/contracts",
    runtime: "node",
  },
  {
    coverageTests: [
      "src/modules/admin/infrastructure/persistence/admin-drizzle.repository.test.ts",
    ],
    path: "packages/core",
    runtime: "bun",
  },
  {
    coverageTests: [
      "src/client.test.ts",
      "src/destructive-operation-guard.test.ts",
      "src/migrations/baseline-migration.test.ts",
    ],
    path: "packages/db",
    runtime: "bun",
  },
  { path: "packages/env", runtime: "node" },
  {
    coverageTests: ["src/security/request-security.test.ts"],
    path: "packages/hono",
    runtime: "node",
  },
  {
    coverageTests: ["src/index.test.ts"],
    path: "packages/http-client",
    runtime: "node",
  },
  {
    coverageTests: ["src/logger.test.ts"],
    path: "packages/logger",
    runtime: "node",
  },
  {
    coverageTests: ["src/resource-collaboration.test.ts"],
    path: "packages/resource-document",
    runtime: "node",
  },
  {
    coverageTests: [
      "src/lib/safe-navigation-path.test.ts",
      "src/lib/lesson-draft-storage.test.ts",
    ],
    path: "packages/ui",
    runtime: "node",
  },
]

const criticalCoverageThresholds: readonly LineCoverageThreshold[] = [
  {
    filePath: "src/lib/auth/admin-auth-navigation.ts",
    minimum: 75,
    reportDirectory: "apps-admin",
  },
  {
    filePath:
      "src/modules/admin/infrastructure/persistence/admin-drizzle.repository.ts",
    minimum: 100,
    reportDirectory: "packages-core",
  },
  {
    filePath: "src/migrations/migrate.ts",
    minimum: 87,
    reportDirectory: "packages-db",
  },
  {
    filePath: "src/resource-collaboration.ts",
    minimum: 87,
    reportDirectory: "packages-resource-document",
  },
]

const coverageDirectory = join(process.cwd(), "coverage")
const coverageStartedAt = performance.now()
validateCoverageInventory()
rmSync(coverageDirectory, { force: true, recursive: true })
mkdirSync(coverageDirectory, { recursive: true })

for (const project of projects) {
  const startedAt = performance.now()
  const slug = `${project.path.split("/")[0]}-${basename(project.path)}`
  const reportsDirectory = join(coverageDirectory, slug)
  console.log(`\n[coverage] ${project.path}`)

  await runCoverageProject(project, reportsDirectory)
  console.log(
    `[coverage] ${project.path} ${formatDuration(performance.now() - startedAt)}`
  )
}

aggregateLcovReports({
  coverageDirectory,
  reportDirectories: projects.map(
    (project) => `${project.path.split("/")[0]}-${basename(project.path)}`
  ),
})
assertLineCoverageThresholds({
  coverageDirectory,
  thresholds: criticalCoverageThresholds,
})
console.log(
  `\n[coverage] ${projects.length}개 runtime workspace ${formatDuration(performance.now() - coverageStartedAt)} 완료`
)

async function runCoverageProject(
  project: CoverageProject,
  reportsDirectory: string
): Promise<void> {
  if (project.runtime === "bun") {
    await runBunCoverage(project, reportsDirectory)
    return
  }

  await runNodeCoverage(project, reportsDirectory)
}

async function runBunCoverage(
  project: BunCoverageProject,
  reportsDirectory: string
): Promise<void> {
  await run(
    ["bun", "--bun", "../../node_modules/vitest/vitest.mjs", "run"],
    project.path
  )
  await run(
    [
      "bun",
      "test",
      ...project.coverageTests,
      "--coverage",
      "--coverage-skip-test-files",
      "--coverage-reporter=lcov",
      `--coverage-dir=${reportsDirectory}`,
    ],
    project.path
  )
}

async function runNodeCoverage(
  project: NodeCoverageProject,
  reportsDirectory: string
): Promise<void> {
  await run(
    [
      "node",
      "../../node_modules/vitest/vitest.mjs",
      "run",
      ...(project.coverageTests ?? []),
      "--coverage",
      "--coverage.provider=v8",
      `--coverage.reportsDirectory=${reportsDirectory}`,
      "--coverage.reporter=text",
      "--coverage.reporter=json-summary",
      "--coverage.reporter=lcov",
      "--coverage.include=src/**/*.{ts,tsx}",
      "--coverage.exclude=src/**/*.test.*",
      "--coverage.exclude=src/**/*.spec.*",
      "--coverage.exclude=src/**/*.stories.*",
      "--coverage.exclude=src/**/*.d.ts",
      "--coverage.exclude=src/**/*.generated.*",
    ],
    project.path
  )
}

function validateCoverageInventory(): void {
  const result = createRepositoryWorkspaceInventory(process.cwd())
  if (result.status === "failure") {
    throw new Error(result.errors.map(formatWorkspaceInventoryError).join("\n"))
  }

  const expected = result.inventory.coverageTargets
    .map(({ directory }) => directory)
    .sort()
  const actual = projects.map(({ path: projectPath }) => projectPath).sort()

  if (expected.join("\n") !== actual.join("\n")) {
    throw new Error(
      `Coverage inventory가 일치하지 않습니다.\nexpected: ${expected.join(", ")}\nactual: ${actual.join(", ")}`
    )
  }
}

function formatDuration(milliseconds: number): string {
  return `${(milliseconds / 1_000).toFixed(2)}s`
}

async function run(command: readonly string[], cwd: string): Promise<void> {
  const child = Bun.spawn(command, {
    cwd,
    env: { ...Bun.env, CI: "true" },
    stderr: "inherit",
    stdout: "inherit",
  })
  const exitCode = await child.exited

  if (exitCode !== 0) {
    throw new Error(`${cwd} 명령이 실패했습니다: ${command.join(" ")}`)
  }
}
