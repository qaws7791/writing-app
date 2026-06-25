import fs from "node:fs"
import path from "node:path"

type Guardrail = {
  readonly baseline: number
  readonly description: string
  readonly label: string
  readonly pattern: RegExp
  readonly roots: readonly string[]
}

const ignoredDirectories = new Set([
  ".next",
  ".turbo",
  "coverage",
  "dist",
  "node_modules",
])
const scannedExtensions = new Set([".css", ".ts", ".tsx"])

const guardrails: readonly Guardrail[] = [
  {
    baseline: 387,
    description: "apps/admin/src의 기존 admin-* class 기준선",
    label: "admin class",
    pattern: /\badmin-[a-z0-9_-]+\b/g,
    roots: ["apps/admin/src"],
  },
  {
    baseline: 111,
    description:
      "apps/**의 fontSize, lineHeight, letterSpacing inline style 기준선",
    label: "inline typography style",
    pattern:
      /style=\{\{[\s\S]*?(?:fontSize|lineHeight|letterSpacing)[\s\S]*?\}\}/g,
    roots: ["apps"],
  },
  {
    baseline: 67,
    description: "apps/**의 raw hex color 기준선",
    label: "raw hex color",
    pattern: /#[0-9a-fA-F]{3,8}\b/g,
    roots: ["apps"],
  },
] as const

const repositoryRoot = process.cwd()
const failures: string[] = []

function collectFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) {
    return []
  }

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      return ignoredDirectories.has(entry.name) ? [] : collectFiles(entryPath)
    }

    return scannedExtensions.has(path.extname(entry.name)) ? [entryPath] : []
  })
}

function countMatches(guardrail: Guardrail): number {
  return guardrail.roots
    .flatMap((root) => collectFiles(path.join(repositoryRoot, root)))
    .reduce((count, filePath) => {
      const content = fs.readFileSync(filePath, "utf8")

      return count + [...content.matchAll(guardrail.pattern)].length
    }, 0)
}

for (const guardrail of guardrails) {
  const count = countMatches(guardrail)

  if (count > guardrail.baseline) {
    failures.push(
      `${guardrail.label} increased from ${guardrail.baseline} to ${count}. ${guardrail.description}을 초과했다.`
    )
  } else {
    console.log(
      `${guardrail.label}: ${count}/${guardrail.baseline} (${guardrail.description})`
    )
  }
}

if (failures.length > 0) {
  console.error("Design system guardrail check failed.")

  for (const failure of failures) {
    console.error(`- ${failure}`)
  }

  process.exit(1)
}

console.log("Design system guardrails are within baseline.")
