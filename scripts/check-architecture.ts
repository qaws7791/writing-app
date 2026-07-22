import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import {
  createWorkspaceInventory,
  formatWorkspaceInventoryError,
} from "#scripts/workspace-inventory"

type DependencyCruiserResult = {
  readonly modules?: readonly {
    readonly dependencies?: readonly {
      readonly dependencyTypes?: readonly string[]
      readonly module?: string
    }[]
  }[]
  readonly summary?: {
    readonly error?: number
    readonly violations?: readonly {
      readonly rule?: { readonly name?: string }
    }[]
  }
}

const repositoryRoot = process.cwd()
const dependencyCruiserExecutable = path.join(
  repositoryRoot,
  "node_modules/.bin/depcruise"
)
const dependencyCruiserConfig = path.join(
  repositoryRoot,
  "dependency-cruiser.config.mjs"
)

const inventoryResult = createWorkspaceInventory(repositoryRoot)
if (inventoryResult.status === "failure") {
  throw new Error(
    inventoryResult.errors.map(formatWorkspaceInventoryError).join("\n")
  )
}

for (const workspace of inventoryResult.inventory.allWorkspaces) {
  const tsconfigPath = path.join(
    repositoryRoot,
    workspace.directory,
    "tsconfig.json"
  )
  if (!fs.existsSync(tsconfigPath)) continue

  await runDependencyCruiser({
    cwd: repositoryRoot,
    outputType: "err",
    target: workspace.directory,
    tsconfigPath,
  })
}

await verifyArchitectureFixtures()

console.log(
  `Architecture 검사가 ${inventoryResult.inventory.allWorkspaces.length}개 workspace inventory와 fixture를 통과했습니다.`
)

async function verifyArchitectureFixtures(): Promise<void> {
  const fixtureRoot = path.join(
    repositoryRoot,
    "scripts/fixtures/dependency-cruiser"
  )
  const allowedResult = await runDependencyCruiser({
    cwd: path.join(fixtureRoot, "allowed"),
    outputType: "json",
    target: ".",
    tsconfigPath: path.join(fixtureRoot, "allowed/tsconfig.json"),
  })
  const allowedReport = parseReport(allowedResult.stdout)
  if ((allowedReport.summary?.error ?? 0) !== 0) {
    throw new Error("dependency-cruiser 허용 fixture가 거부되었습니다.")
  }

  const forbiddenFixtureRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "dependency-cruiser-forbidden-")
  )
  fs.cpSync(path.join(fixtureRoot, "forbidden"), forbiddenFixtureRoot, {
    recursive: true,
  })
  const transitivePackageRoot = path.join(
    forbiddenFixtureRoot,
    "node_modules/transitive-fixture"
  )
  fs.mkdirSync(transitivePackageRoot, { recursive: true })
  fs.writeFileSync(
    path.join(transitivePackageRoot, "package.json"),
    JSON.stringify({
      exports: "./index.js",
      name: "transitive-fixture",
      version: "1.0.0",
    })
  )
  fs.writeFileSync(
    path.join(transitivePackageRoot, "index.js"),
    "export const transitiveValue = 'transitive'\n"
  )
  const reactPackageRoot = path.join(forbiddenFixtureRoot, "node_modules/react")
  fs.mkdirSync(reactPackageRoot, { recursive: true })
  fs.writeFileSync(
    path.join(reactPackageRoot, "package.json"),
    JSON.stringify({ exports: "./index.js", name: "react", version: "1.0.0" })
  )
  fs.writeFileSync(
    path.join(reactPackageRoot, "index.js"),
    "export const createElement = () => null\n"
  )

  let forbiddenReport: DependencyCruiserResult
  try {
    const forbiddenResult = await runDependencyCruiser({
      cwd: forbiddenFixtureRoot,
      outputType: "json",
      target: ".",
      tsconfigPath: path.join(forbiddenFixtureRoot, "tsconfig.json"),
    })
    forbiddenReport = parseReport(forbiddenResult.stdout)
  } finally {
    fs.rmSync(forbiddenFixtureRoot, { force: true, recursive: true })
  }
  const actualRuleNames = new Set(
    forbiddenReport.summary?.violations?.flatMap(({ rule }) =>
      rule?.name === undefined ? [] : [rule.name]
    ) ?? []
  )
  const expectedRuleNames = [
    "application-does-not-import-concrete-adapters",
    "domain-is-layer-pure",
    "domain-does-not-import-runtime-frameworks",
    "module-schema-and-seed-are-tooling-only",
    "module-domain-and-application-do-not-import-http-contracts",
    "modules-do-not-import-other-module-internals",
    "no-circular-runtime-dependencies",
    "no-unlisted-dependencies",
  ]
  const missingRuleNames = expectedRuleNames.filter(
    (ruleName) => !actualRuleNames.has(ruleName)
  )

  if (
    (forbiddenReport.summary?.error ?? 0) === 0 ||
    missingRuleNames.length > 0
  ) {
    const transitiveTypes = forbiddenReport.modules
      ?.flatMap(({ dependencies }) => dependencies ?? [])
      .find(({ module }) => module === "transitive-fixture")?.dependencyTypes
    throw new Error(
      `dependency-cruiser 금지 fixture가 필요한 규칙을 검증하지 못했습니다: ${missingRuleNames.join(", ")} (actual: ${[...actualRuleNames].sort().join(", ")}; transitive: ${transitiveTypes?.join(", ") ?? "not-found"})`
    )
  }
}

function parseReport(output: string): DependencyCruiserResult {
  const value: unknown = JSON.parse(output)
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("dependency-cruiser가 JSON object를 반환해야 합니다.")
  }
  return value as DependencyCruiserResult
}

async function runDependencyCruiser({
  cwd,
  outputType,
  target,
  tsconfigPath,
}: {
  readonly cwd: string
  readonly outputType: "err" | "json"
  readonly target: string
  readonly tsconfigPath: string
}): Promise<{ readonly exitCode: number; readonly stdout: string }> {
  const child = Bun.spawn(
    [
      dependencyCruiserExecutable,
      target,
      "--config",
      dependencyCruiserConfig,
      "--ts-config",
      tsconfigPath,
      "--output-type",
      outputType,
    ],
    {
      cwd,
      stderr: outputType === "err" ? "inherit" : "pipe",
      stdout: "pipe",
    }
  )
  const stdout = await new Response(child.stdout).text()
  const stderr =
    outputType === "err" ? "" : await new Response(child.stderr).text()
  const exitCode = await child.exited

  if (exitCode !== 0) {
    process.stderr.write(stdout)
    process.stderr.write(stderr)
    throw new Error(`${cwd} dependency-cruiser 검사가 실패했습니다.`)
  }
  if (outputType === "err" && stdout.length > 0) process.stdout.write(stdout)

  return { exitCode, stdout }
}
