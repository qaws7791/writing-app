import fs from "node:fs"
import path from "node:path"

type Guardrail = {
  readonly baseline: number
  readonly description: string
  readonly label: string
  readonly pattern: RegExp
  readonly roots: readonly string[]
}

const legacyAdminDesignClassPattern = String.raw`(?:admin-(?:shell(?:__content)?|sidebar(?:__(?:brand|mark|nav|link))?|header|panel|grid|alert|metric-grid|metric-card(?:__label)?|section-heading|toolbar|inline-status|table(?:__title|-wrap)?|course-title-cell|course-thumbnail|status-pill|dialog(?:-backdrop|__actions)?|row-actions|resource-(?:create-panel|form|list(?:-item(?:__icon)?)?)|chat-(?:layout|sidebar-panel|conversation-list|conversation|panel|messages|empty|message|form)|auth-(?:page|card(?:__mark)?|form)|inline-error|form-field)|settings-grid|analytics-grid|course-editor(?:-list|-form-grid|__(?:read-only|summary|workspace))|step-form-(?:list|card|help)|lesson-preview-card)`

const legacyAdminDesignClassRegex = new RegExp(
  [
    String.raw`\.(?:${legacyAdminDesignClassPattern})\b`,
    String.raw`className="[^"]*\b(?:${legacyAdminDesignClassPattern})\b[^"]*"`,
    String.raw`className='[^']*\b(?:${legacyAdminDesignClassPattern})\b[^']*'`,
    `className=\\{\`[^\`]*\\b(?:${legacyAdminDesignClassPattern})\\b[^\`]*\`\\}`,
    String.raw`className=\{[^}\n]*\b(?:${legacyAdminDesignClassPattern})\b[^}\n]*\}`,
  ].join("|"),
  "g"
)

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
    baseline: 0,
    description: "apps/admin/src의 legacy admin 디자인 class 기준선",
    label: "legacy admin design class",
    pattern: legacyAdminDesignClassRegex,
    roots: ["apps/admin/src"],
  },
  {
    baseline: 0,
    description:
      "apps/**의 fontSize, lineHeight, letterSpacing inline style 기준선",
    label: "inline typography style",
    pattern:
      /style=\{\{[\s\S]*?(?:fontSize|lineHeight|letterSpacing)[\s\S]*?\}\}/g,
    roots: ["apps"],
  },
  {
    baseline: 47,
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
