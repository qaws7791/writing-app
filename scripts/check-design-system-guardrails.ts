import fs from "node:fs"
import path from "node:path"

export type Guardrail = {
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

const ignoredHexPaths = [
  // Web manifest 색상은 CSS token을 참조할 수 없어 정적 색상 문자열이 필요하다.
  "apps/web/src/app/manifest.ts",
] as const
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
    description: "apps/**, packages/**의 legacy button motion class 기준선",
    label: "legacy button motion class",
    pattern: /\bbtn-squish\b/g,
    roots: ["apps", "packages"],
  },
  {
    baseline: 0,
    description: "apps/**, packages/**의 미정의 semantic color alias 기준선",
    label: "legacy semantic color alias",
    pattern: /--semantic-color-[a-z0-9-]+/g,
    roots: ["apps", "packages"],
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
    baseline: 32,
    description: "apps/**의 raw hex color 기준선",
    label: "raw hex color",
    pattern: /#[0-9a-fA-F]{3,8}\b/g,
    roots: ["apps"],
  },
] as const

const repositoryRoot = process.cwd()

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

export function countGuardrailMatches(
  guardrail: Guardrail,
  root: string = repositoryRoot
): number {
  const files = guardrail.roots.flatMap((scanRoot) =>
    collectFiles(path.join(root, scanRoot))
  )

  const scopedFiles =
    guardrail.label === "raw hex color" ||
    guardrail.label === "inline typography style"
      ? files.filter(
          (filePath) =>
            !ignoredHexPaths.some((ignoredPath) =>
              filePath.includes(ignoredPath.replace(/\//g, path.sep))
            )
        )
      : files

  return scopedFiles.reduce((count, filePath) => {
    const content = fs.readFileSync(filePath, "utf8")

    return count + [...content.matchAll(guardrail.pattern)].length
  }, 0)
}

export function evaluateGuardrails(
  configuredGuardrails: readonly Guardrail[],
  root: string = repositoryRoot
): {
  readonly failures: readonly string[]
  readonly summaries: readonly string[]
} {
  const failures: string[] = []
  const summaries: string[] = []

  for (const guardrail of configuredGuardrails) {
    const count = countGuardrailMatches(guardrail, root)

    if (count > guardrail.baseline) {
      failures.push(
        `${guardrail.label} increased from ${guardrail.baseline} to ${count}. ${guardrail.description}을 초과했다.`
      )
      continue
    }

    if (count < guardrail.baseline) {
      failures.push(
        `${guardrail.label} decreased from ${guardrail.baseline} to ${count}. 실제 감소를 새 baseline으로 반영해야 한다.`
      )
      continue
    }

    summaries.push(
      `${guardrail.label}: ${count}/${guardrail.baseline} (${guardrail.description})`
    )
  }

  return { failures, summaries }
}

if (import.meta.main) {
  const result = evaluateGuardrails(guardrails)

  for (const summary of result.summaries) {
    console.log(summary)
  }

  if (result.failures.length > 0) {
    console.error("Design system guardrail check failed.")

    for (const failure of result.failures) {
      console.error(`- ${failure}`)
    }

    process.exit(1)
  }

  console.log("Design system guardrails are within baseline.")
}
