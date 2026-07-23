import { existsSync, mkdirSync, rmSync } from "node:fs"
import { basename, join } from "node:path"

import {
  aggregateLcovReports,
  assertLineCoverageThresholds,
  type LineCoverageThreshold,
} from "#scripts/coverage-report"
import {
  createWorkspaceInventory,
  formatWorkspaceInventoryError,
} from "#scripts/workspace-inventory"

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
      "src/app/_providers/admin-runtime-config.test.ts",
      "src/features/authentication/model/admin-auth-navigation.test.ts",
    ],
    path: "apps/admin",
    runtime: "node",
  },
  {
    coverageTests: ["src/composition/admin-route-composition.test.ts"],
    path: "apps/api",
    runtime: "bun",
  },
  {
    coverageTests: [
      "src/shared/config/runtime-config.test.ts",
      "src/shared/http/api-error.test.ts",
      "src/features/lesson-session/api/lesson-draft-storage.test.ts",
      "src/features/lesson-session/model/lesson-match-presentation.test.ts",
    ],
    path: "apps/web",
    runtime: "node",
  },
  {
    coverageTests: [
      "src/learner/test-auth-plugin.test.ts",
      "src/admin/server-integration.test.ts",
      "src/session-token.test.ts",
    ],
    path: "packages/infra/auth",
    runtime: "bun",
  },
  {
    coverageTests: ["src/input-limits.test.ts"],
    path: "packages/shared/contracts",
    runtime: "node",
  },
  {
    coverageTests: [
      "src/client.test.ts",
      "src/destructive-operation-guard.test.ts",
      "src/migration-runner.test.ts",
    ],
    path: "packages/infra/db",
    runtime: "bun",
  },
  {
    coverageTests: [
      "src/infrastructure/persistence/operations-repositories.test.ts",
      "src/interface/http/operations-http.test.ts",
    ],
    path: "packages/modules/operations",
    runtime: "bun",
  },
  {
    coverageTests: ["src/application/ai-feedback-application.test.ts"],
    path: "packages/modules/ai-feedback",
    runtime: "bun",
  },
  {
    coverageTests: ["src/application/content-application.test.ts"],
    path: "packages/modules/content",
    runtime: "bun",
  },
  {
    coverageTests: ["src/application/identity-service.test.ts"],
    path: "packages/modules/identity",
    runtime: "bun",
  },
  {
    coverageTests: ["src/test/application/learning-reporting.test.ts"],
    path: "packages/modules/learning",
    runtime: "bun",
  },
  {
    coverageTests: ["src/application/resource-tree-application.test.ts"],
    path: "packages/modules/resource-library",
    runtime: "bun",
  },
  { path: "packages/config/env", runtime: "node" },
  {
    coverageTests: ["src/json-transport.test.ts"],
    path: "packages/infra/http-client",
    runtime: "node",
  },
  {
    coverageTests: ["src/ai-infrastructure.test.ts"],
    path: "packages/infra/ai",
    runtime: "node",
  },
  {
    coverageTests: [
      "src/core/create-app.test.ts",
      "src/security/request-security.test.ts",
    ],
    path: "packages/infra/http-platform",
    runtime: "node",
  },
  {
    coverageTests: ["src/logger.test.ts"],
    path: "packages/infra/observability",
    runtime: "node",
  },
  {
    coverageTests: ["src/object-storage.test.ts"],
    path: "packages/infra/storage",
    runtime: "node",
  },
  {
    coverageTests: [
      "src/resource-markdown.test.ts",
      "src/resource-markdown-import.test.ts",
      "src/resource-image-node.test.ts",
    ],
    path: "packages/shared/resource-document",
    runtime: "node",
  },
  {
    coverageTests: [
      "src/components/lesson/match-answer.test.tsx",
      "src/lib/safe-navigation-path.test.ts",
    ],
    path: "packages/shared/ui",
    runtime: "node",
  },
]

const criticalCoverageThresholds: readonly LineCoverageThreshold[] = [
  {
    filePath: "src/features/authentication/model/admin-auth-navigation.ts",
    minimum: 75,
    reportDirectory: "apps-admin",
  },
  {
    filePath: "src/migration-runner.ts",
    minimum: 87,
    reportDirectory: "packages-db",
  },
  {
    filePath: "src/resource-markdown.ts",
    minimum: 87,
    reportDirectory: "packages-resource-document",
  },
]

const coverageDirectory = join(process.cwd(), "coverage")
const vitestExecutable = join(
  process.cwd(),
  "node_modules",
  "vitest",
  "vitest.mjs"
)
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
  await run(["bun", "--bun", vitestExecutable, "run"], project.path)
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
      vitestExecutable,
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
  const result = createWorkspaceInventory(process.cwd())
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

  for (const project of projects) {
    for (const testPath of project.coverageTests ?? []) {
      if (!existsSync(join(process.cwd(), project.path, testPath))) {
        throw new Error(
          `Coverage test 파일이 없습니다: ${project.path}/${testPath}`
        )
      }
    }
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
