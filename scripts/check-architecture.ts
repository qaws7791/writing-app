import fs from "node:fs"
import path from "node:path"

interface RootManifest {
  readonly workspaces?: readonly string[]
}

interface DependencyCruiserViolation {
  readonly from: string
  readonly rule: {
    readonly name: string
  }
  readonly to: string
}

interface DependencyCruiserResult {
  readonly summary: {
    readonly violations: readonly DependencyCruiserViolation[]
  }
}

const repositoryRoot = path.resolve(import.meta.dir, "..")
const dependencyCruiserPath = path.join(
  repositoryRoot,
  "node_modules/.bin/depcruise"
)
const dependencyCruiserConfigPath = path.join(
  repositoryRoot,
  "dependency-cruiser.config.mjs"
)
const manifest = (await Bun.file(
  path.join(repositoryRoot, "package.json")
).json()) as RootManifest
const workspaceGlobs = manifest.workspaces

if (
  workspaceGlobs === undefined ||
  workspaceGlobs.some((workspaceGlob) => typeof workspaceGlob !== "string")
) {
  throw new Error("package.json workspaces를 읽을 수 없습니다.")
}

const workspaceDirectories = [
  ...new Set(
    workspaceGlobs.flatMap((workspaceGlob) =>
      [
        ...new Bun.Glob(`${workspaceGlob}/package.json`).scanSync({
          cwd: repositoryRoot,
          onlyFiles: true,
        }),
      ].map((manifestPath) => path.dirname(manifestPath))
    )
  ),
].sort()

let checkedWorkspaceCount = 0

for (const workspaceDirectory of workspaceDirectories) {
  const tsconfigPath = path.join(
    repositoryRoot,
    workspaceDirectory,
    "tsconfig.json"
  )
  if (!fs.existsSync(tsconfigPath)) continue

  const child = Bun.spawn(
    [
      dependencyCruiserPath,
      workspaceDirectory,
      "--config",
      dependencyCruiserConfigPath,
      "--ts-config",
      tsconfigPath,
      "--output-type",
      "err",
    ],
    {
      cwd: repositoryRoot,
      stderr: "inherit",
      stdout: "inherit",
    }
  )

  if ((await child.exited) !== 0) {
    throw new Error(`${workspaceDirectory} dependency 검사가 실패했습니다.`)
  }

  checkedWorkspaceCount += 1
}

await verifyArchitectureViolationFixtures()

console.log(
  `Architecture 검사가 ${checkedWorkspaceCount}개 workspace를 통과했습니다.`
)

async function verifyArchitectureViolationFixtures(): Promise<void> {
  const fixtureDirectory = path.join(
    repositoryRoot,
    "scripts/architecture/fixtures"
  )
  const child = Bun.spawn(
    [
      dependencyCruiserPath,
      ".",
      "--config",
      dependencyCruiserConfigPath,
      "--ts-config",
      path.join(fixtureDirectory, "tsconfig.json"),
      "--output-type",
      "json",
    ],
    {
      cwd: fixtureDirectory,
      stderr: "pipe",
      stdout: "pipe",
    }
  )
  const [exitCode, stderr, stdout] = await Promise.all([
    child.exited,
    new Response(child.stderr).text(),
    new Response(child.stdout).text(),
  ])

  if (exitCode !== 0) {
    throw new Error(
      `Architecture 위반 fixture 실행이 실패했습니다.\n${stderr.trim()}`
    )
  }

  const result = JSON.parse(stdout) as DependencyCruiserResult
  const actualViolations = result.summary.violations
    .map(({ from, rule, to }) => `${rule.name}|${from}|${to}`)
    .sort()
  const expectedViolations = [
    "external-consumers-use-module-public-exports|apps/api/forbidden-private-module-import.ts|packages/modules/content/src/domain/private-target.ts",
    "frontends-import-approved-workspace-packages-only|apps/web/forbidden-cross-app-import.ts|apps/admin/cross-app-target.ts",
    "frontends-import-approved-workspace-packages-only|apps/web/forbidden-workspace-import.ts|packages/shared/types/src/private-target.ts",
    "module-domain-application-do-not-import-framework-or-db|packages/modules/content/src/application/forbidden-database-import.ts|drizzle-orm",
    "module-domain-application-do-not-import-framework-or-db|packages/modules/content/src/domain/forbidden-framework-import.ts|hono",
    "modules-use-other-module-public-exports|packages/modules/learning/src/application/forbidden-private-content-import.ts|packages/modules/content/src/domain/private-target.ts",
  ].sort()

  if (JSON.stringify(actualViolations) !== JSON.stringify(expectedViolations)) {
    throw new Error(
      [
        "Architecture 위반 fixture 결과가 예상과 다릅니다.",
        `예상: ${expectedViolations.join(", ")}`,
        `실제: ${actualViolations.join(", ")}`,
      ].join("\n")
    )
  }
}
