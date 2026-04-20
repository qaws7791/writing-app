import fs from "node:fs"
import path from "node:path"
import { spawnSync } from "node:child_process"

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, "/")
}

function resolveWorkspaceRoot(filePath: string): string | null {
  const [scope, name] = normalizePath(filePath).split("/")

  if (!scope || !name) {
    return null
  }

  if (scope !== "apps" && scope !== "packages") {
    return null
  }

  return `${scope}/${name}`
}

function hasLintScript(workspaceRoot: string): boolean {
  const packageJsonPath = path.join(
    process.cwd(),
    workspaceRoot,
    "package.json"
  )

  if (!fs.existsSync(packageJsonPath)) {
    return false
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as {
    scripts?: { lint?: unknown }
  }

  return typeof packageJson.scripts?.lint === "string"
}

const workspaceRoots = [
  ...new Set(process.argv.slice(2).map(resolveWorkspaceRoot)),
]
  .filter((workspaceRoot): workspaceRoot is string => workspaceRoot !== null)
  .filter(hasLintScript)

if (workspaceRoots.length === 0) {
  process.exit(0)
}

const turboBinary = path.resolve(process.cwd(), "node_modules/.bin/turbo.exe")
const filters = workspaceRoots.flatMap((workspaceRoot) => [
  "--filter",
  `{./${workspaceRoot}}`,
])

const result = spawnSync(turboBinary, ["run", "lint", "--only", ...filters], {
  cwd: process.cwd(),
  stdio: "inherit",
})

process.exit(result.status ?? 1)
