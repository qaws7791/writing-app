import fs from "node:fs"
import path from "node:path"

type ComponentsBoundary = {
  readonly filePath: string
  readonly uiAlias: string
  readonly utilsAlias: string
}

const boundaries: readonly ComponentsBoundary[] = [
  {
    filePath: "packages/shared/ui/components.json",
    uiAlias: "@/components/ui",
    utilsAlias: "@/lib/utils",
  },
  {
    filePath: "apps/web/components.json",
    uiAlias: "@workspace/ui/components/ui",
    utilsAlias: "@workspace/ui/lib/utils",
  },
  {
    filePath: "apps/admin/components.json",
    uiAlias: "@workspace/ui/components/ui",
    utilsAlias: "@workspace/ui/lib/utils",
  },
]

const repositoryRoot = process.cwd()
const failures: string[] = []

for (const boundary of boundaries) {
  validateBoundary(boundary)
}

if (failures.length > 0) {
  console.error("Components config check failed.")

  for (const failure of failures) {
    console.error(`- ${failure}`)
  }

  process.exit(1)
}

console.log("Components config boundaries are valid.")

function validateBoundary({
  filePath,
  uiAlias,
  utilsAlias,
}: ComponentsBoundary) {
  const configPath = path.join(repositoryRoot, filePath)
  const config = readObject(configPath, filePath)
  if (config === null) return

  const aliases = readPropertyObject(config, "aliases", filePath)
  if (aliases !== null) {
    expectValue(aliases, "ui", uiAlias, filePath)
    expectValue(aliases, "utils", utilsAlias, filePath)
  }

  const tailwind = readPropertyObject(config, "tailwind", filePath)
  if (tailwind === null) return

  const cssTarget = tailwind["css"]
  if (typeof cssTarget !== "string" || cssTarget.length === 0) {
    failures.push(`${filePath} must declare a non-empty tailwind.css path.`)
    return
  }

  const absoluteCssTarget = path.resolve(path.dirname(configPath), cssTarget)
  const relativeCssTarget = path.relative(repositoryRoot, absoluteCssTarget)
  if (
    relativeCssTarget === ".." ||
    relativeCssTarget.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativeCssTarget)
  ) {
    failures.push(`${filePath} tailwind.css must stay inside the repository.`)
    return
  }

  if (
    !fs.existsSync(absoluteCssTarget) ||
    !fs.statSync(absoluteCssTarget).isFile()
  ) {
    failures.push(
      `${filePath} tailwind.css target does not exist: ${cssTarget}.`
    )
  }
}

function readObject(
  absolutePath: string,
  displayPath: string
): Record<string, unknown> | null {
  let value: unknown

  try {
    value = JSON.parse(fs.readFileSync(absolutePath, "utf8"))
  } catch {
    failures.push(`${displayPath} must contain a JSON object.`)
    return null
  }

  if (isObject(value)) return value

  failures.push(`${displayPath} must contain a JSON object.`)
  return null
}

function readPropertyObject(
  parent: Record<string, unknown>,
  property: string,
  filePath: string
): Record<string, unknown> | null {
  const value = parent[property]
  if (isObject(value)) return value

  failures.push(`${filePath} must declare an object ${property}.`)
  return null
}

function expectValue(
  parent: Record<string, unknown>,
  property: string,
  expected: string,
  filePath: string
) {
  const actual = parent[property]
  if (actual !== expected) {
    failures.push(
      `${filePath} aliases.${property} must be ${expected}, got ${String(actual)}.`
    )
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
