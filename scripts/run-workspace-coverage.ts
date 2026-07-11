import { mkdirSync, readFileSync, rmSync } from "node:fs"
import { basename, join } from "node:path"

type CoverageProject = {
  readonly path: string
  readonly bunCoverageTests?: readonly string[]
  readonly coverageTests?: readonly string[]
}

const projects: readonly CoverageProject[] = [
  {
    coverageTests: [
      "src/runtime-config.test.ts",
      "src/lib/auth/admin-auth-navigation.test.ts",
    ],
    path: "apps/admin",
  },
  { bunCoverageTests: ["src/architecture.test.ts"], path: "apps/admin-api" },
  { bunCoverageTests: ["src/architecture.test.ts"], path: "apps/api" },
  {
    coverageTests: [
      "src/runtime-config.test.ts",
      "src/lib/api/api-error.test.ts",
    ],
    path: "apps/web",
  },
  { coverageTests: ["src/input-limits.test.ts"], path: "packages/contracts" },
  {
    bunCoverageTests: [
      "src/modules/admin/infrastructure/persistence/admin-drizzle.repository.test.ts",
    ],
    path: "packages/core",
  },
  {
    bunCoverageTests: [
      "src/client.test.ts",
      "src/destructive-operation-guard.test.ts",
      "src/migrations/baseline-migration.test.ts",
    ],
    path: "packages/db",
  },
  { path: "packages/env" },
  {
    coverageTests: ["src/security/request-security.test.ts"],
    path: "packages/hono",
  },
  { coverageTests: ["src/index.test.ts"], path: "packages/http-client" },
  { coverageTests: ["src/logger.test.ts"], path: "packages/logger" },
  {
    coverageTests: ["src/resource-collaboration.test.ts"],
    path: "packages/resource-document",
  },
  {
    coverageTests: [
      "src/lib/safe-navigation-path.test.ts",
      "src/lib/lesson-draft-storage.test.ts",
    ],
    path: "packages/ui",
  },
]

const coverageDirectory = join(process.cwd(), "coverage")
rmSync(coverageDirectory, { force: true, recursive: true })
mkdirSync(coverageDirectory, { recursive: true })

for (const project of projects) {
  const slug = `${project.path.split("/")[0]}-${basename(project.path)}`
  const reportsDirectory = join(coverageDirectory, slug)
  console.log(`\n[coverage] ${project.path}`)

  if (project.bunCoverageTests !== undefined) {
    await run(
      ["bun", "--bun", "../../node_modules/vitest/vitest.mjs", "run"],
      project.path
    )
    await run(
      [
        "bun",
        "test",
        ...project.bunCoverageTests,
        "--coverage",
        "--coverage-skip-test-files",
        "--coverage-reporter=lcov",
        `--coverage-dir=${reportsDirectory}`,
      ],
      project.path
    )
    continue
  }

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

assertCriticalCoverage()
console.log(`\n[coverage] ${projects.length}개 runtime workspace 완료`)

function assertCriticalCoverage(): void {
  const thresholds = [
    ["apps-admin", "src/lib/auth/admin-auth-navigation.ts", 1],
    [
      "packages-core",
      "src/modules/admin/infrastructure/persistence/admin-drizzle.repository.ts",
      1,
    ],
    ["packages-db", "src/migrations/migrate.ts", 1],
    ["packages-resource-document", "src/resource-collaboration.ts", 1],
  ] as const

  for (const [slug, filePath, minimum] of thresholds) {
    const lcov = readFileSync(
      join(coverageDirectory, slug, "lcov.info"),
      "utf8"
    )
    const normalizedPath = filePath.replaceAll("/", "\\")
    const block = lcov
      .split("end_of_record")
      .find((record) => record.replaceAll("/", "\\").includes(normalizedPath))

    if (block === undefined) {
      throw new Error(`핵심 coverage 파일이 없습니다: ${filePath}`)
    }

    const found = Number(block.match(/\nLF:(\d+)/)?.[1] ?? 0)
    const hit = Number(block.match(/\nLH:(\d+)/)?.[1] ?? 0)
    const percentage = found === 0 ? 0 : (hit / found) * 100

    if (percentage < minimum) {
      throw new Error(
        `${filePath} line coverage ${percentage.toFixed(2)}%가 ${minimum}% 미만입니다.`
      )
    }
  }
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
